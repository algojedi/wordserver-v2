const bcrypt = require('bcryptjs');
const { isValidLogin, isValidRegistration } = require('../utils/validator');
const TokenService = require('../services/tokenService');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

const tokenService = new TokenService();

exports.getProfile = async (req, res) => {
  const { userId } = req
  console.log('user id received in profile req: ', userId);
  return User.findOne({ _id: userId }) 
    .populate('cart')
    .then((user) => {
      if (!user) {
        return res.status(400).json({ message: 'incorrect user id' });
      }
      const { email, cart, name } = user;
      return res.json({ email, cart, name });
    }).catch((err) => {
      console.log(err);
      return res.status(500).json({ message: 'internal error' });
    })



}

exports.token = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'Missing token' });
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const { id, email } = decoded;
    // check redis for refresh token
    const storedRefreshToken = await tokenService.getRefreshToken(id);
    if (!storedRefreshToken) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (refreshToken !== storedRefreshToken) {
      console.log('attempt made to use invalidated token');
      return res.status(403).json({ message: 'Invalid token' });
    }
    // return a new access token since refresh token is valid
    const token = await tokenService.updateAccessToken(id, email);
    return token
      ? res.json({ success: true, token })
      : res.status(500).json({ success: false, message: 'Error generating token' });
  } catch (error) {
    console.log('error refreshing token ', error);
    return res.status(403).json({ message: 'Invalid token' });
  }
};

exports.login = async (req, res, next) => {
/*  const { authorization } = req.headers;

  if (authorization) {
    // user id would have been set in middleware
    return res.json({
      // default status code is 200
      success: true,
      userId: req.userId,
      token: authorization,
    });
  }
 */
  const { email, password } = req.body;

  // TODO: factor out validation to middleware
  if (!isValidLogin(email, password)) {
    return res.status(400).json({ message: 'invalid username or password' });
  }

  try {
    // handleSignIn checks for user in db
    const user = await handleSignIn(email, password);
    if (!user) {
      return res.status(400).json({ message: 'no such user' });
    }
    // if the login info is correct, create session
    const sessionInfo = await tokenService.createSessions(user._id, user.email);
    if (sessionInfo) {
      return res.json({
        success: true,
        userId: user._id, // TODO: probably better not to send this
        accessToken: sessionInfo.accessToken,
        refreshToken: sessionInfo.refreshToken,
      });
    } else {
      return res.status(400).json({ message: 'error creating session' });
    }
  } catch (err) {
    console.log('unexpected error: ', err);
    return res.status(400).json({ message: 'oops.. something went wrong' });
  }
};

// a function that validates username/password and returns a promise
// on resolve, should return the user
const handleSignIn = async (email, password) => {
  try {
    let user = await User.findOne({ email });
    if (!user) {
      return null;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    // TODO: Need to filter this to not return hashed pw inside user obj
    return isMatch ? user : null;
  } catch (err) {
    console.log('db error?', err);
    return null;
  }
};

exports.register = async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!isValidRegistration(name, email, password)) {
    return res.status(400).json({ message: 'invalid username or password' });
  }
  // first check if user already exists
  try {
    const userDoc = await User.findOne({ email });
    if (userDoc) {
      return res.status(400).json({ message: 'user already exists' });
    }
  } catch (err) {
    return res.status(500).json({ message: 'database error' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = new User({
    name,
    password: hashedPassword,
    email,
    cart: [],
  });
  user.save(async (err, user) => {
    if (err) {
      console.log('error saving user to db', err);
      return res
        .status(500)
        .json({ message: 'DB error: Could not create user' });
    }
    return res.status(200).json({
      message: 'user created successfully',
    });
  });
};

/* delete refresh token from redis. Token should be validated via middleware */
exports.logout =  async (req, res) => {
  const { token } = req.body;
  // TODO: token should be retrieved from authorization header
  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const { id, email } = decoded;
    // check redis for refresh token
    const storedRefreshToken = await tokenService.getRefreshToken(id);
    if (!storedRefreshToken) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (storedRefreshToken !== token) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    await tokenService.deleteTokens(id)
    return res.status(204).json({ message: 'Logged out' });
  } catch (error) {
    console.log('error logging out', error);
    return res.status(403).json({ message: 'Invalid token or server error' });
  }
}
