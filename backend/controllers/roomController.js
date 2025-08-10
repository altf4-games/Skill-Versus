import Room from "../models/Room.js";
import User from "../models/User.js";
import { clerkClient } from "@clerk/express";

class RoomController {
  // Create a new room
  static async createRoom(req, res) {
    try {
      const {
        name,
        description,
        maxParticipants = 2,
        gameMode = "duel",
        difficulty = "medium",
        timeLimit = 30,
        language = "any",
        settings = {},
      } = req.body;

      // Get user from Clerk
      const clerkUser = req.auth?.userId;
      if (!clerkUser) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Find user in database
      const user = await User.findOne({ clerkId: clerkUser });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user already has an active room
      const existingRoom = await Room.findOne({
        host: user._id,
        status: { $in: ["waiting", "starting", "active"] },
      });

      if (existingRoom) {
        return res.status(400).json({
          error: "You already have an active room",
          roomId: existingRoom.roomId,
        });
      }

      // Create new room
      const room = new Room({
        name,
        description,
        host: user._id,
        maxParticipants,
        gameMode,
        difficulty,
        timeLimit,
        language,
        settings,
        participants: [
          {
            user: user._id,
            joinedAt: new Date(),
            isReady: false,
          },
        ],
      });

      await room.save();
      await room.populate(
        "host participants.user",
        "username firstName lastName profileImage"
      );

      res.status(201).json({
        success: true,
        message: "Room created successfully",
        room,
      });
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({
        error: "Failed to create room",
        message: error.message,
      });
    }
  }

  // Get all rooms (with filters)
  static async getRooms(req, res) {
    try {
      const {
        status = "waiting",
        gameMode,
        difficulty,
        language,
        page = 1,
        limit = 10,
      } = req.query;

      const filters = { status };

      if (gameMode) filters.gameMode = gameMode;
      if (difficulty) filters.difficulty = difficulty;
      if (language && language !== "any") filters.language = language;

      // Only show public rooms or rooms user is in
      const clerkUser = req.auth?.userId;
      let user = null;
      if (clerkUser) {
        user = await User.findOne({ clerkId: clerkUser });
      }

      if (!user) {
        filters["settings.isPrivate"] = false;
      } else {
        filters.$or = [
          { "settings.isPrivate": false },
          { host: user._id },
          { "participants.user": user._id },
        ];
      }

      const skip = (page - 1) * limit;

      const rooms = await Room.find(filters)
        .populate(
          "host participants.user",
          "username firstName lastName profileImage"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Room.countDocuments(filters);

      res.json({
        success: true,
        rooms,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: rooms.length,
          totalRooms: total,
        },
      });
    } catch (error) {
      console.error("Error getting rooms:", error);
      res.status(500).json({
        error: "Failed to get rooms",
        message: error.message,
      });
    }
  }

  // Get room by ID
  static async getRoom(req, res) {
    try {
      const { roomId } = req.params;

      const room = await Room.findOne({ roomId })
        .populate(
          "host participants.user winner",
          "username firstName lastName profileImage"
        )
        .populate(
          "submissions.user results.user",
          "username firstName lastName profileImage"
        );

      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      res.json({
        success: true,
        room,
      });
    } catch (error) {
      console.error("Error getting room:", error);
      res.status(500).json({
        error: "Failed to get room",
        message: error.message,
      });
    }
  }

  // Join a room
  static async joinRoom(req, res) {
    try {
      const { roomId } = req.params;
      const { password } = req.body;

      // Get user from Clerk
      const clerkUser = req.auth?.userId;
      if (!clerkUser) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await User.findOne({ clerkId: clerkUser });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const room = await Room.findOne({ roomId });
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Check if room is full
      if (room.isFull) {
        return res.status(400).json({ error: "Room is full" });
      }

      // Check if room is private and password is required
      if (room.settings.isPrivate && room.settings.password !== password) {
        return res.status(403).json({ error: "Invalid password" });
      }

      // Check if user is already in room
      const isAlreadyInRoom = room.participants.some(
        (p) => p.user.toString() === user._id.toString()
      );

      if (isAlreadyInRoom) {
        return res.status(400).json({ error: "You are already in this room" });
      }

      // Check if user is in another active room
      const activeRoom = await Room.findOne({
        "participants.user": user._id,
        status: { $in: ["waiting", "starting", "active"] },
        _id: { $ne: room._id },
      });

      if (activeRoom) {
        return res.status(400).json({
          error: "You are already in another active room",
          activeRoomId: activeRoom.roomId,
        });
      }

      // Add user to room
      room.participants.push({
        user: user._id,
        joinedAt: new Date(),
        isReady: false,
      });

      await room.save();
      await room.populate(
        "host participants.user",
        "username firstName lastName profileImage"
      );

      res.json({
        success: true,
        message: "Joined room successfully",
        room,
      });
    } catch (error) {
      console.error("Error joining room:", error);
      res.status(500).json({
        error: "Failed to join room",
        message: error.message,
      });
    }
  }

