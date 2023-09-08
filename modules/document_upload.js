import multer from 'multer';
import xml2js from 'xml2js';
import fetch from 'node-fetch';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.NODE_PATH + '/assets/documents');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '_' + file.originalname);
  }
});

const upload = multer({ storage: storage });

const documentUpload = {
  upload,
  handler: async function (req, res) {
    try {
      const template = `<wfs:Transaction
        version="2.0.0"
        service="WFS"
        xmlns:cfi="cfi"
        xmlns:fes="http://www.opengis.net/fes/2.0"
        xmlns:gml="http://www.opengis.net/gml/3.2"
        xmlns:wfs="http://www.opengis.net/wfs/2.0"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0/wfs.xsd
                            http://www.opengis.net/gml/3.2 http://schemas.opengis.net/gml/3.2.1/gml.xsd">
        <wfs:Insert>
          <cfi:documents>
            <cfi:geom>
              <gml:Point srsName="http://www.opengis.net/def/crs/epsg/0/32648">
                <gml:pos>random</gml:pos>
              </gml:Point>
            </cfi:geom>
            <cfi:title>Title</cfi:title>
            <cfi:title_en>Title_en</cfi:title_en>
            <cfi:contentType>application/pdf</cfi:contentType>
            <cfi:url>random</cfi:url>
          </cfi:documents>
        </wfs:Insert>
      </wfs:Transaction>`;


      const xmlData = await xml2js.parseStringPromise(template);
      const cfiDocuments = xmlData['wfs:Transaction']['wfs:Insert'][0]['cfi:documents'][0];
      cfiDocuments['cfi:geom'][0]['gml:Point'][0]['gml:pos'] = req.body.pos;
      cfiDocuments['cfi:title'] = req.body.title;
      cfiDocuments['cfi:title_en'] = req.body.titleEn;
      cfiDocuments['cfi:contentType'] = req.files[0].mimetype;
      cfiDocuments['cfi:url'] = req.files[0].path.replace('assets', '');

      const builder = new xml2js.Builder();
      const xml = builder.buildObject(xmlData);

      const response = await fetch('https://staging.fia.db.opendevcam.net/geoserver/wfs', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa('admin:geoserver')
        },
        body: xml
      });


      return res.json({ message: "Successfully uploaded files", status: 201 });
    } catch (e) {
      console.warn(e);
    }

    return res.json({ message: "Something went wrong", status: 500 });
  }
}

export default documentUpload;