import express from "express";
import { requireAuth } from "@clerk/express";
import Room from "../models/Room.js";
import Problem from "../models/Problem.js";
import User from "../models/User.js";

const router = express.Router();

// Generate random room code
function generateRoomCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Create a new duel room
router.post("/create", requireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { timeLimit = 30 } = req.body;

    // Find user
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get a random problem
    const problemCount = await Problem.countDocuments({ isActive: true });
    const randomSkip = Math.floor(Math.random() * problemCount);
    const problem = await Problem.findOne({ isActive: true }).skip(randomSkip);

    if (!problem) {
      return res.status(404).json({ error: "No problems available" });
    }

    // Generate unique room code
    let roomCode;
    let existingRoom;
    do {
      roomCode = generateRoomCode();
      existingRoom = await Room.findOne({ roomCode });
    } while (existingRoom);

    // Create room
    const room = new Room({
      roomCode,
      host: user._id,
      problem: problem._id,
      timeLimit,
      participants: [
        {
          userId: user._id,
          isReady: false,
        },
      ],
    });

    await room.save();
    await room.populate("problem");
    await room.populate("participants.userId", "username profileImage");

    res.json({
      room: {
        roomCode: room.roomCode,
        host: room.host,
        participants: room.participants,
        problem: room.problem,
        status: room.status,
        timeLimit: room.timeLimit,
      },
    });
  } catch (error) {
    console.error("Create room error:", error);
    res.status(500).json({ error: "Failed to create room" });
  }
});

// Join existing room
router.post("/join", requireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { roomCode } = req.body;

    if (!roomCode) {
      return res.status(400).json({ error: "Room code is required" });
    }

    // Find user
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find room
    const room = await Room.findOne({ roomCode })
      .populate("problem")
      .populate("participants.userId", "username profileImage");

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Check if room is full
    if (room.participants.length >= room.maxParticipants) {
      // Check if user is already in room
      const existingParticipant = room.participants.find(
        (p) => p.userId._id.toString() === user._id.toString()
      );

      if (!existingParticipant) {
        return res.status(400).json({ error: "Room is full" });
      }
    }

    // Check if room already started
    if (room.status !== "waiting") {
      return res.status(400).json({ error: "Room already started" });
    }

    // Add user if not already in room
    const existingParticipant = room.participants.find(
      (p) => p.userId._id.toString() === user._id.toString()
    );

    if (!existingParticipant) {
      room.participants.push({
        userId: user._id,
        isReady: false,
      });
      await room.save();
      await room.populate("participants.userId", "username profileImage");
    }

    res.json({
      room: {
        roomCode: room.roomCode,
        host: room.host,
        participants: room.participants,
        problem: room.problem,
        status: room.status,
        timeLimit: room.timeLimit,
        chatMessages: room.chatMessages,
      },
    });
  } catch (error) {
    console.error("Join room error:", error);
    res.status(500).json({ error: "Failed to join room" });
  }
});

// Join room with room code as URL parameter
router.post("/join/:roomCode", requireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { roomCode } = req.params;

    if (!roomCode) {
      return res.status(400).json({ error: "Room code is required" });
    }

    // Find user
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find room
    const room = await Room.findOne({ roomCode })
      .populate("problem")
      .populate("participants.userId", "username profileImage");

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Check if room is full (max 2 participants for duel)
    if (room.participants.length >= 2) {
      const isAlreadyInRoom = room.participants.some(
        (p) => p.userId._id.toString() === user._id.toString()
      );
      if (!isAlreadyInRoom) {
        return res.status(400).json({ error: "Room is full" });
      }
    }

    // Check if room already started
    if (room.status !== "waiting") {
      return res.status(400).json({ error: "Room already started" });
    }

    // Check if user already in room
    const isAlreadyInRoom = room.participants.some(
      (p) => p.userId._id.toString() === user._id.toString()
    );

    if (!isAlreadyInRoom) {
      room.participants.push({
        userId: user._id,
        isReady: false,
      });
      await room.save();
      await room.populate("participants.userId", "username profileImage");
    }

    res.json({
      room: {
        roomCode: room.roomCode,
        host: room.host,
        participants: room.participants,
        problem: room.problem,
        status: room.status,
        timeLimit: room.timeLimit,
        chatMessages: room.chatMessages,
      },
    });
  } catch (error) {
    console.error("Join room error:", error);
    res.status(500).json({ error: "Failed to join room" });
  }
});

// Get room details
router.get("/:roomCode", requireAuth(), async (req, res) => {
  try {
    const { roomCode } = req.params;
    const userId = req.auth.userId;

    // Find user
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find room
    const room = await Room.findOne({ roomCode })
      .populate("problem")
      .populate("participants.userId", "username profileImage");

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Check if user is in room
    const isParticipant = room.participants.some(
      (p) => p.userId._id.toString() === user._id.toString()
    );

    if (!isParticipant) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this room" });
    }

    res.json({
      room: {
        roomCode: room.roomCode,
        host: room.host,
        participants: room.participants,
        problem: room.problem,
        status: room.status,
        timeLimit: room.timeLimit,
        startTime: room.startTime,
        endTime: room.endTime,
        winner: room.winner,
        chatMessages: room.chatMessages,
      },
    });
  } catch (error) {
    console.error("Get room error:", error);
    res.status(500).json({ error: "Failed to get room details" });
  }
});

// Get all problems
router.get("/problems/list", requireAuth(), async (req, res) => {
  try {
    const problems = await Problem.find({ isActive: true })
      .select("title difficulty description examples constraints")
      .sort({ difficulty: 1 });

    res.json({ problems });
  } catch (error) {
    console.error("Get problems error:", error);
    res.status(500).json({ error: "Failed to get problems" });
  }
});

export default router;
