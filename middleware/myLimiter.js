
const maxTotalRequests = 1000
let counter = 0
//  apply to all requests, targetting each user
module.exports = function (req, res, next) {
  counter++;
  console.log('Total requests ', counter);
  //TODO: remove/reset this later
  if (counter > maxTotalRequests) {
    console.log('Too many damn requests: ' + counter)
    process.exit(1);
  }  
   next();
};
