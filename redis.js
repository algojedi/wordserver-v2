const redis = require('redis')

let redisClient 
(async () => {
  redisClient = redis.createClient();
  redisClient.on('error', (err) => console.log('Redis Client Error', err));

  await redisClient.connect();

  await redisClient.set('key', 'foobar');
  const value = await redisClient.get('key');
  console.log({ value });
})();

module.exports = redisClient;
