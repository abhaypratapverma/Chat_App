import TryCatch from '../config/TryCatch.js';
import type { AuthenticatedRequest } from '../middlewares/isAuth.js';
import { Chat } from '../models/Chat.js';
import { Messages } from '../models/Messages.js';
import axios from 'axios';

export const createNewChat = TryCatch(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?._id;
  const { otherUserId } = req.body;

  if (!userId || !otherUserId) {
    return res.status(400).json({ message: 'User IDs are required' });
  }
  const existingChat = await Chat.findOne({
    users: { $all: [userId, otherUserId], $size: 2 },
  });
  if (existingChat) {
    return res.status(200).json({
      message: 'Chat already exists',
      chatId: existingChat._id,
      chat: existingChat,
    });
  }
  const newChat = await Chat.create({
    users: [userId, otherUserId],
  });
  res.status(201).json({
    message: 'New Chat Created',
    chatId: newChat._id,
  });
});

export const getAllChats = TryCatch(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?._id;
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  const chats = await Chat.find({ users: userId }).sort({ updatedAt: -1 });

  const chatWithUserData = await Promise.all(
    chats.map(async (chat) => {
      const otherUserId = chat.users.find((id) => id !== userId);

      const unseenCount = await Messages.countDocuments({
        chatId: chat._id,
        seen: false,
        sender: { $ne: userId },
      });
      try {
        const { data } = await axios.get(`${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`);
        return {
          // user: data,
          user: data.user || data, //my fix for undefined user issue
          chat: {
            ...chat.toObject(),
            latestMessage: chat.latestMessage || null,
            unseenCount,
          },
        };
      } catch (error) {
        console.error('Error fetching user data:', error);
        return {
          user: { _id: otherUserId, name: 'Unknown User', email: '', avatar: '' },
          chat: {
            ...chat.toObject(),
            latestMessage: chat.latestMessage || null,
            unseenCount,
          },
        };
      }
    })
  );
  res.json({
    chats: chatWithUserData,
  });
});

export const sendMessage = TryCatch(async (req: AuthenticatedRequest, res) => {
  const senderId = req.user?._id;
  const { chatId, text, image } = req.body;
  const ImageFile = req.file;

  if (!senderId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (!chatId) {
    return res.status(400).json({ message: 'ChatId Required' });
  }
  if (!text && !image && !ImageFile) {
    return res.status(400).json({ message: 'Message content is required' });
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return res.status(404).json({ message: 'Chat not found' });
  }

  const isUserInChat = chat.users.some((userId) => userId.toString() === senderId.toString());

  if (!isUserInChat) {
    return res.status(403).json({ message: 'You are not a participant of this chat' });
  }

  const otherUserId = chat.users.find((userId) => userId.toString() !== senderId.toString());

  if (!otherUserId) {
    return res.status(401).json({ message: 'No ohter User ' });
  }

  // socket Setup

  let messageData: any = {
    chatId,
    sender: senderId,
    seen: false,
    seenAt: null,
    // text: text || '',
  };
  if (ImageFile) {
    messageData.image = {
      url: ImageFile.path,
      public_id: ImageFile.filename,
    };
    messageData.messageType = 'image';
    messageData.text = text || '';
  } else {
    messageData.text = text || '';
    messageData.messageType = 'text';
  }

  const message = new Messages(messageData);

  const savedMessage = await message.save();

  const latestMessageText = ImageFile ? '📸 Image' : text;

  await Chat.findByIdAndUpdate(
    chatId,
    {
      latestMessage: {
        text: latestMessageText,
        sender: senderId,
      },
      updatedAt: new Date(),
    },
    { new: true }
  );

  // Emit real-time event to the other user via Socket.io
  res.status(201).json({
    status: 'Message Sent Successfully',
    message: savedMessage,
    // chatId: chat._id,
    // otherUserId,
    sender: senderId,
  });
});
// export const sendMessage = TryCatch(async (req: AuthenticatedRequest, res) => {
//   const senderId = req.user?._id;
//   const { chatId, text, image } = req.body;
//   const imageFile = req.file; // fixed variable name

//   if (!senderId) {
//     return res.status(401).json({ message: 'Unauthorized' });
//   }
//   if (!chatId) {
//     return res.status(400).json({ message: 'ChatId Required' });
//   }
//   if (!text && !image && !imageFile) {
//     return res.status(400).json({ message: 'Message content is required' });
//   }

//   const chat = await Chat.findById(chatId);
//   if (!chat) {
//     return res.status(404).json({ message: 'Chat not found' });
//   }

//   const isUserInChat = chat.users.some((userId) => userId.toString() === senderId.toString());
//   if (!isUserInChat) {
//     return res.status(403).json({ message: 'You are not a participant of this chat' });
//   }

//   const otherUserId = chat.users.find((userId) => userId.toString() !== senderId.toString());
//   if (!otherUserId) {
//     return res.status(401).json({ message: 'No other user found' });
//   }

//   // Prepare message data
//   let latestMessageText: string;
//   const messageData: any = {
//     chatId,
//     sender: senderId,
//     seen: false,
//     seenAt: null,
//   };

//   if (imageFile) {
//     messageData.image = {
//       url: imageFile.path,
//       public_id: imageFile.filename,
//     };
//     messageData.messageType = 'image';
//     messageData.text = text || '';
//     latestMessageText = '📸 Image';
//   } else {
//     messageData.text = text || '';
//     messageData.messageType = 'text';
//     latestMessageText = text || '';
//   }

//   const message = new Messages(messageData);
//   const savedMessage = await message.save();

//   // Update latest message in chat
//   await Chat.findByIdAndUpdate(
//     chatId,
//     {
//       latestMessage: {
//         text: latestMessageText,
//         sender: senderId,
//       },
//       updatedAt: new Date(),
//     },
//     { new: true }
//   );

//   // Respond
//   res.status(201).json({
//     status: 'Message Sent Successfully',
//     message: savedMessage,
//     sender: senderId,
//   });
// });
