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
import User from './modules/user.js';
import cors from 'cors';

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

app.set('view engine', 'ejs');
app.set('trust proxy', 1) // trust first proxy
app.use(express.static('assets'));
app.use(cookieSession(COOKIE_SESSION));
app.use(Auth.appendUserToken);
app.use(cors())



app.use('/geoserver', createProxyMiddleware({
  target: process.env.HOSTNAME,
  changeOrigin: true
}));

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

app.get('/admin/:server', Auth.validate, function (req, res) {
  let templatePath = '';
  if (req.params.server === 'cfr') {
    templatePath = 'page/admin_cfr.html';
  } else if (req.params.server === 'cfi') {
    templatePath = 'page/admin.html';
  } else {
    res.status(400).json({ error: 'Missing server param' });
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
app.post('/login/verify-telegram', rateLimiter, jsonParser, Auth.handleTelegramVerification);

app.get('/login/:server', function (req, res) {

  const server = req.params.server;
  let bot_username;
  if (server === 'cfi')
    bot_username = process.env.CFI_BOT_USERNAME;
  else if (server === 'cfr')
    bot_username = process.env.CFR_BOT_USERNAME;
  else return res.status(400).send('Invalid server specified');

  res.render(path.join(dirName, 'page/login'), { BOT_USERNAME: bot_username });
});

app.get('/api/config', (req, res) => {
  res.json({
    MapTiler_Key: process.env.MapTiler_Key,
  })
});

app.post('/logout', Auth.handleLogout);

app.get('/api/active-layers/:server', (req, res) => LayerSettings.handleGetLayer(req, res, '_related_layers'));
app.post('/api/active-layers/:server', Auth.validate, jsonParser, (req, res) => LayerSettings.handleSaveLayer(req, res, '_related_layers'));

app.get('/api/default-profile-layer/:server', (req, res) => LayerSettings.handleGetLayer(req, res, '_default_profile'));
app.post('/api/default-profile-layer/:server', Auth.validate, jsonParser, (req, res) => LayerSettings.handleSaveLayer(req, res, '_default_profile'));

app.get('/api/default-chart-layer/:server', (req, res) => LayerSettings.handleGetLayer(req, res, '_default_chart'));
app.post('/api/default-chart-layer/:server', Auth.validate, jsonParser, (req, res) => LayerSettings.handleSaveLayer(req, res, '_default_chart'));

app.get('/api/default-conservation-layer/:server', (req, res) => LayerSettings.handleGetLayer(req, res, '_default_conservation'));
app.post('/api/default-conservation-layer/:server', Auth.validate, jsonParser, (req, res) => LayerSettings.handleSaveLayer(req, res, '_default_conservation'));

app.get('/api/default-layer/:server', LayerSettings.handleGetDefaultLayers);

app.get('/api/:server/users', Auth.validateSuperAdmin, User.handleGetAllUsers);
app.post('/api/:server/users/:id/approve', Auth.validateSuperAdmin, User.handleApproveUser);
app.delete('/api/:server/users/:id', Auth.validateSuperAdmin, User.handleDeleteUser);

app.listen(port);
console.log("NODE_PATH=" + process.env.NODE_PATH);
console.log('Server started at http://localhost:' + port);
