const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
//const session = require("express-session");

//a pkg to facilitate storing sessions in mongo. ** returns a constructor:
//const MongoDBStore = require("connect-mongodb-session")(session); 

require('dotenv').config();


const MONGO_URI = `mongodb+srv://${process.env.DB_UN}:${process.env.DB_PW}@cluster0-ohht9.azure.mongodb.net/test?retryWrites=true&w=majority`;
//removed from uri: ?retryWrites=true&w=majority

const app = express();

//user saved in session upon login is not a mongoose recognizable model (has no methods)
//we retrieve the model via user._id

///TODO: This method is needed!?

// app.use((req, res, next) => {
//   if (!req.session.user) {
//     return next();
//   }
//   User.findById(req.session.user._id)
//     .then(user => {
//       req.user = user;
//       next();
//     })
//     .catch(err => console.log(err));
// });


app.use(cors());
app.use(bodyParser.json());
app.use(authRoutes);
    
const API_URL = 'https://od-api.oxforddictionaries.com/api/v2/entries/en-gb/';


const Wordef = require('./models/wordef');
const User = require('./models/user');

//function returns object containing all relevant word info in WordDef schema layout, or null if no match found
const fetchWordInfo = async word => {
    try {
        const wordObject = await axios.get(API_URL + word, {
            headers: {
                app_id: process.env.APP_ID,
                app_key: process.env.API_KEY
            }
        });
        if ('error' in wordObject) {
            console.log(wordObject.error)
            return null
        }

        //first object in lexicalEntries array contains word definitions and examples
        const wordInfo = wordObject.data.results[0].lexicalEntries[0];
        const definitions = []; //for storing 1+ definitions of a word

        //loop through senses array to populate definitions
        wordInfo.entries[0].senses.filter(data => 'examples' in data)
            .forEach(def => {
                //console.log('def is ', def);
                definitions.push({
                    definition: def.definitions[0],
                    examples: def.examples.map(eg => {
                        return { text: eg.text }
                    })
                })
            });

        const type = wordInfo.lexicalCategory.text;
        console.log('successful word retrieval: ', definitions);
        return { word, type, definitions }

    }
    catch (err) {
        console.log('error when fetching for api', err)
    }
}


app.get('/define', async (req, res) => {
    const word = req.query.word;

    if (!word) {
        return res.send('<h3>Enter a word</h3>')
    }

    //check mongo if word is already stored
    try {
        const wordQuery = await Wordef.findOne({ word });  //returns null if no matches
        if (wordQuery) { //return word definition if found in mongo
            console.log('word defs from mongodb: ', wordQuery.definitions);
            return res.send(wordQuery.definitions);
        }

        //not found in mongodb, therefor query api...
        const wordInfo = await fetchWordInfo(word);

        return res.send(wordInfo);

    }
    catch (error) {
        console.error(error);
        res.send(400);
    }
})


//temp route to act as root
app.get('/home', (req, res) => {
    return res.send('<h1>Hello other there!</h1>')

})

app.get('/getCart', async (req, res) => {
  const userId = "5e38399819864a04d8c90b44";    //user John Lennon in db
  user = await User.findById(userId);
  if (!user) {
      return res.status(400).json('unable to find user in addWord route')
  } 
  User.
  findOne({ _id : user._id })
  .populate('cart') // only works if we pushed refs to children
  .exec(function (err, person) {
    if (err) {
        return console.log(err);
    } 
    console.log(person);
    res.json(person.cart);
  })
  
//   user
//     .populate('cart') //does not return a Promise
//     .execPopulate() //does return a Promise
//     .then(user => res.json(user.cart))
//     .catch(err => console.log(err));
// 
});

//takes in a word as a parameter
app.get('/', async (req, res) => {
    const word = req.query.word;

    if (!word) {
        return res.send('<h3>Enter a word</h3>')
    }
    //console.log(API_URL+word);
    try {
        //wordObj contains all the needed word info
        const wordObj = await axios.get(API_URL + word, { 
            headers: {
                app_id : process.env.APP_ID,
                app_key : process.env.API_KEY
            }
        });
        

        const wordObjInfo = wordObj.data.results[0].lexicalEntries[0];

        //the first object in the senses array has all the good stuff
        const definitions = []; //for storing 1+ definitions of a word


        //for each loops through senses array
        wordObjInfo.entries[0].senses.filter(data => 'examples' in data)
            .forEach(def => {
                    //console.log('def is ', def);
                    definitions.push({  definition: def.definitions[0], 
                                        examples: def.examples.map(eg => {
                                            return { text: eg.text }
                                        }) 
                                    }) 
            });

        const type = wordObjInfo.lexicalCategory.text;
        
            // --- id for zestful word object
        // console.log('finding zestful word object');
        // const wobj = await Wordef.findOne({ word: 'zestful' });
        // const wid = wobj._id;
        // console.log(wid);
            // -----------------------


    
            
    

        // ---------- creating new word ------------
        // const wordDef = new Wordef({
        //     //_id: mongoose.Types.ObjectId(),
        //     //_id: word,
        //     word,
        //     type,
        //     definitions
            
        // });
        // wordDef.save().then(result => { //save() will save to DB
        //     console.log(result)
            // -------------------------------

    } catch(error) {
        console.error(error);
        res.send(400);
    }
    
});

app.post('/removeWord', async (req, res) => {
  const userId = "5e1cbaed7f37fe29f8f2aaf8";    //user Jake in db
  user = await User.findById(userId);
  if (!user) {
      return res.status(400).json('unable to find user in addWord route')
  } 

  const wordId = req.body.wordId;
  try {
      const word = await Wordef.findById(wordId);
      if (word) {
          user.removeFromCart(word._id); //argument must be of type ObjectID
          res.json('removed from cart');   
      } else {
          res.json("word not found in cart");   
      }
  }
  catch(e) {
      console.log('error in route remove word', e);
      res.send(400);
  }
})


app.post('/addWord', async (req, res) => {
  const userId = "5e38399819864a04d8c90b44";    //user Joh lennon in db
  user = await User.findById(userId);
  if (!user) {
      return res.status(400).json('unable to find user in addWord route')
  }
  
  const wordId = req.body.wordId;
  try {
      const word = await Wordef.findById(wordId);
      if (word) {
          user.addToCart(word._id); //should be of type ObjectID....
          res.json('added word to cart');   
      } else {
          res.json("word already in cart");   
      }
  }
  catch(e) {
      console.log('error in route adding word', e);
      res.send(400);
  }
});



app.get("/emptyCart", async (req, res) => {
  const userId = "5e1cbaed7f37fe29f8f2aaf8"; //user Jake in db
  user = await User.findById(userId);
  if (!user) {
    return res.status(400).json("unable to find user in addWord route");
  }

  try {
    
      user.clearCart(); 
      return res.json("emptied cart");
    
  } catch (e) {
    console.log("error in route empty cart", e);
    res.send(400);
  }
});


mongoose
    .connect(MONGO_URI,
        { useNewUrlParser: true, useUnifiedTopology: true })
    .then(result => {
        
        
        const PORT = process.env.PORT || 3001;
        app.listen(PORT, () => {
            console.log(`Mixing it up on port ${PORT}`)
        })
    })
    .catch(err => { console.log(err) });