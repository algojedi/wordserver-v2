const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

const API_URL ='https://od-api.oxforddictionaries.com/api/v2/entries/en-gb/';

// app.get('/', (req, res) => {

//     res.json('welcome one and all!');
// });

app.get('/', async (req, res) => {
    const word = req.query.word;

    //console.log(API_URL+word);
    try {
        const wordObj = await axios.get(API_URL + word, { 
            headers: {
                app_id : process.env.APP_ID,
                app_key : process.env.API_KEY
            }
        });
        //the first object in the senses array has all the good stuff
        const definition = wordObj.data.results[0].lexicalEntries[0].entries[0].senses[0].definitions[0];
        //examples is an array with at least one object element
        const examples = wordObj.data.results[0].lexicalEntries[0].entries[0].senses[0].examples;
        const type = wordObj.data.results[0].lexicalEntries[0].lexicalCategory.text;
        res.send({ definition, examples, type });
    } catch (error) {
        console.error(error);
        res.send(400);
    }
    
});

// Choose the port and start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Mixing it up on port ${PORT}`)
})