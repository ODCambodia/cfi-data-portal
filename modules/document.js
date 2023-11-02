import multer from 'multer';
import xml2js from 'xml2js';
import fs from 'fs';

const GEOSERVER_AUTH = {
  user: process.env.GEOSERVER_USERNAME || 'admin',
  password: process.env.GEOSERVER_PASSWORD || 'geoserver',
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.NODE_PATH + '/assets/documents');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '_' + file.originalname);
  }
});

const upload = multer({ storage: storage });

const handleCreate = async function (req, res) {
  let server = ''
  if (req.params.server === 'cfi' || req.params.server === 'cfr') {
    server = req.params.server;
  } else {
    return res.status(400).json({ error: 'Invalid Server Param' });
  }

  try {
    const template = `<wfs:Transaction
      version="2.0.0"
      service="WFS"
      xmlns:${server}="${server}"
      xmlns:fes="http://www.opengis.net/fes/2.0"
      xmlns:gml="http://www.opengis.net/gml/3.2"
      xmlns:wfs="http://www.opengis.net/wfs/2.0"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:schemaLocation="http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0/wfs.xsd
                          http://www.opengis.net/gml/3.2 http://schemas.opengis.net/gml/3.2.1/gml.xsd">
      <wfs:Insert>
        <${server}:documents>
          <${server}:geom>
            <gml:Point srsName="http://www.opengis.net/def/crs/epsg/0/32648">
              <gml:pos>random</gml:pos>
            </gml:Point>
          </${server}:geom>
          <${server}:title>Title</${server}:title>
          <${server}:title_en>Title_en</${server}:title_en>
          <${server}:contentType>application/pdf</${server}:contentType>
          <${server}:url>random</${server}:url>
        </${server}:documents>
      </wfs:Insert>
    </wfs:Transaction>`;

    const xmlData = await xml2js.parseStringPromise(template);
    const cfiDocuments = xmlData['wfs:Transaction']['wfs:Insert'][0][`${server}:documents`][0];
    cfiDocuments[`${server}:geom`][0]['gml:Point'][0]['gml:pos'] = req.body.pos;
    cfiDocuments[`${server}:title`] = req.body.title;
    cfiDocuments[`${server}:title_en`] = req.body.title_en;
    cfiDocuments[`${server}:contentType`] = req.files[0].mimetype;
    cfiDocuments[`${server}:url`] = req.files[0].path.replace('assets', '').replaceAll('\\','/');

    const builder = new xml2js.Builder();
    const xml = builder.buildObject(xmlData);

    const uploadResponse = await fetch('https://staging.fia.db.opendevcam.net/geoserver/wfs', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(GEOSERVER_AUTH.user + ':' + GEOSERVER_AUTH.password)
      },
      body: xml
    });

    if (uploadResponse.status === 200) {
      return res.json({ message: "Successfully uploaded files", status: 201 });
    }

  } catch (e) {
    console.warn(e);
  }

  return res.status(500).json({ message: "Something went wrong" });
}

const handleDelete = async function (req, res) {
  if (!req.params.id || Number.isNaN(Number(req.params.id))) {
    return res.status(400).json({ error: 'Invalid or no documents ID passed' });
  }

  if (typeof req.body.fileName !== 'string' || !req.body.fileName) {
    return res.status(400).json({ error: 'Invalid FileName' });
  }

  let server = ''
  if (req.params.server === 'cfi' || req.params.server === 'cfr') {
    server = req.params.server;
  } else {
    return res.status(400).json({ error: 'Invalid Server Param' });
  }

  const id = Number(req.params.id);
  const xml = `<wfs:Transaction
    version="2.0.0"
    service="WFS"
    xmlns:${server}="${server}"
    xmlns:fes="http://www.opengis.net/fes/2.0"
    xmlns:gml="http://www.opengis.net/gml/3.2"
    xmlns:wfs="http://www.opengis.net/wfs/2.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0/wfs.xsd
                        http://www.opengis.net/gml/3.2 http://schemas.opengis.net/gml/3.2.1/gml.xsd">
    <wfs:Delete typeName="${server}:documents">
      <fes:Filter>
        <fes:ResourceId rid="documents.${id}"/>
      </fes:Filter>
    </wfs:Delete>
  </wfs:Transaction>`;

  try {
    const uploadResponse = await fetch('https://staging.fia.db.opendevcam.net/geoserver/wfs', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(GEOSERVER_AUTH.user + ':' + GEOSERVER_AUTH.password)
      },
      body: xml
    });

  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: 'Something went wrong when trying to delete documents!' })
  }

  const fileName = req.body.fileName;
  const directoryPath = process.env.NODE_PATH + '/assets/documents/';
  try {
    fs.unlinkSync(directoryPath + fileName);

    return res.status(200).send({ message: 'Document is deleted.' });
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: 'Could not delete the document.' });
  }
}

const Document = {
  upload,
  handleCreate,
  handleDelete,
}

export default Document;