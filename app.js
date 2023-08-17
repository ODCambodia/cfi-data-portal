import express from 'express'
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3000;
const dirName = path.dirname(fileURLToPath(import.meta.url));

app.get('/', function (req, res) {
  res.sendFile(path.join(dirName, 'page/index.html'));
});

app.get('/map', function (req, res) {
  res.sendFile(path.join(dirName, 'page/map.html'));
});

app.get('/template', function (req, res) {
  res.sendFile(path.join(dirName, 'page/template.html'));
});

app.listen(port);
console.log('Server started at http://localhost:' + port);

module.exports = app;