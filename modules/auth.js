import jwt from 'jsonwebtoken';

// MIDDLEWARE FOR AUTHORIZATION 
const validate = async (req, res, next) => {
  if (req.headers.authorization) {
    // validate token
    const token = req.headers.authorization.split(' ')[1];
    if (token) {
      try {
        const payload = await jwt.verify(token, process.env.SECRET);
        if (payload) {
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

/**
 * Controller for login
 */
const handleLogin = async function (req, res) {
  try {
    const isNameMatch = req.body.username === process.env.LOGIN_USERNAME;
    const isPassMatch = req.body.password === process.env.LOGIN_PASSWORD;
    if (isNameMatch && isPassMatch) {
      const token = await jwt.sign({ username: req.body.username }, process.env.SECRET);
      req.session.token = token;
      return res.json({ token });
    }

    return res.status(401).json({ error: 'Invalid username or password' });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: 'Something went wrong' });
  }
};

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
  handleLogin,
  appendUserToken,
  handleLogout
}

// export custom middleware
export default Auth;