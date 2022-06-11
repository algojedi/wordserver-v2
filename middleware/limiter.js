const rateLimit = require('express-rate-limit');

const maxRequests = 75 
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: maxRequests, //  100, // limit each IP to 100 requests per windowMs
  message: 'You have exceeded the ' + maxRequests  + ' requests in 15 mins limit!',
  headers: true,
});

module.exports = limiter;
