// import { Server, Socket } from "socket.io";
// import http from "http";
// import express from "express";

// const app = express();

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

// const userSocketMap: Record<string, string> = {};

// io.on("connection", (socket: Socket) => {
//   console.log("User Connected", socket.id);

//   const userId = socket.handshake.query.userId as string | undefined;

//   if (userId && userId !== "undefined") {
//     userSocketMap[userId] = socket.id;
//     console.log(`User ${userId} mapped to Socket ${socket.id}`);
//   }

//   io.emit("getOnlineUser", Object.keys(userSocketMap));
//   if (userId) {
//     socket.join(userId);
//   }
//   socket.on("typing", (data) => {
//     console.log(`User ${data.userId} is typing in chat ${data.chatId}`);
//     socket.to(data.chatId).emit("userTyping", {
//       chatId: data.chatId,
//       userId: data.userId,
//     });
//   });

//   socket.on("stopTyping", (data) => {
//     console.log(`User ${data.userId} Stopped typing in chat ${data.chatId}`);
//     socket.to(data.chatId).emit("userStoppedTyping", {
//       chatId: data.chatId,
//       userId: data.userId,
//     });
//   });
//   socket.on("joinChat", (chatId) => {
//     socket.join(chatId);
//     console.log(`User ${data.userId} joined  chat room ${data.chatId}`);
//   });
//   socket.on("leaveChat", (chatId) => {
//     socket.leave(chatId);
//     console.log(`User ${data.userId} Left  chat room ${data.chatId}`);
//   });

//   socket.on("disconnect", () => {
//     console.log("User Disconnect", socket.id);
//     if (userId) {
//       delete userSocketMap[userId];
//       console.log(`User${userId} removed from onlineUser`);
//       io.emit("getOnlineUser", Object.keys(userSocketMap));
//     }
//   });

//   socket.on("connect_error", (error) => {
//     console.log("Socket Connection Error", error);
//   });
// });

// export { app, server, io };
// ...existing code...
import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const userSocketMap: Record<string, string> = {};

export const getReceiverSocketId = (receiverId: string): string | undefined => {
  return userSocketMap[receiverId];
};
io.on("connection", (socket: Socket) => {
  console.log("User Connected", socket.id);

  // support both query and auth (client may send either)
  const handshakeAny: any = socket.handshake;
  const userId =
    (handshakeAny.query && handshakeAny.query.userId) ||
    (handshakeAny.auth && handshakeAny.auth.userId);

  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} mapped to Socket ${socket.id}`);
  }

  io.emit("getOnlineUser", Object.keys(userSocketMap));
  if (userId) {
    socket.join(userId);
  }

  socket.on("typing", (data) => {
    // data expected to be { chatId, userId }
    socket.to(data.chatId).emit("userTyping", {
      chatId: data.chatId,
      userId: data.userId,
    });
  });

  socket.on("stopTyping", (data) => {
    socket.to(data.chatId).emit("userStoppedTyping", {
      chatId: data.chatId,
      userId: data.userId,
    });
  });

  // joinChat receives a chatId string from client
  socket.on("joinChat", (chatId: string) => {
    socket.join(chatId);
    console.log(`User ${userId || "unknown"} joined chat room ${chatId}`);
  });

  // leaveChat receives a chatId string from client
  socket.on("leaveChat", (chatId: string) => {
    socket.leave(chatId);
    console.log(`User ${userId || "unknown"} left chat room ${chatId}`);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnect", socket.id);
    if (userId) {
      delete userSocketMap[userId];
      console.log(`User ${userId} removed from onlineUser`);
      io.emit("getOnlineUser", Object.keys(userSocketMap));
    }
  });

  socket.on("connect_error", (error) => {
    console.log("Socket Connection Error", error);
  });
});

export { app, server, io };
// ...existing code...
