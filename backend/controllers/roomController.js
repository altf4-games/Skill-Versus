import Room from "../models/Room.js";
import User from "../models/User.js";
import Problem from "../models/Problem.js";
import { getRandomTypingText } from "../utils/typingTexts.js";

class RoomController {
  // Create a new duel room
  static async createRoom(req, res) {
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
      if (problemCount === 0) {
        return res.status(404).json({ error: "No problems available" });
      }

      const randomSkip = Math.floor(Math.random() * problemCount);
      const problem = await Problem.findOne({ isActive: true }).skip(
        randomSkip
      );

      // Generate unique room code
      let roomCode;
      let existingRoom;
      do {
        roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
        existingRoom = await Room.findOne({ roomCode });
      } while (existingRoom);

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

      res.status(201).json({
        room: {
          roomCode: room.roomCode,
          host: room.host,
          participants: room.participants,
          problem: room.problem,
          status: room.status,
          timeLimit: room.timeLimit,
        },
        message: "Room created successfully",
      });
    } catch (error) {
      console.error("Create room error:", error);
      res.status(500).json({
        error: "Failed to create room",
        message: error.message,
      });
    }
  }

  // Create a new typing duel room
  static async createTypingRoom(req, res) {
    try {
      const userId = req.auth.userId;
      const { timeLimit = 30, difficulty = null } = req.body;

      // Find user
      const user = await User.findOne({ clerkId: userId });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get random typing text
      const typingContent = getRandomTypingText(difficulty);

      // Generate unique room code
      let roomCode;
      let existingRoom;
      do {
        roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
        existingRoom = await Room.findOne({ roomCode });
      } while (existingRoom);

      const room = new Room({
        roomCode,
        host: user._id,
        duelType: "typing",
        typingContent: {
          text: typingContent.text,
          words: typingContent.words,
          totalWords: typingContent.totalWords,
        },
        timeLimit,
        maxParticipants: 2, // Typing duels are 1v1 only
        participants: [
          {
            userId: user._id,
            isReady: false,
            typingProgress: {
              currentWordIndex: 0,
              typedText: "",
              accuracy: 100,
              wpm: 0,
              correctChars: 0,
              totalChars: 0,
            },
          },
        ],
      });

      await room.save();
      await room.populate("participants.userId", "username profileImage");

      res.status(201).json({
        room: {
          roomCode: room.roomCode,
          host: room.host,
          participants: room.participants,
          duelType: room.duelType,
          typingContent: room.typingContent,
          status: room.status,
          timeLimit: room.timeLimit,
          maxParticipants: room.maxParticipants,
        },
        message: "Typing room created successfully",
      });
    } catch (error) {
      console.error("Create typing room error:", error);
      res.status(500).json({
        error: "Failed to create typing room",
        message: error.message,
      });
    }
  }

  // Get all active rooms
  static async getRooms(req, res) {
    try {
      const { status = "waiting" } = req.query;

      const rooms = await Room.find({ status })
        .populate("host", "username profileImage")
        .populate("participants.userId", "username profileImage")
        .populate("problem", "title difficulty")
        .sort({ createdAt: -1 })
        .limit(20);

      res.json({ rooms });
    } catch (error) {
      console.error("Get rooms error:", error);
      res.status(500).json({
        error: "Failed to get rooms",
        message: error.message,
      });
    }
  }

  // Get specific room
  static async getRoom(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.auth?.userId;

      const room = await Room.findOne({ roomCode: roomId })
        .populate("host", "username profileImage")
        .populate("participants.userId", "username profileImage")
        .populate("problem");

      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Check if user is a participant
      if (userId) {
        const user = await User.findOne({ clerkId: userId });
        const isParticipant = room.participants.some(
          (p) => p.userId._id.toString() === user?._id.toString()
        );
        const isHost = room.host._id.toString() === user?._id.toString();

        if (!isParticipant && !isHost) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      res.json({ room });
    } catch (error) {
      console.error("Get room error:", error);
      res.status(500).json({
        error: "Failed to get room",
        message: error.message,
      });
    }
  }

  // Join room
  static async joinRoom(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.auth.userId;

      const user = await User.findOne({ clerkId: userId });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const room = await Room.findOne({ roomCode: roomId });
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Check if room is full
      if (room.participants.length >= room.maxParticipants) {
        const isAlreadyInRoom = room.participants.some(
          (p) => p.userId.toString() === user._id.toString()
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
        (p) => p.userId.toString() === user._id.toString()
      );

      if (!isAlreadyInRoom) {
        room.participants.push({
          userId: user._id,
          isReady: false,
        });
        await room.save();
      }

      await room.populate("participants.userId", "username profileImage");
      await room.populate("problem");

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
        message: "Joined room successfully",
      });
    } catch (error) {
      console.error("Join room error:", error);
      res.status(500).json({
        error: "Failed to join room",
        message: error.message,
      });
    }
  }

  // Leave room
  static async leaveRoom(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.auth.userId;

      const user = await User.findOne({ clerkId: userId });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const room = await Room.findOne({ roomCode: roomId });
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Remove user from room if waiting
      if (room.status === "waiting") {
        room.participants = room.participants.filter(
          (p) => p.userId.toString() !== user._id.toString()
        );
        await room.save();
      }

      res.json({ message: "Left room successfully" });
    } catch (error) {
      console.error("Leave room error:", error);
      res.status(500).json({
        error: "Failed to leave room",
        message: error.message,
      });
    }
  }

  // Toggle ready status
  static async toggleReady(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.auth.userId;

      const user = await User.findOne({ clerkId: userId });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const room = await Room.findOne({ roomCode: roomId });
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Find participant
      const participant = room.participants.find(
        (p) => p.userId.toString() === user._id.toString()
      );

      if (!participant) {
        return res.status(400).json({ error: "Not in room" });
      }

      // Toggle ready status
      participant.isReady = !participant.isReady;
      await room.save();

      res.json({
        isReady: participant.isReady,
        message: `Ready status: ${participant.isReady}`,
      });
    } catch (error) {
      console.error("Toggle ready error:", error);
      res.status(500).json({
        error: "Failed to toggle ready status",
        message: error.message,
      });
    }
  }

  // Start room
  static async startRoom(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.auth.userId;

      const user = await User.findOne({ clerkId: userId });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const room = await Room.findOne({ roomCode: roomId });
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Check if user is host
      if (room.host.toString() !== user._id.toString()) {
        return res.status(403).json({ error: "Only host can start room" });
      }

      // Check conditions
      if (room.participants.length < 2) {
        return res.status(400).json({ error: "Need at least 2 participants" });
      }

      // Start room
      room.status = "active";
      room.startTime = new Date();
      room.endTime = new Date(Date.now() + room.timeLimit * 60 * 1000);
      await room.save();

      res.json({
        room: {
          roomCode: room.roomCode,
          status: room.status,
          startTime: room.startTime,
          endTime: room.endTime,
        },
        message: "Room started successfully",
      });
    } catch (error) {
      console.error("Start room error:", error);
      res.status(500).json({
        error: "Failed to start room",
        message: error.message,
      });
    }
  }

  // Add chat message
  static async addChatMessage(req, res) {
    try {
      const { roomId } = req.params;
      const { message } = req.body;
      const userId = req.auth.userId;

      if (!message || !message.trim()) {
        return res.status(400).json({ error: "Message cannot be empty" });
      }

      const user = await User.findOne({ clerkId: userId });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const room = await Room.findOne({ roomCode: roomId });
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Check if user is in room
      const isInRoom = room.participants.some(
        (p) => p.userId.toString() === user._id.toString()
      );

      if (!isInRoom) {
        return res
          .status(403)
          .json({ error: "Must be in room to send messages" });
      }

      // Add message
      const chatMessage = {
        userId: user._id,
        username: user.username,
        message: message.trim(),
        timestamp: new Date(),
      };

      room.chatMessages.push(chatMessage);
      await room.save();

      res.json({
        message: chatMessage,
      });
    } catch (error) {
      console.error("Add chat message error:", error);
      res.status(500).json({
        error: "Failed to send message",
        message: error.message,
      });
    }
  }

  // Update room (not used for duels, but keeping for compatibility)
  static async updateRoom(req, res) {
    res.status(501).json({ error: "Not implemented for duel rooms" });
  }

  // Delete room (not used for duels, but keeping for compatibility)
  static async deleteRoom(req, res) {
    res.status(501).json({ error: "Not implemented for duel rooms" });
  }
}

export default RoomController;
