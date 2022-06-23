const redis = require('redis');

class RedisClient {
  static _instance;

  constructor() {
    this.connected = false;
    this.client = redis.createClient({ password: process.env.REDIS_PW });
    this.client.connect((err) => {
      if (err) {
        console.log('Redis Client Error', err);
      } else {
        console.log('Redis Client Connected');
        this.connected = true;
      }
    });
  }

  static getInstance() {
    if (this._instance) {
      console.log('old instance of RedisClient');
      return this._instance;
    }
    this._instance = new RedisClient();
    return this._instance;
  }

  getRedisClient() {
    return this.client;
  }
}

module.exports = RedisClient;
