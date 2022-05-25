const express = require('express');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const redisClient = require('../redis');
const { isValid, isValidRegistration } = require('../utils/validator');
const {
  createSessions,
  updateAccessToken,
  generateAccessToken,
  generateRefreshToken,
} = require('../utils/generateTokens');
const TokenService = require('../services/TokenService')

const router = express.Router();
const tokenService = new TokenService();

// a route to allow user to refresh their token
router.post('/token', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'Missing token' });
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const { id, email } = decoded;
    // check redis for refresh token
    const reply = await redisClient.get(id);
    if (!reply) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    const { refreshToken: currentToken } = JSON.parse(reply);

    if (refreshToken !== currentToken) {
      console.log('attempt made to use invalidated token');
      return res.status(403).json({ message: 'Invalid token' });
    }
    // return a new access token since refresh token is valid
    const token = generateAccessToken(id, email);
    return res.json({ token });
  } catch (error) {
    console.log('error refreshing token ', error);
    return res.status(403).json({ message: 'Invalid token' });
  }
});

router.delete('/logout', async (req, res) => {
  const { token } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const { id, email } = decoded;
    // check redis for refresh token
    const reply = await redisClient.get(id);
    if (!reply) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    const { refreshToken } = JSON.parse(reply);

    if (refreshToken !== token) {
      console.log('attempt made to delete invalidated token');
      return res.status(403).json({ message: 'Invalid token' });
    }
    await redisClient.del(id);
    return res.status(204).json({ message: 'Logged out' });
  } catch (error) {
    console.log('error logging out', error);
    return res.status(403).json({ message: 'Invalid token' });
  }
});

router.post('/login', async (req, res, next) => {
  const { authorization } = req.headers;

  if (authorization) {
    // user id would have been set in middleware
    console.log('authorization header found : ', authorization);
    return res.json({
      // default status code is 200
      success: true,
      userId: req.userId,
      token: authorization,
    });
  }

  const { email, password } = req.body;

  // TODO: factor out validation to middleware
  if (!isValid(email, password)) {
    console.log('invalid username/password');
    return res.status(400).json({ message: 'invalid username or password' });
  }

  console.log('about to authenticate creds for sign in');
  // no auth token
  try {
    // handleSignIn checks for user in db
    const user = await handleSignIn(email, password);
    console.log('user found ? : ', user);
    if (!user) {
      return res.status(400).json({ message: 'no such user' });
    }
    // if the login info is correct, create session
    const sessionInfo = await tokenService.createSessions(user._id, user.email);
    console.log('session info received in login : ', sessionInfo);
    if (sessionInfo) {
      return res.json({
        success: true,
        userId: user._id,
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
});

// a function that validates username/password and returns a promise
// on resolve, should return the user
// TODO: factor out to different module
const handleSignIn = async (email, password) => {
  try {
    let user = await User.findOne({ email });
    if (!user) {
      console.log('no user found by db');
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

router.get('/getTokenInfo', async (req, res, next) => {
  const someId = '6275c73824e2991946c58d06';

  try {
    let reply = await redisClient.get(someId);
    const tokens = JSON.parse(reply);
    const message = reply ? 'good stuff' : 'no token found';
    // verify call can also be done synchronously with try catch
    console.log({ tkn: tokens.accessToken });
    const decoded = jwt.verify(
      tokens.accessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    console.log('decoded: ', decoded);
    // decoded:  { email: 'Jelvis@jelvis.com', iat: 1652018132, exp: 1652450132 }
    return res.json({ message });
  } catch (err) {
    console.log('error in getTokenInfo: ', err);
    if (err.name === 'TokenExpiredError') console.log('gotcha!');
    return res.status(400).json({ message: 'error in getTokenInfo' });
  }
});

router.get('/profile/:id', (req, res) => {
  const userId = req.params.id;
  console.log('user id received in profile req: ', userId);
  return User.findOne({ _id: userId }) //mongo id in User stored as _id

    .populate('cart')
    .then((user) => {
      if (!user) {
        return res.status(400).json({ message: 'incorrect user id' });
      }
      const { email, cart, name } = user;
      return res.json({ email, cart, name });
    });
});

router.post('/logout', (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(400).json({ message: 'no token found' });
  }
  redisClient.del(authorization, function (err, response) {
    if (response == 1) {
      console.log('logged out');
      return res.status(200).json({ message: 'successfully signed out' });
    } else {
      console.log('error logging out');
      return res.status(500).json({ message: 'error signing out' });
    }
  });
});

router.post('/register', async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!isValidRegistration(name, email, password)) {
    console.log('invalid username/password');
    return res.status(400).json({ message: 'invalid username or password' });
  }
  // first check if user already exists
  try {
    const userDoc = await User.findOne({ email });
    if (userDoc) {
      return res.status(400).json({ message: 'user already exists' });
    }
  } catch (err) {
    console.log('error checking db: ', err);
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
      return res.status(500).json({ message: 'DB error: Could not create user' });
    }
    return res.status(200).json({
      message: 'user created successfully',
    });
  });
});

module.exports = router;
