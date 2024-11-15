import dotenv from "dotenv";
import Redis from "ioredis";

dotenv.config();

const redisClient = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  db: parseInt(process.env.REDIS_DB || "0"),
  retryStrategy: (times) => {
    // Retry connection every 5 seconds
    return Math.min(times * 500, 2000);
  },
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

redisClient.on("connect", () => {
  console.log("Successfully connected to Redis");
});

export default redisClient;
