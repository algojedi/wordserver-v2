const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const wordRoutes = require('./routes/words');
// const redisClient = require('./redis');
const limiter = require('./utils/limiter');
const RedisClient = require('./redis');

require('dotenv').config();

const MONGO_URI = `mongodb+srv://${process.env.DB_UN}:${process.env.DB_PW}@cluster0-ohht9.azure.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express();
RedisClient.getInstance();

if (process.env.NODE_ENV === 'production') {
  console.log('Running in :', process.env.NODE_ENV);
}

app.use(cors());
app.use(bodyParser.json());

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'wordsie', 'build')));
}

//---------- rate limiting --------------------//
// TODO: remove all middleware into middleware folder
app.use(limiter);

let counter = 0; //simple ddos precaution
//  apply to all requests, targetting each user

const myLimiter = function (req, res, next) {
  counter++;
  console.log('Total requests ', counter);
  //TODO: remove/reset this later
  counter > 4000 ? res.json('ummm... something went wrong') : next();
};
//apply to all requests, regardless of user
app.use(myLimiter);

//---------------------------------------

//save userid on req object if there's a token
app.use(function (req, res, next) {
  const { authorization } = req.headers; //authorization is the token
  if (!authorization) {
    return next(); // user will not be able to access all routes
  }
  redisClient.get(authorization, (err, reply) => {
    if (err || !reply) {
      console.log('issue with token', err);
      return res.status(400).json({ message: 'Authorization denied' });
    }
    console.log('reply from redis in middleware', reply);
    req.userId = JSON.parse(reply);
    next(); 
  });
});


app.use(authRoutes);
app.use(wordRoutes);

if (process.env.NODE_ENV === 'production') {
  -app.get('/', function (req, res) {
    +app.get('/*', function (req, res) {
      res.sendFile(path.join(__dirname, 'wordsie', 'build', 'index.html'));
    });
  });
}

//enable service worker
app.get('/servicer-worker.js', (req, res) => {
  res.sendFile(
    path.resolve(__dirname, 'wordsie', 'build', 'service-worker.js'),
  );
});

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Mixing it up on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
