import TryCatch from "../config/TryCatch.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { Chat } from "../models/Chat.js";
import { Messages } from "../models/Messages.js";
import axios from "axios";
import { getReceiverSocketId, io } from "../config/socket.js";

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
      message: "New Chat Created",
      chatId: newChat._id,
    });
  }
);

export const getAllChats = TryCatch(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?._id;
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
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
        const { data } = await axios.get(
          `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`
        );
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
        console.error("Error fetching user data:", error);
        return {
          user: {
            _id: otherUserId,
            name: "Unknown User",
            email: "",
            avatar: "",
          },
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

// export const sendMessage = TryCatch(async (req: AuthenticatedRequest, res) => {
//   const senderId = req.user?._id;
//   const { chatId, text, image } = req.body;
//   const ImageFile = req.file;

//   if (!senderId) {
//     return res.status(401).json({ message: "Unauthorized" });
//   }
//   if (!chatId) {
//     return res.status(400).json({ message: "ChatId Required" });
//   }
//   if (!text && !image && !ImageFile) {
//     return res.status(400).json({ message: "Message content is required" });
//   }

//   const chat = await Chat.findById(chatId);
//   if (!chat) {
//     return res.status(404).json({ message: "Chat not found" });
//   }

//   const isUserInChat = chat.users.some(
//     (userId) => userId.toString() === senderId.toString()
//   );

//   if (!isUserInChat) {
//     return res
//       .status(403)
//       .json({ message: "You are not a participant of this chat" });
//   }

//   const otherUserId = chat.users.find(
//     (userId) => userId.toString() !== senderId.toString()
//   );

//   if (!otherUserId) {
//     return res.status(401).json({ message: "No other User " });
//   }

//   // socket Setup

//   const receiverSocketId = getReceiverSocketId(otherUserId:toString())
//   let isReceiverInChatRoom = false

//   if(receiverSocketId){
//     const receiverSocket = io.sockets.sockets.get(receiverSocketId)
//     if(receiverSocket && receiverSocket.rooms.has(chatId)){
//       isReceiverInChatRoom = true
//     }
//   }

//   let messageData: any = {
//     chatId,
//     sender: senderId,
//     seen: isReceiverInChatRoom,
//     seenAt: isReceiverInChatRoom?new Date():undefined,
//     // text: text || '',
//   };
//   if (ImageFile) {
//     messageData.image = {
//       url: ImageFile.path,
//       public_id: ImageFile.filename,
//     };
//     messageData.messageType = "image";
//     messageData.text = text || "";
//   } else {
//     messageData.text = text || "";
//     messageData.messageType = "text";
//   }

//   const message = new Messages(messageData);

//   const savedMessage = await message.save();

//   const latestMessageText = ImageFile ? "📸 Image" : text;

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

//   // Emit real-time event to the other user via Socket.io
//   io.emit(chatId).emit("newMessage",savedMessage)
//   if(receiverSocketId){
//     io.to(receiverSocketId).emit("newMessage",savedMessage)
//   }
//   const senderSocketId = getReceiverSocketId(senderId.toString())
//    if(senderSocketId){
//     io.to(senderSocketId).emit("newMessage",savedMessage)
//    }
//    if(isReceiverInChatRoom && senderSocketId ){
//     io.to(senderSocketId).emit("messageSeen",{
//       chatId:ChatId,
//       seenBy:otherUserId,
//       messageIds: [savedMessage._id]
//     })

//    }
//   res.status(201).json({
//     status: "Message Sent Successfully",
//     message: savedMessage,
//     // chatId: chat._id,
//     // otherUserId,
//     sender: senderId,
//   });
// });
// export const sendMessage = TryCatch(async (req: AuthenticatedRequest, res) => {
//   const senderId = req.user?._id;
//   const { chatId, text, image } = req.body;
//   const imageFile = req.file;

//   if (!senderId) {
//     return res.status(401).json({ message: "Unauthorized" });
//   }

//   if (!chatId) {
//     return res.status(400).json({ message: "Chat ID is required" });
//   }

//   if (!text && !image && !imageFile) {
//     return res.status(400).json({ message: "Message content is required" });
//   }

//   const chat = await Chat.findById(chatId);
//   if (!chat) {
//     return res.status(404).json({ message: "Chat not found" });
//   }

//   const isUserInChat = chat.users.some(
//     (userId) => userId.toString() === senderId.toString()
//   );

//   if (!isUserInChat) {
//     return res
//       .status(403)
//       .json({ message: "You are not a participant of this chat" });
//   }

//   const otherUserId = chat.users.find(
//     (userId) => userId.toString() !== senderId.toString()
//   );

//   if (!otherUserId) {
//     return res.status(400).json({ message: "No other user found" });
//   }

//   // ✅ Socket setup
//   const receiverSocketId = getReceiverSocketId(otherUserId.toString());
//   let isReceiverInChatRoom = false;

//   if (receiverSocketId) {
//     const receiverSocket = io.sockets.sockets.get(receiverSocketId);
//     if (receiverSocket && receiverSocket.rooms.has(chatId)) {
//       isReceiverInChatRoom = true;
//     }
//   }

//   // ✅ Construct message data
//   const messageData: any = {
//     chatId,
//     sender: senderId,
//     seen: isReceiverInChatRoom,
//     seenAt: isReceiverInChatRoom ? new Date() : undefined,
//   };

//   if (imageFile) {
//     messageData.image = {
//       url: imageFile.path,
//       public_id: imageFile.filename,
//     };
//     messageData.messageType = "image";
//     messageData.text = text || "";
//   } else {
//     messageData.text = text || "";
//     messageData.messageType = "text";
//   }

//   const message = new Messages(messageData);
//   const savedMessage = await message.save();

//   // ✅ Update latest message in chat
//   const latestMessageText = imageFile ? "📸 Image" : text;
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

//   // ✅ Emit events
//   // Notify all users in this chat room
//   io.to(chatId).emit("newMessage", savedMessage);

//   // Notify receiver directly (if online)
//   if (receiverSocketId) {
//     io.to(receiverSocketId).emit("newMessage", savedMessage);
//   }

//   // Notify sender (in case multiple tabs/devices)
//   const senderSocketId = getReceiverSocketId(senderId.toString());
//   if (senderSocketId) {
//     io.to(senderSocketId).emit("newMessage", savedMessage);
//   }

//   // ✅ If receiver is in chat, mark as seen immediately
//   if (isReceiverInChatRoom && senderSocketId) {
//     io.to(senderSocketId).emit("messageSeen", {
//       chatId,
//       seenBy: otherUserId,
//       messageIds: [savedMessage._id],
//     });
//   }

//   res.status(201).json({
//     status: "Message sent successfully",
//     message: savedMessage,
//     sender: senderId,
//   });
// });
export const sendMessage = TryCatch(async (req, res) => {
  const senderId = req.user?._id.toString();
  const { chatId, text } = req.body;
  const imageFile = req.file;

  if (!senderId || !chatId) {
    return res.status(400).json({ message: "SenderId and ChatId required" });
  }

  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ message: "Chat not found" });

  const messageData: any = {
    chatId,
    sender: senderId,
    text: text || "",
    messageType: imageFile ? "image" : "text",
  };

  if (imageFile) {
    messageData.image = {
      url: imageFile.path,
      public_id: imageFile.filename,
    };
  }

  const savedMessage = await new Messages(messageData).save();

  console.log("💬 New message created:", savedMessage.text);

  // Emit to the chat room so everyone joined gets it
  io.to(chatId).emit("newMessage", savedMessage);

  // Emit to receiver if directly connected
  const receiverId = chat.users.find((u) => u.toString() !== senderId);
  const receiverSocketId = getReceiverSocketId(receiverId?.toString() || "");
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("newMessage", savedMessage);
  }

  // Also emit to sender (so they get their own message instantly)
  const senderSocketId = getReceiverSocketId(senderId);
  if (senderSocketId) {
    io.to(senderSocketId).emit("newMessage", savedMessage);
  }
  if (receiverSocketId) {
    const receiverSocket = io.sockets.sockets.get(receiverSocketId);
    const isReceiverInChatRoom = receiverSocket?.rooms.has(chatId);

    // If receiver is in chat, mark message as seen
    if (isReceiverInChatRoom) {
      savedMessage.seen = true;
      savedMessage.seenAt = new Date();
      await savedMessage.save();

      // Notify sender about seen
      io.to(senderSocketId).emit("messagesSeen", {
        chatId,
        seenBy: receiverId,
        messageIds: [savedMessage._id],
      });
    }
  }

  res.status(201).json({ message: savedMessage });
});

