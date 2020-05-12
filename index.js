const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const wordRoutes = require("./routes/words");
const redisClient = require("./redis");

require("dotenv").config();

const MONGO_URI = `mongodb+srv://${process.env.DB_UN}:${process.env.DB_PW}@cluster0-ohht9.azure.mongodb.net/test?retryWrites=true&w=majority`;
//removed from uri: ?retryWrites=true&w=majority

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "wordsie", "build")));

-app.get("/", function (req, res) {
  +app.get("/*", function (req, res) {
    res.sendFile(path.join(__dirname, "wordsie", "build", "index.html"));
  });
});

//save userid on req object if there's a token
app.use(function(req, res, next) {
	const { authorization } = req.headers; //authorization is the token
	if (!authorization) {
		console.log("no auth token");
		return next(); // user will not be able to access all routes
	} else {
		//    console.log(authorization)
		redisClient.get(authorization, (err, reply) => {
			if (err || !reply) {
				console.log("issue with token", err);
				return res
					.status(400)
					.json("Authorization denied");
			}
			//     console.log('reply from redis in middleware', reply)
			req.userId = JSON.parse(reply);
			next();
		});
	}
});
app.use(authRoutes);
app.use(wordRoutes);



mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(result => {
		const PORT = process.env.PORT || 3000;
		app.listen(PORT, () => {
			console.log(`Mixing it up on port ${PORT}`);
		});
	})
	.catch(err => {
		console.log(err);
	});

