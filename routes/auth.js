const express = require('express');
const User = require('../models/user');
const bcrypt = require('bcryptjs');

//const authController = require('../controllers/auth');

const router = express.Router();



router.post('/login', (req, res, next) => {
    const { email, password } = req.body;

    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.status(400).send('incorrect email or password');
            }
            bcrypt
                .compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save(err => {
                            console.log(err);
                            res.redirect('/home'); //after (un)successfully saving
                        });
                    }
                    return res.status(400).send('incorrect email or password');
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/home'); //error with bcrypt process
                });
        })
        .catch(err => console.log(err));
})



// router.get('/logout', (req, res, next) => {
//     req.session.destroy(err => {
//         console.log('session ended')
//         console.log(err ? err : '');
//         res.redirect('/home');
//     });
// })

router.post('/logout', (req, res, next) => {
    req.session.destroy(err => {
        console.log(err);
        res.redirect('/home');
    });
});


router.post('/register', async (req, res, next) => {
    const { name, email, password, confirmPassword } = req.body;
    
    try { 
        const userDoc = await User.findOne({ email }) 
        if (userDoc) {
            return res.status(400).send('user already exists');
        }
    }
    catch(err) { 
        console.log(err)
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
        name,
        password: hashedPassword,
        email,
        cart:  []
    });
    console.log('user object created but not saved')
    user.save((err, user) => {
        return err ? res.status(400).send('Could not create user') :
        res.status(200).send('successfully created new user')
    })
    console.log('user object saved')
});    
    
module.exports = router;

        


