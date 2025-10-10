import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
// Note: Chat service doesn't contain a local User model. The token may contain either
// a user id string or a full user object under the `user` claim depending on the
// service that issued the token. Normalize to a minimal IUser with string _id.

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
      user: any;
    };

    const rawUser = (decoded as any).user;
    let userId: string | undefined;
    let userName = "";
    let userEmail = "";

    if (typeof rawUser === "string") {
      userId = rawUser;
    } else if (rawUser && typeof rawUser === "object") {
      // Common shapes: { _id: '...', ... } or { id: '...' } or a full mongoose doc
      if (rawUser._id) userId = rawUser._id.toString();
      else if (rawUser.id) userId = rawUser.id.toString();
      else if (rawUser.toString && typeof rawUser.toString === 'function') {
        // fallback: try toString (may produce [object Object] if not an ObjectId)
        userId = rawUser.toString();
      }

      userName = rawUser.name || "";
      userEmail = rawUser.email || "";
    }

    if (!userId) {
      console.error("Auth middleware: could not extract user id from token payload", rawUser);
      return res.status(401).json({ message: "Please login - invalid token payload" });
    }

    // Attach normalized minimal user object
    req.user = { _id: userId, name: userName, email: userEmail } as IUser;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Please login - JWT error" });
    return;
  }
};
