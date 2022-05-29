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
const tokenCheck = require('../middleware/tokenCheck');

const router = express.Router();

router.post('/register', authController.register); 
// a route to allow user to refresh their token
router.post('/token', tokenCheck, authController.token)
router.delete('/logout', tokenCheck, authController.logout)
router.post('/login', authController.login)
router.get('/test', tokenCheck, (req, res) => { 
  console.log( { userIdRetrievedFromToken : req.userId })
})

router.get('/profile/:id', tokenCheck, (req, res) => {
  const userId = req.params.id;
  console.log('user id received in profile req: ', userId);
  return User.findOne({ _id: userId }) 
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
