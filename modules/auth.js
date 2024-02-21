import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import UserDAO from '../database/user.js';

// MIDDLEWARE FOR AUTHORIZATION 
const validateSession = async (req, res, next, shouldBeSuperAdmin) => {
  let server = '';
  const lastPath = req.path.split('/').slice(-1)[0];
  if (req.path.match(/\/cfr\//) || lastPath === 'cfr') {
    server = 'cfr';
  } else if (req.path.match(/\/cfi\//) || lastPath === 'cfi') {
    server = 'cfi';
  }

  // validate token
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(' ')[1];

    if (token) {
      try {
        const payload = await jwt.verify(token, process.env.SECRET);
        const isSuperAdmin = payload && payload.isSuper;
        const isUser = !shouldBeSuperAdmin && payload && !payload.isSuper;
        const isSamePlatform = payload.type === server;

        if (!isSamePlatform) {
          return res.status(403).json({ error: 'Forbidden, Wrong Platform. Current user can only access ' + payload.type || '' });
        }

        if (!isSuperAdmin && !isUser) {
          return res.status(403).json({ error: 'Forbidden' })
        }

        req.user = payload;
        return next();
      } catch (error) {
        console.log(error);
      }
    }
  }

  if (server) {
    return res.redirect('/login/' + server);
  }

  res.redirect('/login/cfi');
};

const validate = (req, res, next) => validateSession(req, res, next, false);
const validateSuperAdmin = (req, res, next) => validateSession(req, res, next, true);

/**
 * Controller for login
 */
const handleLogin = async function (req, res) {
  try {
    const type = req.body.type;
    let loginENVKey = null, passENVKey = null;

    if (type === 'cfi') {
      loginENVKey = 'CFI_LOGIN_USERNAME';
      passENVKey = 'CFI_LOGIN_PASSWORD'
    } else if (type === 'cfr') {
      loginENVKey = 'CFR_LOGIN_USERNAME';
      passENVKey = 'CFR_LOGIN_PASSWORD'
    } else {
      throw new Error('no login type for specific platform');
    }

    const isNameMatch = req.body.username === process.env[loginENVKey];
    const isPassMatch = req.body.password === process.env[passENVKey];

    if (isNameMatch && isPassMatch) {
      const token = await jwt.sign({ username: req.body.username, isSuper: true, type }, process.env.SECRET);
      req.session.token = token;
      return res.json({ token });
    }

    return res.status(401).json({ error: 'Invalid username or password' });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: 'Something went wrong' });
  }
};

const handleTelegramVerification = async function (req, res) {
  const secretKey = crypto.createHash('sha256')
    .update(process.env.BOT_TOKEN)
    .digest();
  const { hash, type, ...data } = req.body;

  const checkString = Object.keys(data)
    .sort()
    .filter((k) => data[k])
    .map(k => (`${k}=${data[k]}`))
    .join('\n');

  const hmac = crypto.createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');

  // telegram verified
  if (hmac === hash) {
    const user = await UserDAO.get(data.id, type);

    if (!user) {
      const payload = { user_id: data.id, username: data.username, firstname: data.first_name || null, lastname: data.last_name || null, type };
      try {
        await UserDAO.insert(payload);
      } catch (e) {
        return res.status(400).json({ error: 'user_already_exist_in_another_platform' });
      }

      return res.status(403).json({ error: 'sent_pending_login_request' });
    } else if (user && user.user_id && user.approval_time) {
      const token = await jwt.sign({ username: data.username || data.id, isSuper: false, type }, process.env.SECRET);
      req.session.token = token;
      return res.json({ token });
    }
  }

  return res.status(401).json({ error: 'waiting_for_admin_approval' });
}

const appendUserToken = function (req, res, next) {
  if (req.session && req.session.token) {
    req.headers.authorization = 'bearer ' + req.session.token;
  }

  next();
}

const handleLogout = function (req, res) {
  res.clearCookie('session');
  res.status(200).json({ message: 'Success' });
}

const Auth = {
  validate,
  validateSuperAdmin,
  handleLogin,
  appendUserToken,
  handleLogout,
  handleTelegramVerification
}

// export custom middleware
export default Auth;