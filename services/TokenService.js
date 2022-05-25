const jwt = require('jsonwebtoken');
const RedisClient = require('../redis');

// TODO: when to close redis connection?
class TokenService {

  constructor() {
    this.jwt_access_expiration = '5m'; // '5d'; // TODO: change to '5d'
    this.jwt_refresh_expiration = '120d';
    this.ACCESS_TOKEN = 'accessToken';
    this.REFRESH_TOKEN = 'refreshToken';
    this.redisClient = RedisClient.getInstance().getRedisClient();
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

  /**
   * @description update an existing session entry
   * @param user {id, email} User whose session to update
   * @returns {accessToken } returns the access token or null on failure
   */
updateAccessToken = async (id, email) => {
  try {
    const accessToken = this.generateAccessToken(id, email);
    // save token in redis - note: _id is an object, so stringify needed
    const reply = await this.redisClient.hSet(_id, ACCESS_TOKEN, accessToken);
    console.log('reply from redis in update access token: ', reply);
    return accessToken;
  } catch (error) {
    console.log('error creating sessions', error);
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
    // const reply = await this.redisClient.HMSET(
    //   id,
    //   this.ACCESS_TOKEN,
    //   accessToken,
    //   this.REFRESH_TOKEN,
    //   refreshToken,
    // );

    const reply = await this.redisClient.hSet(id, ...Object.entries({
     id,
     [this.ACCESS_TOKEN] : accessToken,
     [this.REFRESH_TOKEN] : refreshToken
    }))

    console.log('reply from redis in createSessions: ', reply);
    return { accessToken, refreshToken };
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
    this.redisClient.del(id)
  }

  /**
   * @description Retrieve distinct "fields" which are in the provided status
   * @param query {object} Object that maps to the status to retrieve docs for
   * @param field {string} The distinct field to retrieve
   * @returns {Promise} Returns the results of the query
   */
  findDistinct(query, field) {
    return this.model.find(query).distinct(field).exec();
  }

  /**
   * @description Retrieve a single document from the Model with the provided
   *   query
   * @param query {object} Query to be performed on the Model
   * @param {object} [projection] Optional: Fields to return or not return from
   * query
   * @param {object} [options] Optional options to provide query
   * @returns {Promise} Returns the results of the query
   */
  findOne(query, projection = { __v: 0 }, options = { lean: true }) {
    return this.model
      .findOne(query, projection, options)
      .select({ __v: 0 })
      .exec();
  }

  /**
   * @description Retrieve multiple documents from the Model with the provided
   *   query
   * @param query {object} - Query to be performed on the Model
   * @param {object} [projection] Optional: Fields to return or not return from
   * query
   * @param {object} [sort] - Optional argument to sort data
   * @param {object} [options] Optional options to provide query
   * @returns {Promise} Returns the results of the query
   */
  find(
    query,
    projection = { __v: 0 },
    sort = { id: 1 },
    options = { lean: true },
  ) {
    return this.model
      .find(query, projection, options)
      .sort(sort)
      .select({ __v: 0 })
      .exec();
  }

  /**
   * @description Retrieve a single document matching the provided ID, from the
   *   Model
   * @param id {string} Required: ID for the object to retrieve
   * @param {object} [projection] Optional: Fields to return or not return from
   * query
   * @param {object} [options] Optional: options to provide query
   * @returns {Promise} Returns the results of the query
   */
  findById(id, projection = { __v: 0 }, options = { lean: true }) {
    return this.model.findById(id, projection, options).exec();
  }

  /**
   * @description Update a document matching the provided ID, with the body
   * @param id {string} ID for the document to update
   * @param body {object} Body to update the document with
   * @param {object} [options] Optional options to provide query
   * @returns {Promise} Returns the results of the query
   */
  update(id, body, options = { lean: true, new: true }) {
    return this.model.findByIdAndUpdate(id, body, options).exec();
  }
}

module.exports = TokenService
