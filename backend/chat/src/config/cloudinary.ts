import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME as string,
  api_key: process.env.Api_Key as string,
  api_secret: process.env.Api_Secret as string,
});

export default cloudinary;
