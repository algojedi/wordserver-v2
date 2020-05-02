const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const Session = require("./models/session");
const Wordef = require("./models/wordef");
const User = require("./models/user");
const redisClient = require("./redis");

require("dotenv").config();

const MONGO_URI = `mongodb+srv://${process.env.DB_UN}:${process.env.DB_PW}@cluster0-ohht9.azure.mongodb.net/test?retryWrites=true&w=majority`;
//removed from uri: ?retryWrites=true&w=majority

const app = express();

app.use(cors());
app.use(bodyParser.json());
//user saved in session upon login is not a mongoose recognizable model (has no methods)
//we retrieve the model via user._id


//save userid on req object if there's a token
app.use(function (req, res, next) {
  const { authorization } = req.headers; //authorization is the token
  if (!authorization) {
    console.log('no auth token')
    return next(); // user will not be able to access all routes
  }
  else {
    console.log('authorization in header??')
    console.log(authorization)
    redisClient.get(authorization, (err, reply) => {
      if (err || !reply) {
        console.log('issue with token', err)
        console.log('returned from redis: ', reply)
        return res.status(400).json("Authorization denied");
      }
      console.log('reply from redis in middleware', reply)
      req.userId = JSON.parse(reply);
      //req.userId = reply;
      next();
    });

  }
});
app.use(authRoutes);

const API_URL = "https://od-api.oxforddictionaries.com/api/v2/entries/en-gb/";

//TODO: rewrite this method
//this method only runs if the word is NOT in the database
//function returns object containing all relevant word info in WordDef schema layout, or null if no match found
const fetchWordData = async (word) => {
  let wordObject = {};

  try {
    wordObject = await axios.get(API_URL + word, {
      headers: {
        app_id: process.env.APP_ID,
        app_key: process.env.API_KEY,
      },
    });
  } catch (err) {
    console.log("error when fetching for api", err);
  }
  if ("error" in wordObject) {
    console.log(wordObject.error);
    return null;
  }

  //first object in lexicalEntries array contains word definitions and examples
  const wordInfo = wordObject.data.results[0].lexicalEntries[0];
  const definitions = []; //for storing 1+ definitions of a word
  let examplesPerDef = []; //there could be multiple examples for each word definition
  //loop through senses array to populate definitions
  wordInfo.entries[0].senses
    .filter((data) => "examples" in data) //remove entries with no examples
    .forEach((def) => {
      //console.log('def is ', def);
      def.examples.forEach((ex) => examplesPerDef.push(ex.text)); //extract string from object

      definitions.push({
        definition: def.definitions[0],
        examples: [...examplesPerDef],
      });
      examplesPerDef = [];
    });

  const part = wordInfo.lexicalCategory.text;
  console.log("successful word retrieval: ", definitions);
  return { word, part, definitions };
};

app.get("/define", async (req, res) => {
  const word = req.query.word;
  if (!word) {
    return res.json("Enter a word");
  }
  //check mongo if word is already stored
  try {
    const wordQuery = await Wordef.findOne({ word }); //returns null if no matches
    //return full word object if found in mongo
    if (wordQuery) {
     //console.log("word defs from mongodb: ", wordQuery.definitions);
      const { part, definitions } = wordQuery;
      return res.send({
        word,
        part,
        definitions,
      });
    }

    //not found in mongodb, therefor query api...
    //const wordInfo = await fetchWordInfo(word);
    const wordInfo = await fetchWordData(word);

    //store reference in DB
    if (wordInfo) {
      await addWordToDB(wordInfo);
    }
    return res.json(wordInfo);
  } catch (error) {
    //console.error(error);
    console.log('error in api lookup: likely caused by non-word input')
    res.status(400).send();
  }
});

const addWordToDB = ({ word, part, definitions }) => {
  try {
    const wordDef = new Wordef({
      word,
      part,
      definitions,
    });
    wordDef.save().then((result) => {
      //save() will save to DB
      console.log("result from saving word to DB, ", result);
    });
  } catch (error) {
    console.error(error);
  }
};

//precondition: word was searched previously
app.post("/addWordToCart", async (req, res) => {
  if (!req.userId) {
    //this route is only for logged in users
      return res.status(400).json("Authorization denied trying to add word");
  }
 // const { authorization } = req.headers; //authorization is the token
  let word = req.body.word;
  
  //console.log('adding word... passed auth for user')
  console.log('body in req in add word to cart route', req.body)
  word = word.toLowerCase();
  try {
    
    const user = await User.findOne({ _id: req.userId }).exec();
    if (!user) {
      console.log("can't find user in mongo for some reason")
      return res.status(400).json("unable to find user in addWord route");
    }
    //find mongoose word object
    const wordObj = await Wordef.findOne({ word: word });
    console.log('return from mongo: ', wordObj)
    if (!wordObj) {
      console.log('can not find word in mongo')
      return res.status(400).send("can't find word in db");
    }
    console.log("word from mongo in addword route ", wordObj);
    user.addToCart(wordObj._id);
    return res.json(wordObj);
  } catch (err) {
    console.log(err);
  }
});


app.post("/removeWord", async (req, res) => {
if (!req.userId) { // this case only here as precaution
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
    //console.log("error in route remove word", e);
    res.status(500).json('oops... something went wrong')

  }
});


  //TODO: cart does not empty in db
 app.post("/emptyCart", async (req, res) => {


if (!req.userId) { // this case only here as precaution
    //this route is only for logged in users
      return res.status(400).json("Authorization denied trying to add word");
  }

  try {
    const user = await User.findOne({ _id: req.userId }).exec();
    if (!user) {
      return res.status(400).json("unable to find user profile on delete all words");
    }
    user.emptyCart();
    return res.status(200).json("success");
  } catch (e) {
    //console.log("error in route remove word", e);
    res.status(500).json('oops... something went wrong')

  }



 });


mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Mixing it up on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });


// app.get("/test", async (req, res) => {
//   const word = req.query.word;
//   try {
//     const wordObject = await axios.get(API_URL + word, {
//       headers: {
//         app_id: process.env.APP_ID,
//         app_key: process.env.API_KEY,
//       },
//     });
//     if ("error" in wordObject) {
//       console.log(wordObject.error);
//       return null;
//     }
//     return res.send(wordObject);
//   } catch (error) {
//     console.error(error);
//     res.status(400).send();
//   }
// });
