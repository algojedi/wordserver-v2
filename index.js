const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();


//TODO: Words need to reference 1+ definitions! Need Definition Model
const app = express();

app.use(cors());
app.use(bodyParser.json());

const API_URL ='https://od-api.oxforddictionaries.com/api/v2/entries/en-gb/';

const Wordef = require('./models/wordef');
const User = require('./models/user');


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
        //return res.send(wordObj.data);

        const wordObjInfo = wordObj.data.results[0].lexicalEntries[0];

        //the first object in the senses array has all the good stuff

        const definitions = []; //for storing 1+ definitions of a word

        
        wordObjInfo.entries[0].senses.forEach(def => {
        console.log('examples array', def.examples);
           definitions.push({   definition: def.definitions[0], 
                                examples: def.examples
                                    .filter()
                                    .map(eg => {
                                   { text: eg.text }
                                }) }) 
        });

        //const definition = wordObjInfo.entries[0].senses[0].definitions[0];
        
        //examples is an array with at least one object element
        
        //const examples = wordObjInfo.entries[0].senses[0].examples;
        console.log('definitions array is ', definitions);

        const type = wordObjInfo.lexicalCategory.text;
        //console.log('definition is ', typeof definition);
        //console.log('example is ', examples);
        
        const wordDef = new Wordef({
            //_id: mongoose.Types.ObjectId(),
            _id: word,
            word,
            type,
            definitions
            
        });
        // wordDef.save().then(result => { //save() will save to DB
        //     console.log(result)
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
        const user = new User({
            name: 'Dax',
            email: 'max@test.com',
            cart: {
                words: [{wordId: 'reserved'}]
            }
        });
        user.save();
        
        const PORT = process.env.PORT || 3001;
        app.listen(PORT, () => {
            console.log(`Mixing it up on port ${PORT}`)
        })
    })
    .catch(err => { console.log(err) });