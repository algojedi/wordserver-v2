const express = require("express");
const router = express.Router();
const wordController = require("../controllers/words");
const tokenCheck = require("../middleware/tokenCheck");

router.get("/word", tokenCheck, wordController.define) 

// precondition: word was searched previously
router.post("/word", tokenCheck, async (req, res) => {
  if (!req.userId) {
    //this route is only for logged in users
    return res.status(400).json("Authorization denied trying to add word");
  }
  let word = req.body.word;

  word = word.toLowerCase();
  try {
    const user = await User.findOne({ _id: req.userId }).exec();
    if (!user) {
      console.log("can't find user in mongo for some reason");
      return res.status(400).json("unable to find user in addWord route");
    }
    //find mongoose word object
    const wordObj = await Wordef.findOne({ word: word });
    // console.log("return from mongo: ", wordObj);
    if (!wordObj) {
      return res.status(400).send("can't find word in db");
    }
    user.addToCart(wordObj._id);
    return res.json(wordObj);
  } catch (err) {
    console.log(err);
  }
});

router.post("/removeWord", async (req, res) => {
  if (!req.userId) {
    // this case only here as precaution
    //this route is only for logged in users
    return res.status(400).json("Authorization denied trying to add word");
  }

  let wordId = req.body.wordId;
  try {
    const user = await User.findOne({ _id: req.userId }).exec();
    if (!user) {
      return res.status(400).json("unable to find user profile on delete");
    }
    user.removeFromCart(wordId);
    res.status(200).json("success");
  } catch (e) {
    res.status(500).json("oops... something went wrong");
  }
});

router.post("/emptyCart", async (req, res) => {
  if (!req.userId) {
    // this case only here as precaution
    //this route is only for logged in users
    return res.status(400).json("Authorization denied trying to add word");
  }

  try {
    const user = await User.findOne({ _id: req.userId }).exec();
    if (!user) {
      return res
        .status(400)
        .json("unable to find user profile on delete all words");
    }
    user.emptyCart();
    return res.status(200).json("success");
  } catch (e) {
    res.status(500).json("oops... something went wrong");
  }
});

module.exports = router;