// export const getMessagesByChat = TryCatch(
//   async (req: AuthenticatedRequest, res) => {
//     const userId = req.user?._id;
//     const { chatId } = req.params;
//     if (!userId) {
//       return res.status(400).json({ message: "User ID is required" });
//     }
//     if (!chatId) {
//       return res.status(400).json({ message: "Chat ID is required" });
//     }
//     const chat = await Chat.findById(chatId);
//     if (!chat) {
//       return res.status(404).json({ message: "Chat not found" });
//     }
//     const isUserInChat = chat.users.some(
//     (userId) => userId.toString() === userId.toString()
//   );

//   if (!isUserInChat) {
//     return res
//       .status(403)
//       .json({ message: "You are not a participant of this chat" });
//   }
//     const messagesToMarkSeen = await Messages.find({ chatId:chatId, sender: { $ne: userId }, seen: false });
//     // const messageIds = messagesToMarkSeen.map((msg) => msg._id);
//     await Messages.updateMany({
//       chatId: chatId,
//       sender: { $ne: userId },
//       seen: false,
//     },
//     { seen: true, seenAt: new Date() }
//     );
//     const messages = await Messages.find({ chatId }).sort({ createdAt: 1 });
//     const otherUserId = chat.users.find(
//       (id) => id.toString() !== userId.toString()
//     );

