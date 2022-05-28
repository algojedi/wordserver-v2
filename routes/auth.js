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

router.post('/register', authController.register); 
// a route to allow user to refresh their token
router.post('/token', authController.token)
router.delete('/logout', authController.logout)
router.post('/login', authController.login)

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


module.exports = router;
