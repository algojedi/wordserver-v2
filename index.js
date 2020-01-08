const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

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

app.get('/getDefs', async (req, res) => {
    Wordef.find()  //find returns an array, NOT a cursor - .cursor() would
    .then(defs => {
        console.log(defs);
        res.send(defs);
    })
    .catch(err => console.log(err))

})

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
        console.log('finding zestful word object');
        const wobj = await Wordef.findOne({ word: 'zestful' });
        const wid = wobj._id;
        console.log(wid);
            // -----------------------


        // const doc = await User.findOne({ name: 'Jerome' })
        //     .populate('cart')
        //     .exec(function (err, person) {
        //         if (err) { return console.log(err) }
        //         console.log('The word is ', person.cart[0].definitions[0].examples)
        //     });
            
        
            



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


        //----------creating new user -------------
        const user = new User({
            name: 'Jerome',
            email: 'max@test.com',
            cart:  [wid]
        });
        user.save(); 
        //---------------------------------------


        // }).catch(err => { console.log(err) })

        res.send({ word, definitions, type });
    } catch (error) {
        console.error(error);
        res.send(400);
    }
    
});



mongoose
    .connect(`mongodb+srv://${process.env.DB_UN}:${process.env.DB_PW}@cluster0-ohht9.azure.mongodb.net/test?retryWrites=true&w=majority`,
        { useNewUrlParser: true, useUnifiedTopology: true })
    .then(result => {
        
        
        const PORT = process.env.PORT || 3001;
        app.listen(PORT, () => {
            console.log(`Mixing it up on port ${PORT}`)
        })
    })
    .catch(err => { console.log(err) });