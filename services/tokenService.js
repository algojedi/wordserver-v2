const jwt = require('jsonwebtoken');
const RedisClient = require('../redis');

class TokenService {
  constructor() {
    this.jwt_access_expiration = '30d';
    this.jwt_refresh_expiration = '120d';
    this.ACCESS_TOKEN = 'accessToken';
    this.REFRESH_TOKEN = 'refreshToken';
    this.redisClient = RedisClient.getInstance().getRedisClient();
  }

  getRefreshToken(id) {
    return this.redisClient.hGet(id, this.REFRESH_TOKEN);
  }

  getAccessToken(id) {
    return this.redisClient.hGet(id, this.ACCESS_TOKEN);
  }

  /**
   * @description update an existing session entry
   * @param user {id, email} User whose session to update
   * @returns {accessToken } returns the access token or null on failure
   */
  updateAccessToken = async (id, email) => {
    try {
      const accessToken = this.generateAccessToken(id, email);
      // save token in redis - note: _id is an object, so stringify needed
      const reply = await this.redisClient.hSet(
        id,
        this.ACCESS_TOKEN,
        accessToken,
      );
      console.log('reply from redis in update access token: ', reply);
      const realReplyUpdate = await this.redisClient.hGet(
        id,
        this.ACCESS_TOKEN,
      );
      console.log({ realReplyUpdate });
      return accessToken;
    } catch (error) {
      console.log('error creating sessions', error);
      return null;
    }
  };

  deleteTokens = async (id) => {
    try {
      return await this.redisClient.hDel(
        id,
        this.ACCESS_TOKEN,
        this.REFRESH_TOKEN,
      );
    } catch (error) {
      console.log('error deleting tokens', error);
      return null;
    }
  };

  decodeToken = async (token) => {
    try {
      const { id, email } = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const savedAccessToken = await this.getAccessToken(id);
      return savedAccessToken === token ? { id, email } : null;
    } catch (error) {
      console.log('invalid access token', error.message);
      return null;
    }
  };

  /**
   * @description Create a new session for the provided user
   * @param user {id, email} User to create a session for
   * @returns {accessToken, refreshToken} returns the access and refresh tokens or null on error
   */
  createSessions = async (id, email) => {
    try {
      const accessToken = this.generateAccessToken(id, email);
      const refreshToken = this.generateRefreshToken(id, email);
      // save token in redis - note: id is an object, so stringify needed

      await this.redisClient.hSet(id + '', this.ACCESS_TOKEN, accessToken);
      await this.redisClient.hSet(id + '', this.REFRESH_TOKEN, refreshToken);
      const reply = await this.redisClient.hGetAll(id + '');

      return {
        [this.ACCESS_TOKEN]: accessToken,
        [this.REFRESH_TOKEN]: refreshToken,
      }
    } catch (error) {
      console.log('error creating sessions', error);
      return null;
    }
  };

  /**
   * @description Delete an existing session entry
   * @param id {string} ID for the object to delete
   * @returns {Promise} Returns the results of the query
   */
  delete(id) {
    // TODO: delete session from redis .. but how to import into class?
    // return this.model.findByIdAndDelete(id).exec();
    // this.redisClient.delete(id);
    this.redisClient.del(id);
  }

  generateAccessToken(id, email) {
    return jwt.sign({ id, email }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: this.jwt_access_expiration,
    });
  }

  generateRefreshToken(id, email) {
    return jwt.sign({ id, email }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: this.jwt_refresh_expiration,
    });
  }
}

module.exports = TokenService;
