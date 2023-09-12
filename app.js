import express from 'express'
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';
import documentUpload from './modules/document_upload.js';
import fetch from 'node-fetch';

const app = express();
const port = process.env.PORT || 3000;
const dirName = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static('assets'));

app.use('/geoserver', createProxyMiddleware({ target: 'https://staging.fia.db.opendevcam.net', changeOrigin: true }));

app.use('/api/v2', createProxyMiddleware({
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

app.get('/admin', function (req, res) {
  res.sendFile(path.join(dirName, 'page/admin.html'));
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

app.post("/upload_files", documentUpload.upload.array("files"), documentUpload.handler);

app.listen(port);


console.log('Server started at http://localhost:' + port);
