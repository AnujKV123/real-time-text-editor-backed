import http, { get } from "http"
import { Server } from "socket.io"
import { app } from "../app.js";

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN, // replace with your frontend's domain
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type'],
      credentials: true
    }
});


io.on("connection", (socket) => {
  

  console.log("A user connected:", socket.id);

  // Join room by userId to emit targeted events
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

});



export {server, io}