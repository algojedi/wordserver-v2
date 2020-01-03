const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

const API_URL ='https://od-api.oxforddictionaries.com/api/v2';

app.get('/', (req, res) => {

    res.json('welcome one and all!');
});

// app.get('/', (req, res) => {
//     const word = req.query.lang;
//     //console.log(language);
//     const url = `https://jobs.github.com/positions.json?description=${language}`;
//     axios.get(url)
//         .then(info => {
//             //jobs = info;
//             //console.log(info.data);
//             res.send(info.data);
//         });
// });



// Choose the port and start the server
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Mixing it up on port ${PORT}`)
})