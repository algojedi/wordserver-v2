const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const wordRoutes = require('./routes/words');
// const redisClient = require('./redis');
const limiter = require('./middleware/limiter');
const myLimiter = require('./middleware/limiter');
const RedisClient = require('./redis');

require('dotenv').config();

const MONGO_URI = `mongodb+srv://${process.env.DB_UN}:${process.env.DB_PW}@cluster0-ohht9.azure.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express();
RedisClient.getInstance(); // initialize redis client

if (process.env.NODE_ENV === 'production') {
  console.log('Running in :', process.env.NODE_ENV);
}

app.use(cors());
app.use(bodyParser.json());

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'wordsie', 'build')));
}

//---------- rate limiting --------------------//
// TODO: must test to see if this is working
app.use(limiter);
//apply to all requests, regardless of user
app.use(myLimiter);

//---------------------------------------

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

const PORT = process.env.PORT || 3001;

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => {
    app.listen(PORT, () => {
      console.log(`Mixing it up on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
