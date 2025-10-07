// import { Request } from "express";
// import { IUser } from "../model//User.js";
// import { Response, NextFunction } from "express";
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// import { JwtPayload } from "jsonwebtoken";
// dotenv.config();
// // import { IUser } from '../../dist/model/User';

// export interface AuthenticatedRequest extends Request {
//     user?: IUser | null; // or whatever type your user is
// }

// export const isAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
//    Promise<void> =>{
//     try {
//         const authHeader = req.headers.authorization;
//         if (!authHeader || !authHeader.startsWith('Bearer ')) {
//             return res.status(401).json({ message: 'Please Login - No auth header' });
//         }
//         const token = authHeader.split(' ')[1];
//         // if (!token) {
//         //     return res.status(401).json({ message: 'Please Login - No token' });
//         // }
//         const decodedValue = jwt.verify(token, process.env.JWT_SECRET) as { user: string } as JwtPayload;;
//         if (!decodedValue || !decodedValue.user) {
//             return res.status(401).json({ message: 'Please Login - Invalid token' });
//         }
//         req.user = decodedValue.user as IUser;
//         next();
//     } catch (error) {
//         res.status(401).json({ message: 'Please Login - JWT error', error });
//     }
//    }
// };
import { User } from "../model/User.js";
import type { IUser } from "../model/User.js";
import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export interface AuthenticatedRequest extends Request {
    user?: IUser | null;
}

export const isAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Please login - no auth header' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Please login - no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & { user: string };
        const userId = decoded.user;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Please login - JWT error', error });
    }
};