//     try {
//        const { data } = await axios.get(
//           `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`
//         );
//         if(!otherUserId){
//           res.status(400).json({
//             message: "No other User || You are not a participant of this chat",
//           })
//           return;
//         }
//         // socket work here
//         res.json({
//           messages,
//           otherUser: data.user || data, //my fix for undefined user issue
//           // otherUser: data,
//         })
//     } catch (error) {
//       console.log(error);
//       res.json({
//         messages,
//         user: {
//           _id: otherUserId, name: "Unknown User", email: "", avatar: ""
//         }
//       })
//     }

//   }
// );
// export const getMessagesByChat = TryCatch(
//   async (req: AuthenticatedRequest, res) => {
//     const userId = req.user?._id;
//     const { chatId } = req.params;

//     if (!userId) {
//       return res.status(400).json({ message: "User ID is required" });
//     }
//     if (!chatId) {
//       return res.status(400).json({ message: "Chat ID is required" });
//     }

//     const chat = await Chat.findById(chatId);
//     if (!chat) {
//       return res.status(404).json({ message: "Chat not found" });
//     }

//     // correct variable names to avoid shadowing
//     const isUserInChat = chat.users.some(
//       (uid) => uid.toString() === userId.toString()
//     );

//     if (!isUserInChat) {
//       return res
//         .status(403)
//         .json({ message: "You are not a participant of this chat" });
//     }

//     const otherUserId = chat.users.find(
//       (uid) => uid.toString() !== userId.toString()
//     );

//     if (!otherUserId) {
//       return res.status(400).json({
//         message: "No other User || You are not a participant of this chat",
//       });
//     }

//     // mark unseen messages as seen
//     await Messages.updateMany(
//       {
//         chatId: chatId,
//         sender: { $ne: userId },
//         seen: false,
//       },
//       { seen: true, seenAt: new Date() }
//     );

//     const messages = await Messages.find({ chatId }).sort({ createdAt: 1 });

//     try {
//       const { data } = await axios.get(
//         `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`
//       );
//       // return under 'user' to match frontend expectation
//       if(messagesToMarkSeen.length>0){
//         const OtherUserSocketId = getReceiverSocketId(otherUserId.toString())
//         if(otherUserSocketId){
//           io.to(otherUserSocketId).emit("messagesSeen",{
//               chatId:chatId,
//               seenBy:UserId,
//               messageIds:  messagesToMarkSeen.map((msg)=>msg._id)
//           })

//         }
//       }
//       res.json({
//         messages,
//         user: data.user || data,
//       });
//     } catch (error) {
//       console.error("Error fetching other user:", error);
//       res.json({
//         messages,
//         user: { _id: otherUserId, name: "Unknown User", email: "", avatar: "" },
//       });
//     }
//   }
// );
export const getMessagesByChat = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { chatId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!chatId) {
      return res.status(400).json({ message: "Chat ID is required" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const isUserInChat = chat.users.some(
      (uid) => uid.toString() === userId.toString()
    );

    if (!isUserInChat) {
      return res
        .status(403)
        .json({ message: "You are not a participant of this chat" });
    }

    const otherUserId = chat.users.find(
      (uid) => uid.toString() !== userId.toString()
    );

    if (!otherUserId) {
      return res.status(400).json({
        message:
          "No other user found || You are not a participant of this chat",
      });
    }

    // ✅ Find all unseen messages before marking
    const messagesToMarkSeen = await Messages.find({
      chatId,
      sender: { $ne: userId },
      seen: false,
    });

    // ✅ Mark unseen messages as seen
    if (messagesToMarkSeen.length > 0) {
      await Messages.updateMany(
        { _id: { $in: messagesToMarkSeen.map((msg) => msg._id) } },
        { seen: true, seenAt: new Date() }
      );
    }

    // ✅ Fetch all messages (after update)
    const messages = await Messages.find({ chatId }).sort({ createdAt: 1 });

    try {
      // ✅ Get other user details
      const { data } = await axios.get(
        `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`
      );

      // ✅ Notify receiver via socket (if online)
      if (messagesToMarkSeen.length > 0) {
        const otherUserSocketId = getReceiverSocketId(otherUserId.toString());
        if (otherUserSocketId) {
          io.to(otherUserSocketId).emit("messagesSeen", {
            chatId,
            seenBy: userId,
            messageIds: messagesToMarkSeen.map((msg) => msg._id),
          });
        }
      }

      // ✅ Send final response
      res.json({
        messages,
        user: data.user || data,
      });
    } catch (error) {
      console.error("Error fetching other user:", error);
      res.json({
        messages,
        user: { _id: otherUserId, name: "Unknown User", email: "", avatar: "" },
      });
    }
  }
);
