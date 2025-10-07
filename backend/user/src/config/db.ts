import mongoose from 'mongoose';

const connectDb = async () => {
    const url = process.env.MONGO_URI || 'mongodb://localhost:27017/chat_app';
    if(!url) {
        throw new Error('MongoDB connection string is not defined');
    }   
    try {
        await mongoose.connect(url, {
            dbName: 'Chatappmicroserviceapp',
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
}
export default connectDb;
