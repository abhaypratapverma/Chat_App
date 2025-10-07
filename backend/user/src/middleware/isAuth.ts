import { User } from "../model/User.js";
import type { IUser } from "../model/User.js";
import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export interface AuthenticatedRequest extends Request {
  user?: IUser | null;
}

export const isAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Please login - no auth header" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Please login - no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & {
      user: string;
    };
    const userId = decoded.user;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Please login - JWT error", error });
  }
};
