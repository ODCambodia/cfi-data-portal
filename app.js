import express from 'express'
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const port = process.env.PORT || 3000;
const dirName = path.dirname(fileURLToPath(import.meta.url));

// const koboApiProxy = createProxyMiddleware({
//   target: 'https://kf.kobotoolbox.org/api',
//   changeOrigin: true,
// })

app.use(express.static('assets'));

app.use('/geoserver', createProxyMiddleware({ target: 'https://staging.fia.db.opendevcam.net', changeOrigin: true }));


app.use('/api/template', createProxyMiddleware({
  target: `https://kf.kobotoolbox.org/api/v2/assets`,
  changeOrigin: true,
}));

app.get('/', function (req, res) {
  res.sendFile(path.join(dirName, 'page/index.html'));
});

app.get('/map', function (req, res) {
  res.sendFile(path.join(dirName, 'page/map.html'));
});

app.get('/template', function (req, res) {
  res.sendFile(path.join(dirName, 'page/template.html'));
});

// app.use('/api/cfi', createProxyMiddleware({ target: 'https://staging.fia.db.opendevcam.net/geoserver/cfi/wms', changeOrigin: true }));
// app.use('/api/cfr', createProxyMiddleware({ target: 'https://staging.fia.db.opendevcam.net/geoserver/cfr/wms', changeOrigin: true }));


app.get('/api/provinces', async function (req, res) {
  try {
    const response = await fetch(`https://staging.fia.db.opendevcam.net/geoserver/cfi/wfs?` + new URLSearchParams({
      service: 'wfs',
      version: '1.0.0',
      request: 'GetFeature',
      typeName: 'cfi:cambodian_provincial',
      srsname: 'EPSG:32648',
      outputFormat: 'application/json',
      propertyname: 'pro_name_k,hrname,pro_code'
    }));

    const data = await response.json();

    // success
    res.json(data);
    return;
  } catch (error) {
    console.log('There was an error', error);
  }

  res.send('something went wrong');
});

app.get('/api/provinces/cfr', async function (req, res) {
  try {
    const response = await fetch(`https://staging.fia.db.opendevcam.net/geoserver/cfr/ows?` + new URLSearchParams({
      service: 'WFS',
      version: '1.0.0',
      request: 'GetFeature',
      typeName: 'cfr:cambodian_provincial',
      outputFormat: 'application/json',
      propertyname: 'ADM1_EN,ADM1_PCODE,ADM0_EN,ADM0_PCODE'
    }));

    // console.log(await response.text());

    const data = await response.json();

    // success
    res.json(data);
    return;
  } catch (error) {
    console.log('There was an error', error);
  }

  res.send('something went wrong');
});

app.get('/api/template', async function (req, res) {
  try {
    const response = await fetch(`https://kf.kobotoolbox.org/api/v2/assets/a6EAL6ktxuP9UQRdYLwYja/data.json` + new URLSearchParams({
      // query param here
    }),
      {
        method: 'GET',
        headers: {
          'X-Auth-Token': 'TOKEN 853ebba588d07208b7776765ce3176baace0b716'
        }
      });
    const data = await response.json();

    // success
    res.json(data);
    return;
  } catch (error) {
    console.log('There was an error', error);
  }

  res.send('something went wrong');
});

app.listen(port);


console.log('Server started at http://localhost:' + port);