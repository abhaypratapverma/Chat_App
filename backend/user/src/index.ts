import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import { createClient } from "redis";
import userRoutes from "./routes/user.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import cors from "cors";
// Load environment variables from .env file

dotenv.config();
connectDb();
connectRabbitMQ();

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error("❌ REDIS_URL is not defined");

export const redisClient = createClient({
  url: redisUrl,
});

redisClient
  .connect()
  .then(() => {
    console.log("Redis client connected successfully");
  })
  .catch((err) => {
    console.error("Redis client connection failed:", err);
  });

redisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/v1", userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
