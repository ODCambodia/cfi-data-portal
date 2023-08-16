import express from 'express'
import path from 'path';
import { fileURLToPath } from 'url';

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

app.get('/api', async function (req, res) {
  try {
    const response = await fetch('https://cat-fact.herokuapp.com/facts');
    res.send(response);
  } catch (error) {
    console.log('There was an error', error);
    res.send(error);
  }

  res.sendFile(path.join(dirName, 'page/index.html'));
});

app.listen(port);
console.log('Server started at http://localhost:' + port);