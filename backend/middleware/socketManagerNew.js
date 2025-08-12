import { Server } from "socket.io";
import User from "../models/User.js";
import Problem from "../models/Problem.js";

// In-memory storage for rooms (temporary solution)
const rooms = new Map();

function generateRoomCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

class SocketManager {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      // Authentication
      socket.on("authenticate", async (data) => {
        try {
          const { userId } = data;
          const user = await User.findOne({ clerkId: userId });

          if (user) {
            socket.userId = user._id.toString();
            socket.clerkId = userId;
            socket.username = user.username;
            console.log(`User authenticated: ${user.username}`);
            socket.emit("authenticated", {
              success: true,
              username: user.username,
              userId: user._id.toString(),
            });
          } else {
            socket.emit("error", { message: "User not found" });
          }
        } catch (error) {
          console.error("Authentication error:", error);
          socket.emit("error", { message: "Authentication failed" });
        }
      });

      // Create duel room
      socket.on("create-duel", async (data) => {
        try {
          if (!socket.userId) {
            socket.emit("error", { message: "Not authenticated" });
            return;
          }

          const { timeLimit = 30 } = data;

          // Get a random problem
          const problemCount = await Problem.countDocuments({ isActive: true });
          if (problemCount === 0) {
            socket.emit("error", { message: "No problems available" });
            return;
          }

          const randomSkip = Math.floor(Math.random() * problemCount);
          const problem = await Problem.findOne({ isActive: true }).skip(
            randomSkip
          );

          // Generate unique room code
          let roomCode;
          do {
            roomCode = generateRoomCode();
          } while (rooms.has(roomCode));

          // Create room in memory
          const room = {
            roomCode,
            host: socket.userId,
            hostUsername: socket.username,
            problem: {
              id: problem._id.toString(),
              title: problem.title,
              description: problem.description,
              examples: problem.examples,
              constraints: problem.constraints,
              difficulty: problem.difficulty,
              functionSignature: problem.functionSignature,
              testCases: problem.testCases,
            },
            timeLimit,
            status: "waiting", // waiting, active, finished
            participants: [
              {
                userId: socket.userId,
                username: socket.username,
                socketId: socket.id,
                isReady: false,
                code: problem.functionSignature?.javascript || "",
                hasSubmitted: false,
                submissionTime: null,
              },
            ],
            chatMessages: [],
            startTime: null,
            endTime: null,
            winner: null,
          };

          rooms.set(roomCode, room);
          socket.join(roomCode);

          console.log(`Room created: ${roomCode} by ${socket.username}`);
          socket.emit("duel-created", { room });
        } catch (error) {
          console.error("Create duel error:", error);
          socket.emit("error", { message: "Failed to create duel" });
        }
      });

      // Join duel room
      socket.on("join-duel", async (data) => {
        try {
          if (!socket.userId) {
            socket.emit("error", { message: "Not authenticated" });
            return;
          }

          const { roomCode } = data;
          const room = rooms.get(roomCode);

          if (!room) {
            socket.emit("error", { message: "Room not found" });
            return;
          }

          if (room.status !== "waiting") {
            socket.emit("error", { message: "Room already started" });
            return;
          }

          if (room.participants.length >= 2) {
            const existingParticipant = room.participants.find(
              (p) => p.userId === socket.userId
            );
            if (!existingParticipant) {
              socket.emit("error", { message: "Room is full" });
              return;
            }
          }

          // Check if user already in room
          const existingParticipant = room.participants.find(
            (p) => p.userId === socket.userId
          );
          if (!existingParticipant) {
            room.participants.push({
              userId: socket.userId,
              username: socket.username,
              socketId: socket.id,
              isReady: false,
              code: room.problem.functionSignature?.javascript || "",
              hasSubmitted: false,
              submissionTime: null,
            });
          } else {
            // Update socket ID for reconnection
            existingParticipant.socketId = socket.id;
          }

          socket.join(roomCode);
          console.log(`${socket.username} joined room: ${roomCode}`);

          // Notify all participants
          this.io.to(roomCode).emit("participant-joined", {
            room,
            joinedUser: {
              userId: socket.userId,
              username: socket.username,
            },
          });
        } catch (error) {
          console.error("Join duel error:", error);
          socket.emit("error", { message: "Failed to join duel" });
        }
      });

      // Toggle ready status
      socket.on("toggle-ready", (data) => {
        try {
          if (!socket.userId) {
            socket.emit("error", { message: "Not authenticated" });
            return;
          }

          const { roomCode } = data;
          const room = rooms.get(roomCode);

          if (!room) {
            socket.emit("error", { message: "Room not found" });
            return;
          }

          const participant = room.participants.find(
            (p) => p.userId === socket.userId
          );
          if (!participant) {
            socket.emit("error", { message: "Not in room" });
            return;
          }

          participant.isReady = !participant.isReady;

          console.log(
            `${socket.username} ready status: ${participant.isReady} in room: ${roomCode}`
          );

          // Notify all participants
          this.io.to(roomCode).emit("user-ready-changed", {
            room,
            userId: socket.userId,
            isReady: participant.isReady,
          });
        } catch (error) {
          console.error("Toggle ready error:", error);
          socket.emit("error", { message: "Failed to toggle ready status" });
        }
      });

