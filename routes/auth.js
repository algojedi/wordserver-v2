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
router.get('/profile', tokenCheck, authController.getProfile)


module.exports = router;
