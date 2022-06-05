const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'You have exceeded the 100 requests in 15 mins limit!',
  headers: true,
});

console.log('limiter loaded?')
module.exports = limiter;
