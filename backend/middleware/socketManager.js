import { Server } from "socket.io";
import Room from "../models/Room.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

class SocketManager {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
      },
    });

    this.rooms = new Map(); // Track socket rooms
    this.userSockets = new Map(); // Map user IDs to socket IDs

    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      // Join room
      socket.on("join-room", async (data) => {
        try {
          const { roomId, userId } = data;

          // Verify user and room exist
          const room = await Room.findOne({ roomId }).populate(
            "participants.user"
          );
          if (!room) {
            socket.emit("error", { message: "Room not found" });
            return;
          }

          const user = await User.findById(userId);
          if (!user) {
            socket.emit("error", { message: "User not found" });
            return;
          }

          // Check if user is in room
          const isInRoom = room.participants.some(
            (p) => p.user._id.toString() === userId
          );
          if (!isInRoom) {
            socket.emit("error", { message: "User not in room" });
            return;
          }

          // Join socket room
          socket.join(roomId);
          this.userSockets.set(userId, socket.id);

          // Track room data
          if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
          }
          this.rooms.get(roomId).add(socket.id);

          // Notify others in room
          socket.to(roomId).emit("user-joined", {
            user: {
              id: user._id,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImage: user.profileImage,
            },
          });

          // Send current room state
          socket.emit("room-state", { room });

          console.log(`User ${user.username} joined room ${roomId}`);
        } catch (error) {
          console.error("Error joining room:", error);
          socket.emit("error", { message: "Failed to join room" });
        }
      });

      // Leave room
      socket.on("leave-room", async (data) => {
        try {
          const { roomId, userId } = data;

          socket.leave(roomId);

          // Remove from tracking
          if (this.rooms.has(roomId)) {
            this.rooms.get(roomId).delete(socket.id);
            if (this.rooms.get(roomId).size === 0) {
              this.rooms.delete(roomId);
            }
          }
          this.userSockets.delete(userId);

          // Notify others
          socket.to(roomId).emit("user-left", { userId });

          console.log(`User left room ${roomId}`);
        } catch (error) {
          console.error("Error leaving room:", error);
        }
      });

      // Ready status change
      socket.on("ready-status", async (data) => {
        try {
          const { roomId, userId, isReady } = data;

          // Update room in database
          const room = await Room.findOne({ roomId });
          if (room) {
            const participant = room.participants.find(
              (p) => p.user.toString() === userId
            );
            if (participant) {
              participant.isReady = isReady;
              await room.save();

              // Broadcast to room
              this.io.to(roomId).emit("ready-status-changed", {
                userId,
                isReady,
                allReady: room.allReady,
              });
            }
          }
        } catch (error) {
          console.error("Error updating ready status:", error);
        }
      });

      // Chat message
      socket.on("chat-message", async (data) => {
        try {
          const { roomId, userId, message } = data;

          const user = await User.findById(userId);
          const room = await Room.findOne({ roomId });

          if (!user || !room) {
            socket.emit("error", { message: "Invalid user or room" });
            return;
          }

          // Check if user is in room
          const isInRoom = room.participants.some(
            (p) => p.user.toString() === userId
          );
          if (!isInRoom) {
            socket.emit("error", { message: "User not in room" });
            return;
          }

          // Add message to room
          const chatMessage = {
            user: userId,
            message: message.trim(),
            timestamp: new Date(),
          };

          room.chat.push(chatMessage);
          await room.save();

          // Broadcast message to room
          this.io.to(roomId).emit("new-chat-message", {
            id: room.chat[room.chat.length - 1]._id,
            user: {
              id: user._id,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImage: user.profileImage,
            },
            message: message.trim(),
            timestamp: new Date(),
          });
        } catch (error) {
          console.error("Error sending chat message:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      });

      // Code submission
      socket.on("code-submission", async (data) => {
        try {
          const { roomId, userId, code, language, submissionResult } = data;

          // Broadcast submission to room
          socket.to(roomId).emit("user-submitted", {
            userId,
            language,
            submissionTime: new Date(),
            result: submissionResult,
          });
        } catch (error) {
          console.error("Error handling code submission:", error);
        }
      });

      // Room settings update
      socket.on("room-settings-update", async (data) => {
        try {
          const { roomId } = data;

          const room = await Room.findOne({ roomId }).populate(
            "host participants.user"
          );
          if (room) {
            // Broadcast updated room state
            this.io.to(roomId).emit("room-updated", { room });
          }
        } catch (error) {
          console.error("Error updating room settings:", error);
        }
      });

      // Room start
      socket.on("room-start", async (data) => {
        try {
          const { roomId } = data;

          const room = await Room.findOne({ roomId });
          if (room && room.status === "active") {
            // Broadcast room start to all participants
            this.io.to(roomId).emit("room-started", {
              startTime: room.startTime,
              timeLimit: room.timeLimit,
            });
          }
        } catch (error) {
          console.error("Error starting room:", error);
        }
      });

      // Disconnect
      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);

        // Clean up tracking
        for (const [userId, socketId] of this.userSockets.entries()) {
          if (socketId === socket.id) {
            this.userSockets.delete(userId);
            break;
          }
        }

        for (const [roomId, sockets] of this.rooms.entries()) {
          if (sockets.has(socket.id)) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
              this.rooms.delete(roomId);
            }
            // Notify room about disconnection
            socket
              .to(roomId)
              .emit("user-disconnected", { socketId: socket.id });
            break;
          }
        }
      });
    });
  }

  // Helper method to send message to specific room
  sendToRoom(roomId, event, data) {
    this.io.to(roomId).emit(event, data);
  }

  // Helper method to send message to specific user
  sendToUser(userId, event, data) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  // Get connected users in room
  getRoomUsers(roomId) {
    const roomSockets = this.rooms.get(roomId);
    return roomSockets ? Array.from(roomSockets) : [];
  }
}

export default SocketManager;
