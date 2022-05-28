const RedisClient = require("../redis");

const redisClient = RedisClient.getInstance(); 

module.exports = function (req, res, next) {
	 console.log('tokenCheck middleware');
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
}