      // Start duel
      socket.on("start-duel", (data) => {
        try {
          if (!socket.userId) {
            socket.emit("error", { message: "Not authenticated" });
            return;
          }

          const { roomCode } = data;
          const room = rooms.get(roomCode);

          if (!room) {
            socket.emit("error", { message: "Room not found" });
            return;
          }

          if (room.host !== socket.userId) {
            socket.emit("error", { message: "Only host can start duel" });
            return;
          }

          if (room.participants.length < 2) {
            socket.emit("error", { message: "Need at least 2 participants" });
            return;
          }

          const allReady = room.participants.every((p) => p.isReady);
          if (!allReady) {
            socket.emit("error", { message: "All participants must be ready" });
            return;
          }

          // Start the duel
          room.status = "active";
          room.startTime = new Date();
          room.endTime = new Date(Date.now() + room.timeLimit * 60 * 1000);

          console.log(`Duel started in room: ${roomCode}`);

          // Notify all participants
          this.io.to(roomCode).emit("duel-started", {
            room,
            startTime: room.startTime,
            endTime: room.endTime,
          });
        } catch (error) {
          console.error("Start duel error:", error);
          socket.emit("error", { message: "Failed to start duel" });
        }
      });

      // Handle code changes
      socket.on("code-change", (data) => {
        try {
          if (!socket.userId) {
            socket.emit("error", { message: "Not authenticated" });
            return;
          }

          const { roomCode, code } = data;
          const room = rooms.get(roomCode);

          if (!room) {
            socket.emit("error", { message: "Room not found" });
            return;
          }

          const participant = room.participants.find(
            (p) => p.userId === socket.userId
          );
          if (participant) {
            participant.code = code;
          }

          // Broadcast code change to other participants (optional - for live collaboration)
          socket.to(roomCode).emit("participant-code-changed", {
            userId: socket.userId,
            username: socket.username,
            code,
          });
        } catch (error) {
          console.error("Code change error:", error);
          socket.emit("error", { message: "Failed to update code" });
        }
      });

      // Handle code submission
      socket.on("submit-code", async (data) => {
        try {
          if (!socket.userId) {
            socket.emit("error", { message: "Not authenticated" });
            return;
          }

          const { roomCode, code } = data;
          const room = rooms.get(roomCode);

          if (!room) {
            socket.emit("error", { message: "Room not found" });
            return;
          }

          if (room.status !== "active") {
            socket.emit("error", { message: "Duel not active" });
            return;
          }

          const participant = room.participants.find(
            (p) => p.userId === socket.userId
          );
          if (!participant) {
            socket.emit("error", { message: "Not in room" });
            return;
          }

          if (participant.hasSubmitted) {
            socket.emit("error", { message: "Already submitted" });
            return;
          }

          // Mark as submitted
          participant.hasSubmitted = true;
          participant.submissionTime = new Date();
          participant.code = code;

          console.log(`${socket.username} submitted code in room: ${roomCode}`);

          // Check if this is the first submission (winner)
          const allSubmissions = room.participants.filter(
            (p) => p.hasSubmitted
          );
          if (allSubmissions.length === 1) {
            // First submission wins
            room.winner = socket.userId;
            room.status = "finished";
            room.endTime = new Date();

            this.io.to(roomCode).emit("duel-finished", {
              room,
              winner: {
                userId: socket.userId,
                username: socket.username,
              },
              reason: "first-submission",
            });
          } else if (allSubmissions.length === room.participants.length) {
            // All submitted, determine winner by time
            const sortedSubmissions = allSubmissions.sort(
              (a, b) => new Date(a.submissionTime) - new Date(b.submissionTime)
            );
            const winner = sortedSubmissions[0];

            room.winner = winner.userId;
            room.status = "finished";
            room.endTime = new Date();

            this.io.to(roomCode).emit("duel-finished", {
              room,
              winner: {
                userId: winner.userId,
                username: winner.username,
              },
              reason: "fastest-submission",
            });
          } else {
            // Notify submission
            this.io.to(roomCode).emit("participant-submitted", {
              room,
              submittedUser: {
                userId: socket.userId,
                username: socket.username,
              },
            });
          }
        } catch (error) {
          console.error("Submit code error:", error);
          socket.emit("error", { message: "Failed to submit code" });
        }
      });

      // Handle chat messages
      socket.on("send-message", (data) => {
        try {
          if (!socket.userId) {
            socket.emit("error", { message: "Not authenticated" });
            return;
          }

          const { roomCode, message } = data;
          const room = rooms.get(roomCode);

          if (!room) {
            socket.emit("error", { message: "Room not found" });
            return;
          }

          const participant = room.participants.find(
            (p) => p.userId === socket.userId
          );
          if (!participant) {
            socket.emit("error", { message: "Not in room" });
            return;
          }

          const chatMessage = {
            userId: socket.userId,
            username: socket.username,
            message: message.trim(),
            timestamp: new Date(),
          };

          room.chatMessages.push(chatMessage);

          // Broadcast message to all participants
          this.io.to(roomCode).emit("new-message", { message: chatMessage });
        } catch (error) {
          console.error("Send message error:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);

        // Find and update rooms where this user was present
        for (const [roomCode, room] of rooms.entries()) {
          const participant = room.participants.find(
            (p) => p.socketId === socket.id
          );
          if (participant) {
            // Don't remove participant, just mark as disconnected
            participant.socketId = null;
            console.log(
              `${participant.username} disconnected from room: ${roomCode}`
            );

            // Notify other participants
            socket.to(roomCode).emit("participant-disconnected", {
              userId: participant.userId,
              username: participant.username,
            });
          }
        }
      });
    });
  }
}

export default SocketManager;
