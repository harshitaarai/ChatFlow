import express from "express";
import Room from "../models/Room.js";

const router = express.Router();

// Get all rooms
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 });

    res.json(rooms);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch rooms",
    });
  }
});

// Create a room
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Room name is required",
      });
    }

    const existingRoom = await Room.findOne({
      name: name.trim(),
    });

    if (existingRoom) {
      return res.status(400).json({
        message: "Room already exists",
      });
    }

    const room = await Room.create({
      name: name.trim(),
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create room",
    });
  }
});

export default router;