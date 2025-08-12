import { Server } from "socket.io";
import Room from "../models/Room.js";
import User from "../models/User.js";
import Problem from "../models/Problem.js";

class SocketManager {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
      },
    });

    this.rooms = new Map(); // Track active rooms
    this.userSockets = new Map(); // Map user IDs to socket IDs

    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      // User authentication and joining
      socket.on("authenticate", async (data) => {
        try {
          const { userId } = data;
          const user = await User.findById(userId);
          if (user) {
            socket.userId = userId;
            socket.username = user.username;
            this.userSockets.set(userId, socket.id);
            socket.emit("authenticated", { success: true });
          }
        } catch (error) {
          socket.emit("error", { message: "Authentication failed" });
        }
      });

      // Join duel room
      socket.on("join-room", async (data) => {
        try {
          const { roomCode } = data;
          const userId = socket.userId;

          if (!userId) {
            socket.emit("error", { message: "Not authenticated" });
            return;
          }

          const room = await Room.findOne({ roomCode })
            .populate("participants.userId", "username profileImage")
            .populate("problem");

          if (!room) {
            socket.emit("error", { message: "Room not found" });
            return;
          }

          // Check if room is full
          if (
            room.participants.length >= room.maxParticipants &&
            !room.participants.some((p) => p.userId._id.toString() === userId)
          ) {
            socket.emit("error", { message: "Room is full" });
            return;
          }

          // Add user to room if not already in
          let participant = room.participants.find(
            (p) => p.userId._id.toString() === userId
          );
          if (!participant) {
            if (room.status !== "waiting") {
              socket.emit("error", { message: "Room already started" });
              return;
            }
            room.participants.push({
              userId: userId,
              socketId: socket.id,
            });
            await room.save();
            await room.populate("participants.userId", "username profileImage");
          } else {
            participant.socketId = socket.id;
            await room.save();
          }

          socket.join(roomCode);
          socket.roomCode = roomCode;

          // Send room data to user
          socket.emit("room-joined", {
            room: {
              roomCode: room.roomCode,
              participants: room.participants,
              problem: room.problem,
              status: room.status,
              timeLimit: room.timeLimit,
              startTime: room.startTime,
              endTime: room.endTime,
              chatMessages: room.chatMessages,
            },
          });

          // Notify others in room
          socket.to(roomCode).emit("user-joined", {
            user: room.participants.find(
              (p) => p.userId._id.toString() === userId
            ),
          });

          // Start game if room is full and all ready
          if (
            room.participants.length === room.maxParticipants &&
            room.status === "waiting"
          ) {
            this.startDuel(roomCode);
          }
        } catch (error) {
          console.error("Join room error:", error);
          socket.emit("error", { message: "Failed to join room" });
        }
      });

      // Ready toggle
      socket.on("toggle-ready", async (data) => {
        try {
          const roomCode = socket.roomCode;
          const userId = socket.userId;

          if (!roomCode || !userId) return;

          const room = await Room.findOne({ roomCode });
          if (!room) return;

          const participant = room.participants.find(
            (p) => p.userId.toString() === userId
          );
          if (participant) {
            participant.isReady = !participant.isReady;
            await room.save();

            this.io.to(roomCode).emit("participant-ready-changed", {
              userId,
              isReady: participant.isReady,
            });

            // Check if all ready and start
            if (
              room.participants.length === room.maxParticipants &&
              room.participants.every((p) => p.isReady) &&
              room.status === "waiting"
            ) {
              this.startDuel(roomCode);
            }
          }
        } catch (error) {
          console.error("Toggle ready error:", error);
        }
      });

      // Code sync during duel
      socket.on("code-change", async (data) => {
        try {
          const { code } = data;
          const roomCode = socket.roomCode;
          const userId = socket.userId;

          if (!roomCode || !userId) return;

          const room = await Room.findOne({ roomCode });
          if (!room || room.status !== "active") return;

          const participant = room.participants.find(
            (p) => p.userId.toString() === userId
          );
          if (participant) {
            participant.code = code;
            await room.save();

            // Notify opponent of code change (optional - for spectating)
            socket.to(roomCode).emit("opponent-code-change", {
              userId,
              codeLength: code.length,
            });
          }
        } catch (error) {
          console.error("Code change error:", error);
        }
      });

      // Code submission
      socket.on("submit-code", async (data) => {
        try {
          const { code, language } = data;
          const roomCode = socket.roomCode;
          const userId = socket.userId;

          if (!roomCode || !userId) return;

          const room = await Room.findOne({ roomCode }).populate("problem");
          if (!room || room.status !== "active") {
            socket.emit("error", { message: "Cannot submit code now" });
            return;
          }

          const participant = room.participants.find(
            (p) => p.userId.toString() === userId
          );
          if (!participant || participant.hasSubmitted) {
            socket.emit("error", { message: "Already submitted" });
            return;
          }

          // Mark as submitted
          participant.hasSubmitted = true;
          participant.submittedAt = new Date();
          participant.code = code;

          // Execute code and check if correct
          const isCorrect = await this.executeAndVerifyCode(
            code,
            language,
            room.problem
          );
          participant.isCorrect = isCorrect;

          await room.save();

          socket.emit("submission-result", { isCorrect });
          this.io.to(roomCode).emit("participant-submitted", {
            userId,
            isCorrect,
            submittedAt: participant.submittedAt,
          });

          // Check for winner or if both submitted
          await this.checkDuelEnd(roomCode);
        } catch (error) {
          console.error("Submit code error:", error);
          socket.emit("error", { message: "Submission failed" });
        }
      });

      // Chat message
      socket.on("chat-message", async (data) => {
        try {
          const { message } = data;
          const roomCode = socket.roomCode;
          const userId = socket.userId;
          const username = socket.username;

          if (!roomCode || !userId || !message.trim()) return;

          const room = await Room.findOne({ roomCode });
          if (!room) return;

          const chatMessage = {
            userId,
            username,
            message: message.trim(),
            timestamp: new Date(),
          };

          room.chatMessages.push(chatMessage);
          await room.save();

          this.io.to(roomCode).emit("chat-message", chatMessage);
        } catch (error) {
          console.error("Chat message error:", error);
        }
      });

      // Leave room
      socket.on("leave-room", async () => {
        try {
          const roomCode = socket.roomCode;
          const userId = socket.userId;

          if (roomCode && userId) {
            socket.leave(roomCode);
            socket.to(roomCode).emit("user-left", { userId });

            // Remove from room if waiting
            const room = await Room.findOne({ roomCode });
            if (room && room.status === "waiting") {
              room.participants = room.participants.filter(
                (p) => p.userId.toString() !== userId
              );
              await room.save();
            }
          }

          socket.roomCode = null;
        } catch (error) {
          console.error("Leave room error:", error);
        }
      });

      // Disconnect
      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);

        if (socket.userId) {
          this.userSockets.delete(socket.userId);
        }

        // Handle room disconnect
        if (socket.roomCode && socket.userId) {
          socket.to(socket.roomCode).emit("user-disconnected", {
            userId: socket.userId,
          });
        }
      });
    });
  }

  async startDuel(roomCode) {
    try {
      const room = await Room.findOne({ roomCode }).populate("problem");
      if (!room) return;

      room.status = "active";
      room.startTime = new Date();
      room.endTime = new Date(Date.now() + room.timeLimit * 60 * 1000); // Convert minutes to ms
      await room.save();

      this.io.to(roomCode).emit("duel-started", {
        startTime: room.startTime,
        endTime: room.endTime,
        problem: room.problem,
      });

      // Set timer for automatic end
      setTimeout(() => {
        this.endDuelByTimeout(roomCode);
      }, room.timeLimit * 60 * 1000);
    } catch (error) {
      console.error("Start duel error:", error);
    }
  }

  async checkDuelEnd(roomCode) {
    try {
      const room = await Room.findOne({ roomCode }).populate(
        "participants.userId"
      );
      if (!room) return;

      const correctSubmissions = room.participants.filter(
        (p) => p.isCorrect && p.hasSubmitted
      );
      const allSubmitted = room.participants.every((p) => p.hasSubmitted);

      // If someone got it right first, they win
      if (correctSubmissions.length > 0) {
        const winner = correctSubmissions.sort(
          (a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)
        )[0];

        await this.endDuel(roomCode, winner.userId._id);
      }
      // If both submitted but neither correct, it's a draw
      else if (allSubmitted) {
        await this.endDuel(roomCode, null);
      }
    } catch (error) {
      console.error("Check duel end error:", error);
    }
  }

  async endDuelByTimeout(roomCode) {
    try {
      const room = await Room.findOne({ roomCode });
      if (!room || room.status !== "active") return;

      // Check if anyone submitted correct solution
      const correctSubmissions = room.participants.filter(
        (p) => p.isCorrect && p.hasSubmitted
      );

      if (correctSubmissions.length > 0) {
        const winner = correctSubmissions.sort(
          (a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)
        )[0];
        await this.endDuel(roomCode, winner.userId);
      } else {
        await this.endDuel(roomCode, null); // Draw
      }
    } catch (error) {
      console.error("End duel by timeout error:", error);
    }
  }

  async endDuel(roomCode, winnerId) {
    try {
      const room = await Room.findOne({ roomCode }).populate(
        "participants.userId"
      );
      if (!room) return;

      room.status = "finished";
      room.winner = winnerId;
      room.endTime = new Date();
      await room.save();

      // Update user stats
      if (winnerId) {
        // Winner gets XP
        await User.findByIdAndUpdate(winnerId, {
          $inc: {
            "stats.totalDuels": 1,
            "stats.wins": 1,
            "stats.xp": 50, // XP for winning
          },
        });

        // Loser gets participation XP
        const losers = room.participants.filter(
          (p) => p.userId._id.toString() !== winnerId.toString()
        );
        for (const loser of losers) {
          await User.findByIdAndUpdate(loser.userId._id, {
            $inc: {
              "stats.totalDuels": 1,
              "stats.xp": 10, // Participation XP
            },
          });
        }
      } else {
        // Draw - both get participation XP
        for (const participant of room.participants) {
          await User.findByIdAndUpdate(participant.userId._id, {
            $inc: {
              "stats.totalDuels": 1,
              "stats.xp": 20, // Draw XP
            },
          });
        }
      }

      this.io.to(roomCode).emit("duel-ended", {
        winner: winnerId,
        finalResults: room.participants.map((p) => ({
          userId: p.userId._id,
          username: p.userId.username,
          isCorrect: p.isCorrect,
          hasSubmitted: p.hasSubmitted,
          submittedAt: p.submittedAt,
          code: p.code,
        })),
      });
    } catch (error) {
      console.error("End duel error:", error);
    }
  }

  async executeAndVerifyCode(code, language, problem) {
    try {
      // Here we'll integrate with Judge0 to execute the code
      const JUDGE0_BASE_URL = process.env.JUDGE0_BASE_URL;

      // Test with all test cases
      for (const testCase of problem.testCases) {
        const submission = {
          source_code: code,
          language_id: this.getLanguageId(language),
          stdin: testCase.input,
          expected_output: testCase.expectedOutput,
        };

        const response = await fetch(
          `${JUDGE0_BASE_URL}/submissions?base64_encoded=false&wait=true`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
            body: JSON.stringify(submission),
          }
        );

        const result = await response.json();

        // Check if output matches expected
        if (
          result.status?.id !== 3 ||
          result.stdout?.trim() !== testCase.expectedOutput.trim()
        ) {
          return false; // Failed this test case
        }
      }

      return true; // All test cases passed
    } catch (error) {
      console.error("Code execution error:", error);
      return false;
    }
  }

  getLanguageId(language) {
    const languageMap = {
      javascript: 63,
      python: 71,
      java: 62,
      cpp: 54,
      c: 50,
    };
    return languageMap[language] || 63; // Default to JavaScript
  }

  sendToRoom(roomCode, event, data) {
    this.io.to(roomCode).emit(event, data);
  }

  sendToUser(userId, event, data) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  getRoomUsers(roomCode) {
    return this.rooms.get(roomCode) || [];
  }
}

export default SocketManager;
