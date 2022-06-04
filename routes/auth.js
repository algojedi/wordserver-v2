const express = require('express');
const User = require('../models/user');
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

router.get('/profile', tokenCheck, (req, res) => {
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
});


module.exports = router;
