import express from 'express'
import path from 'path';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cookieSession from 'cookie-session';
import { rateLimit } from 'express-rate-limit'
import bodyParser from 'body-parser';
import Document from './modules/document.js';
import Auth from './modules/auth.js';
import ToggleLayer from './modules/toggle_layer.js';

const app = express();
const port = process.env.PORT || 3000;
const dirName = path.dirname(fileURLToPath(import.meta.url));
const jsonParser = bodyParser.json();
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 50, // Limit each IP to 50 requests per `window` (here, per 15 minutes)
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

app.set('trust proxy', 1) // trust first proxy
app.use(express.static('assets'));
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SECRET],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.use(Auth.appendUserToken);

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

app.get('/admin/:key', Auth.validate, function (req, res) {
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

app.post('/admin/documents', Auth.validate, Document.upload.array('files'), Document.handleCreate);
app.patch('/admin/documents/:id', Auth.validate, jsonParser, function (req, res) { });
app.delete('/admin/documents/:id', Auth.validate, jsonParser, Document.handleDelete);


app.post('/login', rateLimiter, jsonParser, Auth.handleLogin);

app.get('/login/:key', function (req, res) {
  res.sendFile(path.join(dirName, 'page/login.html'));
});

app.post('/logout', Auth.handleLogout);

app.get('/api/active-layers/:key', ToggleLayer.handleGetActiveLayers);

app.post('/api/active-layers/:key', Auth.validate, jsonParser, ToggleLayer.handleSaveActiveLayers);


app.listen(port);

console.log('Server started at http://localhost:' + port);
