import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import UserDAO from '../database/user.js';

// MIDDLEWARE FOR AUTHORIZATION 
const validateSession = async (req, res, next, shouldBeSuperAdmin) => {
  if (req.headers.authorization) {
    // validate token
    const token = req.headers.authorization.split(' ')[1];
    if (token) {
      try {
        const payload = await jwt.verify(token, process.env.SECRET);
        const isSuperAdmin = payload && payload.isSuper;
        const isUser = !shouldBeSuperAdmin && payload && !payload.isSuper;

        if (isSuperAdmin || isUser) {
          req.user = payload;
          return next();
        }
      } catch (error) {
        console.log(error);
      }
    }
  }

  if (req.params.key) {
    return res.redirect('/login/' + req.params.key);
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
    const isNameMatch = req.body.username === process.env.LOGIN_USERNAME;
    const isPassMatch = req.body.password === process.env.LOGIN_PASSWORD;
    if (isNameMatch && isPassMatch) {
      const token = await jwt.sign({ username: req.body.username, isSuper: true }, process.env.SECRET);
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
  const { hash, ...data } = req.body.payload

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
    const hasUser = await UserDAO.get(data.id);
    if (typeof hasUser === 'object' && Object.keys(hasUser).length > 0) {
      const token = await jwt.sign({ username: data.username || data.id, isSuper: false }, process.env.SECRET);
      req.session.token = token;
      return res.json({ token });
    }
  }

  return res.status(401).json({ error: 'Invalid telegram user' });
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