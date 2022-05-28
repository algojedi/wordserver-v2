
let counter = 0; //simple ddos precaution
//  apply to all requests, targetting each user
module.exports = function (req, res, next) {
  counter++;
  console.log('Total requests ', counter);
  //TODO: remove/reset this later
  counter > 4000 ? res.json('ummm... something went wrong') : next();
};