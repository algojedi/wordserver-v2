const RedisClient = require('../redis');
const TokenService = require('../services/tokenService');

const tokenService = new TokenService();

// attach userid to req if valid token
module.exports = async (req, res, next) => {
  try {
    // authorization is the token
    const { authorization } = req.headers; 
    if (!authorization) {
      throw new Error('Authorization denied. Missing token');
    }
    const splitAuthHeader = authorization.split(' ');
    if (splitAuthHeader.length !== 2) {
      throw new Error('Auth token incorrectly sent');
    }
    const token = splitAuthHeader[1];
    const user = await tokenService.decodeToken(token);
    if (!user) throw new Error('Authorization denied. Invalid token.');
    req.userId = user.id;
    next();
  } catch (e) {
    return res.status(403).json({ message: e.message });
  }
};
