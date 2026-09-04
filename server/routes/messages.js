import express from "express";
import Message from "../models/Message.js";

const router = express.Router();

router.get("/:room", async (req, res) => {
  try {
    const messages = await Message.find({
      room: req.params.room,
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Failed to fetch messages:", error.message);

    res.status(500).json({
      message: "Failed to fetch messages",
    });
  }
});

export default router;