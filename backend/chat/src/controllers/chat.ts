import TryCatch from "../config/TryCatch.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { Chat } from '../models/Chat.js';

export const createNewChat = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { otherUserId } = req.body;

    if (!userId || !otherUserId) {
      return res.status(400).json({ message: "User IDs are required" });
    }
    const existingChat = await Chat.findOne({
      users: { $all: [userId, otherUserId], $size: 2 },
    });
    if (existingChat) {
      return res.status(200).json({
        message: "Chat already exists",
        chatId: existingChat._id,
        chat: existingChat,
      });
    }
    const newChat = await Chat.create({
      users: [userId, otherUserId],
    });
    res.status(201).json({
        message:"New Chat Created",
      chatId: newChat._id,
    });
  }
);