  // Leave a room
  static async leaveRoom(req, res) {
    try {
      const { roomId } = req.params;

      const clerkUser = req.auth?.userId;
      if (!clerkUser) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await User.findOne({ clerkId: clerkUser });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const room = await Room.findOne({ roomId });
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Check if user is in room
      const participantIndex = room.participants.findIndex(
        (p) => p.user.toString() === user._id.toString()
      );

      if (participantIndex === -1) {
        return res.status(400).json({ error: "You are not in this room" });
      }

      // If user is host and there are other participants, transfer host
      if (
        room.host.toString() === user._id.toString() &&
        room.participants.length > 1
      ) {
        const newHost = room.participants.find(
          (p) => p.user.toString() !== user._id.toString()
        );
        room.host = newHost.user;
      }

      // Remove user from participants
      room.participants.splice(participantIndex, 1);

      // If no participants left, cancel the room
      if (room.participants.length === 0) {
        room.status = "cancelled";
      }

      await room.save();

      res.json({
        success: true,
        message: "Left room successfully",
      });
    } catch (error) {
      console.error("Error leaving room:", error);
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

      const clerkUser = req.auth?.userId;
      if (!clerkUser) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await User.findOne({ clerkId: clerkUser });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const room = await Room.findOne({ roomId });
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Find participant
      const participant = room.participants.find(
        (p) => p.user.toString() === user._id.toString()
      );

      if (!participant) {
        return res.status(400).json({ error: "You are not in this room" });
      }

      // Toggle ready status
      participant.isReady = !participant.isReady;

      // Check if all participants are ready and auto-start is enabled
      if (
        room.allReady &&
        room.settings.autoStart &&
        room.status === "waiting"
      ) {
        room.status = "starting";
        room.startTime = new Date();
      }

      await room.save();
      await room.populate(
        "host participants.user",
        "username firstName lastName profileImage"
      );

      res.json({
        success: true,
        message: `Ready status ${participant.isReady ? "enabled" : "disabled"}`,
        room,
      });
    } catch (error) {
      console.error("Error toggling ready:", error);
      res.status(500).json({
        error: "Failed to toggle ready status",
        message: error.message,
      });
    }
  }

  // Start room (host only)
  static async startRoom(req, res) {
    try {
      const { roomId } = req.params;

      const clerkUser = req.auth?.userId;
      if (!clerkUser) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await User.findOne({ clerkId: clerkUser });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const room = await Room.findOne({ roomId });
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Check if user is host
      if (room.host.toString() !== user._id.toString()) {
        return res.status(403).json({ error: "Only host can start the room" });
      }

      // Check if room has minimum participants
      if (room.participants.length < 2) {
        return res
          .status(400)
          .json({ error: "Need at least 2 participants to start" });
      }

      // Start the room
      room.status = "active";
      room.startTime = new Date();

      await room.save();
      await room.populate(
        "host participants.user",
        "username firstName lastName profileImage"
      );

      res.json({
        success: true,
        message: "Room started successfully",
        room,
      });
    } catch (error) {
      console.error("Error starting room:", error);
      res.status(500).json({
        error: "Failed to start room",
        message: error.message,
      });
    }
  }

  // Update room settings (host only)
  static async updateRoom(req, res) {
    try {
      const { roomId } = req.params;
      const updates = req.body;

      const clerkUser = req.auth?.userId;
      if (!clerkUser) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await User.findOne({ clerkId: clerkUser });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const room = await Room.findOne({ roomId });
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Check if user is host
      if (room.host.toString() !== user._id.toString()) {
        return res
          .status(403)
          .json({ error: "Only host can update room settings" });
      }

      // Only allow updates if room is waiting
      if (room.status !== "waiting") {
        return res
          .status(400)
          .json({ error: "Cannot update room after it has started" });
      }

      // Update allowed fields
      const allowedUpdates = [
        "name",
        "description",
        "maxParticipants",
        "difficulty",
        "timeLimit",
        "language",
        "settings",
      ];

      allowedUpdates.forEach((field) => {
        if (updates[field] !== undefined) {
          room[field] = updates[field];
        }
      });

      await room.save();
      await room.populate(
        "host participants.user",
        "username firstName lastName profileImage"
      );

      res.json({
        success: true,
        message: "Room updated successfully",
        room,
      });
    } catch (error) {
      console.error("Error updating room:", error);
      res.status(500).json({
        error: "Failed to update room",
        message: error.message,
      });
    }
  }

  // Delete room (host only)
  static async deleteRoom(req, res) {
    try {
      const { roomId } = req.params;

      const clerkUser = req.auth?.userId;
      if (!clerkUser) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await User.findOne({ clerkId: clerkUser });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const room = await Room.findOne({ roomId });
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Check if user is host
      if (room.host.toString() !== user._id.toString()) {
        return res.status(403).json({ error: "Only host can delete the room" });
      }

      await Room.deleteOne({ roomId });

      res.json({
        success: true,
        message: "Room deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting room:", error);
      res.status(500).json({
        error: "Failed to delete room",
        message: error.message,
      });
    }
  }

  // Add chat message
  static async addChatMessage(req, res) {
    try {
      const { roomId } = req.params;
      const { message } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: "Message cannot be empty" });
      }

      const clerkUser = req.auth?.userId;
      if (!clerkUser) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await User.findOne({ clerkId: clerkUser });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const room = await Room.findOne({ roomId });
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Check if user is in room
      const isInRoom = room.participants.some(
        (p) => p.user.toString() === user._id.toString()
      );

      if (!isInRoom) {
        return res
          .status(403)
          .json({ error: "You must be in the room to send messages" });
      }

      // Add message
      room.chat.push({
        user: user._id,
        message: message.trim(),
        timestamp: new Date(),
      });

      await room.save();

      // Return the new message with user details
      const newMessage = room.chat[room.chat.length - 1];
      await room.populate(
        "chat.user",
        "username firstName lastName profileImage"
      );

      res.json({
        success: true,
        message: "Message sent successfully",
        chatMessage: newMessage,
      });
    } catch (error) {
      console.error("Error adding chat message:", error);
      res.status(500).json({
        error: "Failed to send message",
        message: error.message,
      });
    }
  }
}

export default RoomController;
