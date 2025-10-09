import express from 'express';
import dotenv from 'dotenv';
import connectDb from './config/db.js'
import chatRoutes from './routes/chat.js'

dotenv.config();
connectDb();

const app = express();
app.use(express.json()); // <-- Needed for parsing JSON
app.use("/api/v1",chatRoutes)

const port = process.env.PORT || 5002;

app.listen(port,()=>{
    console.log(`Server running on port ${port}`);
})

