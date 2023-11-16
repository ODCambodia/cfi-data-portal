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
import LayerSettings from './modules/toggle_layer.js';

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
const COOKIE_SESSION = {
  name: 'session',
  keys: [process.env.SECRET],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
};

app.set('trust proxy', 1) // trust first proxy
app.use(express.static('assets'));
app.use(cookieSession(COOKIE_SESSION));

app.use(Auth.appendUserToken);

app.use('/geoserver', createProxyMiddleware({ target: 'https://staging.fia.db.opendevcam.net', changeOrigin: true }));

app.use('/api/v2', createProxyMiddleware({
  target: `https://kf.kobotoolbox.org/api/v2/assets`,
  changeOrigin: true,
}));

app.get('/', function (req, res) {
  res.sendFile(path.join(dirName, 'page/index.html'));
});

app.get('/map/cfi', function (req, res) {
  res.sendFile(path.join(dirName, 'page/map_cfi.html'));
});

app.get('/map/cfr', function (req, res) {
  res.sendFile(path.join(dirName, 'page/map_cfr.html'));
});

app.get('/template', function (req, res) {
  res.sendFile(path.join(dirName, 'page/template.html'));
});

app.get('/admin/:key', Auth.validate, function (req, res) {
  let templatePath = 'page/admin.html';
  if (req.params.key === 'cfr') {
    templatePath = 'page/admin_cfr.html';
  }

  res.sendFile(path.join(dirName, templatePath));
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

app.post('/admin/documents/:server', Auth.validate, Document.upload.array('files'), Document.handleCreate);
app.delete('/admin/documents/:server/:id', Auth.validate, jsonParser, Document.handleDelete);
// app.patch('/admin/documents/:server/:id', Auth.validate, jsonParser, function (req, res) { });


app.post('/login', rateLimiter, jsonParser, Auth.handleLogin);

app.get('/login/:key', function (req, res) {
  res.sendFile(path.join(dirName, 'page/login.html'));
});

app.post('/logout', Auth.handleLogout);

app.get('/api/active-layers/:key', (req, res) => LayerSettings.handleGetLayer(req, res, '_related_layers'));
app.post('/api/active-layers/:key', Auth.validate, jsonParser, (req, res) => LayerSettings.handleSaveLayer(req, res, '_related_layers'));

app.get('/api/default-profile-layer/:key', (req, res) => LayerSettings.handleGetLayer(req, res, '_default_profile'));
app.post('/api/default-profile-layer/:key', Auth.validate, jsonParser, (req, res) => LayerSettings.handleSaveLayer(req, res, '_default_profile'));

app.get('/api/default-chart-layer/:key', (req, res) => LayerSettings.handleGetLayer(req, res, '_default_chart'));
app.post('/api/default-chart-layer/:key', Auth.validate, jsonParser, (req, res) => LayerSettings.handleSaveLayer(req, res, '_default_chart'));

app.listen(port);
console.log("NODE_PATH=" + process.env.NODE_PATH);
console.log('Server started at http://localhost:' + port);
