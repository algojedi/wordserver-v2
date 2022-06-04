const express = require("express");
const router = express.Router();
const wordController = require("../controllers/words");
const tokenCheck = require("../middleware/tokenCheck");

router.get("/", tokenCheck, wordController.define) 

// add word to user cart 
// precondition: word was searched previously
router.post("/word", tokenCheck, wordController.addWordToCart)

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
