const express = require('express');
const User = require('../models/user');

//const authController = require('../controllers/auth');

const router = express.Router();



router.get('/login', (req, res, next) => {
    User.findById('5e128cd7c330930c80b4f014') //James in DB
        .then(user => {
            console.log('user is ', user);
            console.log('session?: ', 'session' in req);
            req.session.isLoggedIn = true; //we can set any value we want
            console.log(req.session);
            req.session.user = user;
            res.redirect('/home');
        })
        .catch(err => console.log(err));
})


router.get('/logout', (req, res, next) => {
    req.session.destroy(err => {
        console.log('sessions ended')
        console.log(err ? err : '');
        res.redirect('/home');
    });
})

module.exports = router;