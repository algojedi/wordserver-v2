const redis = require('redis')


class RedisClient {
  static _instance

  constructor() {
    this.connected = false;
    this.client = redis.createClient();
    client.on('error', (err) => console.log('Redis Client Error', err));

    client.connect((err) => {
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
    console.log('new instance of RedisClient');
    this._instance = new RedisClient()
    return this._instance;
  }

   getRedisClient() {
        return this.client;
    }
}

export default RedisClient;

/*
const redisClient = new RedisClient();
Object.freeze(redisClient);
export default redisClient

(async () => {
  redisClient = redis.createClient();
  redisClient.on('error', (err) => console.log('Redis Client Error', err));
  await redisClient.connect();

  await redisClient.set('key', 'foobar');
  await redisClient.hSet('beatle', 'paul', 'mccartney');
  const value = await redisClient.get('key');
  const hVal = await redisClient.hGet('beatle', 'paul');
  console.log({ value });
  console.log({ hVal });
})();

module.exports = redisClient;
*/
