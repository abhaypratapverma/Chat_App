import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export const generateToken = (user: string) => {
    console.log("Generating token for user:", user);
    return jwt.sign({user},JWT_SECRET, {expiresIn: '15d'});
};