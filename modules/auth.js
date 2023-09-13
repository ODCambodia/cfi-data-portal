import jwt from 'jsonwebtoken';

// MIDDLEWARE FOR AUTHORIZATION 
const validate = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      throw new Error('Missing Auth Header');
    }

    // validate token
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      throw new Error("malformed auth header");
    }

    const payload = await jwt.verify(token, process.env.SECRET);
    if (payload) {
      req.user = payload;
      return next();
    }
  } catch (error) {
    console.log(error);
  }

  res.redirect('/login');
};

/**
 * Controller for login
 */
const handleLogin = async function (req, res) {
  console.log('body: ', req.body);
  try {
    const isNameMatch = req.body.username === process.env.LOGIN_USER;
    const isPassMatch = req.body.password === process.env.LOGIN_PASSWORD;

    const token = await jwt.sign({ username: req.body.username }, process.env.SECRET);
    req.session.token = token;
    console.log('set', req.session, token);
    return res.json({ token });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: 'Something went wrong' });
  }
};

const appendUserToken = function (req, res, next) {
  console.log(req.session);
  if (req.session && req.session.token) {
    req.headers.authorization = 'bearer ' + req.session.token;
  }

  next();
}

const Auth = {
  validate,
  handleLogin,
  appendUserToken,
}

// export custom middleware
export default Auth;