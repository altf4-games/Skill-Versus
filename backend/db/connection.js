import mongoose from "mongoose";
import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

// Redis connection
let redisClient = null;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    await redisClient.connect();
    console.log('Redis Connected Successfully');
    return redisClient;
  } catch (error) {
    console.error("Error connecting to Redis:", error.message);
    // Don't exit process for Redis connection failure - contests will be disabled
    console.warn("Contest features will be disabled without Redis");
    return null;
  }
};

const getRedisClient = () => redisClient;

export default connectDB;
export { connectRedis, getRedisClient };
