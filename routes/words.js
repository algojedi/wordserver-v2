const express = require("express");
const router = express.Router();
const wordController = require("../controllers/words");
const tokenCheck = require("../middleware/tokenCheck");

// add word to user cart 
// precondition: word was searched previously
router.post("/word", tokenCheck, wordController.addWordToCart)

router.delete("/word/:id", tokenCheck, wordController.removeWordFromCart)

router.delete("/cart", tokenCheck, wordController.deleteCart)

router.get("/word", tokenCheck, wordController.define) 

module.exports = router;
