import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";

import authRoutes from "./routes/auth.js";
import roomRoutes from "./routes/rooms.js";
import messageRoutes from "./routes/messages.js";

import Message from "./models/Message.js";
import User from "./models/User.js";
import Room from "./models/Room.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const PORT = 5001;

// Track active Socket.IO connections per username
const activeUsers = new Map();

app.use(cors());
app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected successfully");

    const defaultRooms = [
      "general",
      "random",
      "development",
      "gaming",
    ];

    for (const name of defaultRooms) {
      const exists = await Room.findOne({ name });

      if (!exists) {
        await Room.create({ name });
        console.log(`Created room: ${name}`);
      }
    }

    console.log("Rooms are ready");
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error.message
    );
  });

app.get("/", (req, res) => {
  res.send("ChatFlow server is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  const username = socket.handshake.auth.username;

  if (username) {
    const currentConnections =
      activeUsers.get(username) || 0;

    activeUsers.set(
      username,
      currentConnections + 1
    );

    if (currentConnections === 0) {
      User.findOneAndUpdate(
        { username },
        { status: "online" }
      )
        .then(() => {
          console.log(`${username} is online`);

          io.emit("user_status_changed", {
            username,
            status: "online",
          });
        })
        .catch((error) => {
          console.error(
            "Failed to update user status:",
            error.message
          );
        });
    }
  }

  // Join a ChatFlow room
  socket.on("join_room", (roomName) => {
    if (!roomName) return;

    // Leave previous ChatFlow rooms
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.leave(room);
      }
    }

    socket.join(roomName);

    console.log(
      `${username} joined room: ${roomName}`
    );
  });

  // Send a message
  socket.on("send_message", async (messageData) => {
    try {
      console.log("Message received:", messageData);

      if (
        !messageData.room ||
        !messageData.text ||
        !messageData.sender
      ) {
        console.error("Invalid message data");
        return;
      }

      const message = await Message.create({
        room: messageData.room,
        sender: messageData.sender,
        text: messageData.text,
      });

      const savedMessage = {
        id: message._id,
        room: message.room,
        sender: message.sender,
        text: message.text,
        time: message.createdAt,
      };

      console.log(
        "Message saved to MongoDB:",
        message._id.toString()
      );

      io.to(message.room).emit(
        "receive_message",
        savedMessage
      );
    } catch (error) {
      console.error(
        "Message save failed:",
        error.message
      );
    }
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);

    if (!username) return;

    try {
      const currentConnections =
        activeUsers.get(username) || 1;

      if (currentConnections > 1) {
        activeUsers.set(
          username,
          currentConnections - 1
        );

        return;
      }

      activeUsers.delete(username);

      await User.findOneAndUpdate(
        { username },
        { status: "offline" }
      );

      console.log(`${username} is offline`);

      io.emit("user_status_changed", {
        username,
        status: "offline",
      });
    } catch (error) {
      console.error(
        "Failed to update user status:",
        error.message
      );
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});