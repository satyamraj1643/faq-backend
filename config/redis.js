const redis = require("redis");
require('dotenv').config();

const redisClient = redis.createClient({
    url: process.env.REDIS_URL
});

redisClient.on("error", (err) => {
    console.error("Issue with redis client", err);
});


// async immediately invoked funtion expr..
(async () => {
    try {
        await redisClient.connect();
        console.log("cache memory connected!");
    } catch (error) {
        console.error("cache memory failed to connect:", error);
    }
})();


module.exports = redisClient;
