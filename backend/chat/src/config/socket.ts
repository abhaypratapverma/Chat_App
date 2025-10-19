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

io.on("connection", (socket: Socket) => {
  console.log("User Connected", socket.id);

  socket.on("disconnect", () => {
    console.log("User Disconnect", socket.id);
  });

  socket.on("connect_error", (error) => {
    console.log("Socket Connection Error", error);
  });
});

export { app, server, io };
