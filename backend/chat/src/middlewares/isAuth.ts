import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
// Note: Chat service doesn't contain a local User model. The token contains the user id
// so we only attach a minimal user object (id, name, email) to the request.

export interface IUser {
  _id: string;
  name: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: IUser | null;
}

export const isAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Please login - no auth header" });
      return; // ✅ return void
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "Please login - no token" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & {
      user: string;
    };
    const userId = decoded.user;

    // We don't have access to the user database from this service. Attach a minimal
    // user object with the id so downstream handlers can use req.user?._id.
    req.user = { _id: userId, name: "", email: "" } as IUser;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Please login - JWT error" });
    return;
  }
};
