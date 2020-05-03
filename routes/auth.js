const express = require("express");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const redisClient = require("../redis");


const router = express.Router();



const signToken = (email) => {
  const jwtPayload = { email };
  return jwt.sign(jwtPayload, process.env.JWTSECRET, { expiresIn: "2 days" });
};

const createSessions = (user) => {
  //create jwt and user data
  const { _id, email } = user;
  const token = signToken(email);

  return new Promise((resolve, reject) => {
    //save token in redis - note: _id is an object, so stringify needed
    redisClient.set(token, JSON.stringify(_id), (err, result) => {
      if (err) {
        reject("error in saving token to redis");
      } else {
        resolve({ token });
      }
    });
  });
};

router.post("/login", async (req, res, next) => {
//  console.log("attempting login");
  const { authorization } = req.headers;

  if (authorization) {
    return res.json({
      success: true,
      userId: req.userId, //should have been set in middleware
      token: authorization,
    });
  }
  //no auth token
  try {
    const user = await handleSignIn(req, res); //handleSignIn validates login info

    //if the login info is correct, create session
    if (user._id && user.email) {
      sessionInfo = await createSessions(user); //createSessions returns a promise
      if (sessionInfo.token)
        return res.json({
          success: true,
          userId: user._id,
          token: sessionInfo.token,
        });
    } else {
      return res.status(400).json("no such user");
    }
  } catch (err) {
    console.log(err);

    return res.status(400).json("oops.. something went wrong");
  }
});

//a function that validates username/password and returns a promise
//on success, should return the user
const handleSignIn = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return Promise.reject("incorrect form submission");
  }
  return User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return Promise.reject("incorrect email or password");
      }
      return bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          console.log("brcypt match? ", doMatch);
          return doMatch
            ? user //TODO: Need to filter this to not return hashed pw inside user obj
            : Promise.reject("incorrect email or password");
        })
        .catch((err) => {
          Promise.reject(err);
        });
    })
    .catch((err) => Promise.reject(err));
};

router.get("/profile/:id", (req, res) => {
  const userId = req.params.id;
  console.log("user id received in profile req: ", userId);
  return User.findOne({ _id: userId }) //mongo id in User stored as _id

    .populate("cart") 
    .then((user) => {
      if (!user) {
        return res.status(400).json("incorrect user id");
      }
      const { email, cart, name } = user;
      return res.json({ email, cart, name });
    });
});

router.post("/logout", (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(400).send("no token found");
  }
  redisClient.del(authorization, function (err, response) {
    if (response == 1) {
      console.log("logged out");
      return res.status(200).send("successfully signed out");
    } else {
      console.log("error logging out");
      return res.status(500).send("error signing out");
    }
  });
});


router.post("/register", async (req, res, next) => {
  const { name, email, password } = req.body;
  //first check if user already exists
  try {
    const userDoc = await User.findOne({ email });
    if (userDoc) {
      return res.status(400).send({ message: "user already exists" });
    }
  } catch (err) {
    console.log(err);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = new User({
    name,
    password: hashedPassword,
    email,
    cart: [],
  });
  //console.log("user object created but not saved");
  user.save((err, user) => {
    return err
      ? res.status(500).send("Could not create user")
      : res.status(200).send("successfully created new user");
  });
  console.log("user object saved");
});

module.exports = router;
