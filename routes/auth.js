const express = require('express');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const redisClient = require('../redis');
const {
  createSessions,
  updateAccessToken,
  generateAccessToken,
  generateRefreshToken,
} = require('../utils/generateTokens');
const authController = require('../controllers/auth');

const router = express.Router();

// a route to allow user to refresh their token
// router.post('/token', async (req, res) => {
router.post('/token', authController.token)
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

// TODO: factor out to controller
router.post('/login', authController.login)

// TODO: erase this route
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


router.post('/register', authController.register); 
module.exports = router;
