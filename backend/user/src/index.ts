import express from 'express';
import dotenv from 'dotenv';
import  connectDb  from './config/db.js';
import {createClient} from 'redis'
import userRoutes from './routes/user.js';
import {connectRabbitMQ} from './config/rabbitmq.js';
// Load environment variables from .env file
dotenv.config();
connectDb();
connectRabbitMQ();

export const redisClient = createClient({
    url: process.env.REDIS_URL,
});

redisClient.connect()
.then(() => {
    console.log('Redis client connected successfully');
}).catch((err) => {
    console.error('Redis client connection failed:', err);
});



redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
});

const app = express();

app.use("api/v1",userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})