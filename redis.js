const redis = require('redis')

let redisClient 
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
