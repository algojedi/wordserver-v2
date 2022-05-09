const jwt = require('jsonwebtoken');

function generateAccessToken(id, email) {
  return jwt.sign({ id, email }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: jwt_access_expiration,
  });
}

function generateRefreshToken(id, email) {
  return jwt.sign({ id, email }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: jwt_refresh_expiration,
  });
}

/* user must be defined 
   returns refresh token and access token on success and null on failure
*/
const createSessions = async (user) => {
  const { _id, email } = user;

  try {
    const accessToken = generateAccessToken(_id, email);
    const refreshToken = generateRefreshToken(_id, email);

    // save token in redis - note: _id is an object, so stringify needed

    const reply = await redisClient.set(
      _id,
      JSON.stringify({ refreshToken, accessToken }),
    );
    console.log('reply from redis in createSessions: ', reply);
    return { accessToken, refreshToken };
  } catch (error) {
    console.log('error creating sessions', error);
    return null;
  }
};

module.exports = { createSessions, generateAccessToken, generateRefreshToken }