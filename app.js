import express from 'express'
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const port = process.env.PORT || 3000;
const dirName = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static('assets'));

app.get('/', function (req, res) {
  res.sendFile(path.join(dirName, 'page/index.html'));
});

app.get('/map', function (req, res) {
  res.sendFile(path.join(dirName, 'page/map.html'));
});

app.get('/template', function (req, res) {
  res.sendFile(path.join(dirName, 'page/template.html'));
});

app.use('/api/cfi', createProxyMiddleware({ target: 'https://staging.fia.db.opendevcam.net/geoserver/cfi/wms', changeOrigin: true }));
app.use('/api/cfr', createProxyMiddleware({ target: 'https://staging.fia.db.opendevcam.net/geoserver/cfr/wms', changeOrigin: true }));

app.listen(port);
console.log('Server started at http://localhost:' + port);