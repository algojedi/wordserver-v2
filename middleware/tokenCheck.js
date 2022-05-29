const RedisClient = require("../redis");
const TokenService = require('../services/TokenService');

const tokenService = new TokenService();

module.exports = async (req, res, next) => {
  const { authorization } = req.headers; //authorization is the token
  if (!authorization) {
      return res.status(403).json({ message: 'Authorization denied' });
  }
  const splitAuthHeader = authorization.split(" ")
  if (splitAuthHeader.length !== 2) {
      return res.status(400).json({ message: 'Auth token incorrectly sent' });
  }
  const token = splitAuthHeader[1]; 
  const user = await tokenService.decodeToken(token);
  if (!user) {
    return res.status(403).json({ message: 'Authorization denied' });
  }
  req.userId = user.id;
  next()
}
