const redis = require("redis");

const REDIS_PORT = process.env.PORT;
const redisClient = redis.createClient({ host: "127.0.0.1" });

redisClient.on("connect", function () {
  console.log("Redis connected");
});

redisClient.on("error", function (err) {
  console.log("Redis connection: Something went wrong " + err);
});

module.exports =  redisClient;
