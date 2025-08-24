import { Server } from "socket.io";
import User from "../models/User.js";
import Problem from "../models/Problem.js";
import DuelHistory from "../models/DuelHistory.js";
import {
  getRandomTypingText,
  calculateTypingStats,
} from "../utils/typingTexts.js";
import { calculateXPGain } from "../utils/helpers.js";

// In-memory storage for rooms - real-time data should not be persisted to MongoDB
const rooms = new Map();

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Helper function to save duel history to MongoDB
async function saveDuelHistory(room, completionReason) {
  try {
    // Only save 1v1 duels that have a winner
    if (!room.winner || room.participants.length !== 2) {
      console.log(`Skipping duel history save - no winner or not 1v1: ${room.roomCode}`);
      return;
    }

    const duration = Math.floor((room.endTime - room.startTime) / 1000); // in seconds

    // Build base duel history data
    const duelHistoryData = {
      duelType: room.duelType,
      roomCode: room.roomCode,
      participants: room.participants.map(participant => ({
        userId: participant.userId, // MongoDB ObjectId as string
        username: participant.username,
        isWinner: participant.userId.toString() === room.winner.toString(),
        submissionResult: participant.submissionResult ? {
          passedCount: participant.submissionResult.passedCount,
          totalCount: participant.submissionResult.totalCount,
          submissionTime: participant.submissionTime,
        } : undefined,
        typingStats: participant.typingProgress ? {
          wpm: participant.typingProgress.wpm,
          accuracy: participant.typingProgress.accuracy,
          finishTime: participant.typingProgress.finishTime,
          totalTime: participant.typingProgress.finishTime ?
            Math.floor((participant.typingProgress.finishTime - room.startTime) / 1000) : undefined,
        } : undefined,
      })),
      winner: {
        userId: room.winner, // MongoDB ObjectId as string
        username: room.participants.find(p => p.userId.toString() === room.winner.toString())?.username,
      },
      completionReason,
      startTime: room.startTime,
      endTime: room.endTime,
      duration,
    };

    // Add duel-type specific data - ONLY for the correct type
    if (room.duelType === "coding") {
      if (room.problem) {
        duelHistoryData.problem = {
          id: room.problem.id || room.problem._id,
          title: room.problem.title,
          // Removed difficulty to avoid enum conflicts
        };
      }
      // Explicitly set typingContent to undefined for coding duels
      duelHistoryData.typingContent = undefined;
    } else if (room.duelType === "typing") {
      if (room.typingContent) {
        duelHistoryData.typingContent = {
          category: room.typingContent.category,
          totalWords: room.typingContent.totalWords,
          // Removed difficulty to avoid enum conflicts
        };
      }
      // Explicitly set problem to undefined for typing duels
      duelHistoryData.problem = undefined;
    }

    const duelHistory = new DuelHistory(duelHistoryData);
    await duelHistory.save();

    console.log(`Duel history saved for room: ${room.roomCode}, winner: ${duelHistoryData.winner.username}`);
  } catch (error) {
    console.error(`Error saving duel history for room ${room.roomCode}:`, error.message);
    console.error('Room details:', {
      duelType: room.duelType,
      winner: room.winner,
      participantCount: room.participants?.length,
      hasproblem: !!room.problem,
      hasTypingContent: !!room.typingContent
    });
  }
}

// Helper function to update user stats after duel completion
async function updateUserStats(userId, isWinner) {
  try {
    // userId here is the MongoDB ObjectId (as string), we need to find by _id
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User not found for stats update: ${userId}`);
      return;
    }

    // Update stats
    user.stats.totalDuels += 1;
    if (isWinner) {
      user.stats.wins += 1;
      user.addXP(calculateXPGain(true)); // Winner gets more XP
    } else {
      user.stats.losses += 1;
      user.addXP(calculateXPGain(false)); // Loser gets participation XP
    }

    await user.save();
    console.log(
      `Updated stats for ${user.username}: ${user.stats.wins}W/${user.stats.losses}L, ${user.stats.xp} XP, ${user.stats.rank}`
    );

    return user;
  } catch (error) {
    console.error(`Error updating user stats for ${userId}:`, error);
  }
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
          const { clerkUserId, userId } = data;
          const clerkId = clerkUserId || userId; // Support both property names

          if (!clerkId) {
            socket.emit("error", { message: "No user ID provided" });
            return;
          }

          let user = await User.findOne({ clerkId });

          // If user doesn't exist, they need to sync their account first
          if (!user) {
            console.log(
              `User not found for Clerk ID: ${clerkId}. User needs to sync account first.`
            );
            socket.emit("error", {
              message: "User not found. Please sync your account first.",
              code: "USER_NOT_SYNCED"
            });
            return;
          }

          socket.userId = user._id.toString();
          socket.clerkId = clerkId;
          socket.username = user.username;
          console.log(`User authenticated: ${user.username}`);
          socket.emit("authenticated", {
            success: true,
            username: user.username,
            userId: user._id.toString(),
          });
        } catch (error) {
          console.error("Authentication error:", error);
          socket.emit("error", {
            message: "Authentication failed: " + error.message,
          });
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
          const problemCount = await Problem.countDocuments({
            isActive: true,
            $or: [
              { isContestOnly: { $exists: false } },
              { isContestOnly: false }
            ]
          });
          if (problemCount === 0) {
            socket.emit("error", { message: "No problems available" });
            return;
          }

          const randomSkip = Math.floor(Math.random() * problemCount);
          const problem = await Problem.findOne({
            isActive: true,
            $or: [
              { isContestOnly: { $exists: false } },
              { isContestOnly: false }
            ]
          }).skip(randomSkip);

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
            duelType: "coding",
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

      // Create typing duel room
      socket.on("create-typing-duel", async (data) => {
        try {
          if (!socket.userId) {
            socket.emit("error", { message: "Not authenticated" });
            return;
          }

          const { timeLimit = 30, difficulty = null } = data;

          // Get random typing text
          const typingContent = await getRandomTypingText(difficulty);

          // Generate unique room code
          let roomCode;
          do {
            roomCode = generateRoomCode();
          } while (rooms.has(roomCode));

          // Create typing room in memory
          const room = {
            roomCode,
            host: socket.userId,
            hostUsername: socket.username,
            duelType: "typing",
            typingContent: {
              text: typingContent.text,
              words: typingContent.words,
              totalWords: typingContent.totalWords,
              difficulty: typingContent.difficulty,
              category: typingContent.category,
            },
            timeLimit,
            status: "waiting", // waiting, active, finished
            maxParticipants: 2, // Typing duels are 1v1 only
            participants: [
              {
                userId: socket.userId,
                username: socket.username,
                socketId: socket.id,
                isReady: false,
                typingProgress: {
                  currentWordIndex: 0,
                  typedText: "",
                  accuracy: 100,
                  wpm: 0,
                  startTime: null,
                  finishTime: null,
                  correctChars: 0,
                  totalChars: 0,
                },
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

          console.log(`Typing room created: ${roomCode} by ${socket.username}`);
          socket.emit("typing-duel-created", { room });
        } catch (error) {
          console.error("Create typing duel error:", error);
          socket.emit("error", { message: "Failed to create typing duel" });
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
            const newParticipant = {
              userId: socket.userId,
              username: socket.username,
              socketId: socket.id,
              isReady: false,
              hasSubmitted: false,
              submissionTime: null,
            };

            // Add different fields based on duel type
            if (room.duelType === "typing") {
              newParticipant.typingProgress = {
                currentWordIndex: 0,
                typedText: "",
                accuracy: 100,
                wpm: 0,
                startTime: null,
                finishTime: null,
                correctChars: 0,
                totalChars: 0,
              };
            } else {
              newParticipant.code =
                room.problem?.functionSignature?.javascript || "";
            }

            room.participants.push(newParticipant);
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

          // Check if both players are ready and auto-start
          const allReady =
            room.participants.length === 2 &&
            room.participants.every((p) => p.isReady);

          if (allReady && room.status === "waiting") {
            console.log(
              `All players ready in room ${roomCode}, auto-starting duel...`
            );

            // Auto-start the duel
            setTimeout(async () => {
              try {
                // Update room status
                room.status = "active";
                room.startTime = new Date();

                // Only add problems for coding duels
                if (room.duelType === "coding") {
                  // Get a random problem for the duel
                  const Problem = (await import("../models/Problem.js")).default;
                  const problems = await Problem.find({
                    $or: [
                      { isContestOnly: { $exists: false } },
                      { isContestOnly: false }
                    ]
                  });

                  if (problems.length === 0) {
                    console.error("No problems found in database");
                    this.io
                      .to(roomCode)
                      .emit("error", { message: "No problems available" });
                    return;
                  }

                  const randomProblem =
                    problems[Math.floor(Math.random() * problems.length)];
                  room.problem = randomProblem;

                  console.log(
                    `Coding duel started in room: ${roomCode} with problem: ${randomProblem.title}`
                  );

                  // Notify all participants that the duel has started
                  this.io
                    .to(roomCode)
                    .emit("duel-started", { room, problem: randomProblem });
                } else if (room.duelType === "typing") {
                  console.log(
                    `Typing duel started in room: ${roomCode}`
                  );

                  // Notify all participants that the duel has started
                  this.io
                    .to(roomCode)
                    .emit("duel-started", { room });
                }
              } catch (error) {
                console.error("Error auto-starting duel:", error);
                this.io
                  .to(roomCode)
                  .emit("error", { message: "Failed to start duel" });
              }
            }, 2000); // 2 second delay to show "All ready" state briefly
          }
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

          const { roomCode, code, result } = data;
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

          // Players can submit multiple times until they get it right
          participant.submissionTime = new Date();
          participant.code = code;
          participant.submissionResult = result;

          console.log(
            `${socket.username} submitted code in room: ${roomCode}, passed: ${result?.passedCount}/${result?.totalCount}`
          );

          // Notify room about submission attempt
          this.io.to(roomCode).emit("submission-received", {
            userId: socket.userId,
            username: socket.username,
            passed: result?.passedCount || 0,
            total: result?.totalCount || 0,
            isCorrect: result?.passedCount === result?.totalCount,
          });

          // Only end game on CORRECT submission (first to solve wins)
          if (
            result?.passedCount === result?.totalCount &&
            result?.totalCount > 0
          ) {
            // Mark as successfully submitted and end the game
            participant.hasSubmitted = true;
            room.winner = socket.userId;
            room.status = "finished";
            room.endTime = new Date();

            this.io.to(roomCode).emit("duel-finished", {
              room,
              winner: {
                userId: socket.userId,
                username: socket.username,
              },
              reason: "correct-submission",
              finalResults: room.participants.map((p) => ({
                userId: p.userId,
                username: p.username,
                passed: p.submissionResult?.passedCount || 0,
                total: p.submissionResult?.totalCount || 0,
                submissionTime: p.submissionTime,
              })),
            });

            // Update user stats for all participants
            for (const participant of room.participants) {
              const isWinner = participant.userId === socket.userId;
              await updateUserStats(participant.userId, isWinner);
            }

            // Save duel history
            await saveDuelHistory(room, "correct-submission");
          } else {
            // Check if all submitted without correct answers
            const allSubmissions = room.participants.filter(
              (p) => p.hasSubmitted
            );
            if (allSubmissions.length === room.participants.length) {
              // All submitted, find best score or fastest time
              const bestScore = Math.max(
                ...allSubmissions.map(
                  (p) => p.submissionResult?.passedCount || 0
                )
              );
              const bestSubmissions = allSubmissions.filter(
                (p) => (p.submissionResult?.passedCount || 0) === bestScore
              );

              // If tied on score, winner by time
              const winner = bestSubmissions.sort(
                (a, b) =>
                  new Date(a.submissionTime) - new Date(b.submissionTime)
              )[0];

              room.winner = winner.userId;
              room.status = "finished";
              room.endTime = new Date();

              this.io.to(roomCode).emit("duel-finished", {
                room,
                winner: {
                  userId: winner.userId,
                  username: winner.username,
                },
                reason: "best-score",
                finalResults: room.participants.map((p) => ({
                  userId: p.userId,
                  username: p.username,
                  passed: p.submissionResult?.passedCount || 0,
                  total: p.submissionResult?.totalCount || 0,
                  submissionTime: p.submissionTime,
                })),
              });

              // Update user stats for all participants
              for (const participant of room.participants) {
                const isWinner = participant.userId === winner.userId;
                await updateUserStats(participant.userId, isWinner);
              }

              // Save duel history
              await saveDuelHistory(room, "best-score");
            }
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

      // Handle chat messages (alternative event name for frontend compatibility)
      socket.on("chat-message", (data) => {
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
          this.io.to(roomCode).emit("chat-message", chatMessage);
        } catch (error) {
          console.error("Chat message error:", error);
          socket.emit("error", { message: "Failed to send chat message" });
        }
      });

      // Handle typing progress updates
      socket.on("typing-progress", (data) => {
        try {
          if (!socket.userId) {
            socket.emit("error", { message: "Not authenticated" });
            return;
          }

          const { roomCode, typedText, currentWordIndex } = data;
          const room = rooms.get(roomCode);

          if (!room) {
            socket.emit("error", { message: "Room not found" });
            return;
          }

          if (room.duelType !== "typing") {
            socket.emit("error", { message: "Not a typing room" });
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

          // Start timer on first character typed
          if (!participant.typingProgress.startTime && typedText.length > 0) {
            participant.typingProgress.startTime = new Date();
          }

          // Calculate typing statistics
          const timeElapsed = participant.typingProgress.startTime
            ? (new Date() - participant.typingProgress.startTime) / 1000
            : 0;

          const stats = calculateTypingStats(
            typedText,
            room.typingContent.text,
            timeElapsed
          );

          // Update participant progress
          participant.typingProgress.typedText = typedText;
          participant.typingProgress.currentWordIndex = currentWordIndex;
          participant.typingProgress.accuracy = stats.accuracy;
          participant.typingProgress.wpm = stats.wpm;
          participant.typingProgress.correctChars = stats.correctChars;
          participant.typingProgress.totalChars = stats.totalChars;

          // Note: Completion is handled by the frontend via typing-completion event
          // to ensure proper UI state management

          // Broadcast progress to other participants
          socket.to(roomCode).emit("participant-typing-progress", {
            userId: socket.userId,
            username: socket.username,
            progress: {
              currentWordIndex: participant.typingProgress.currentWordIndex,
              accuracy: participant.typingProgress.accuracy,
              wpm: participant.typingProgress.wpm,
              progressPercentage:
                (participant.typingProgress.currentWordIndex /
                  room.typingContent.totalWords) *
                100,
            },
          });
        } catch (error) {
          console.error("Typing progress error:", error);
          socket.emit("error", { message: "Failed to update typing progress" });
        }
      });

      // Handle typing restart (in case of mistakes with strict accuracy)
      socket.on("restart-typing", (data) => {
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

          if (room.duelType !== "typing") {
            socket.emit("error", { message: "Not a typing room" });
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

          // Reset typing progress
          participant.typingProgress = {
            currentWordIndex: 0,
            typedText: "",
            accuracy: 100,
            wpm: 0,
            startTime: null,
            finishTime: null,
            correctChars: 0,
            totalChars: 0,
          };

          console.log(
            `${socket.username} restarted typing in room: ${roomCode}`
          );

          // Notify participants about restart
          this.io.to(roomCode).emit("participant-typing-restart", {
            userId: socket.userId,
            username: socket.username,
          });
        } catch (error) {
          console.error("Restart typing error:", error);
          socket.emit("error", { message: "Failed to restart typing" });
        }
      });

      // Handle typing completion
      socket.on("typing-completion", async (data) => {
        try {
          if (!socket.userId) {
            socket.emit("error", { message: "Not authenticated" });
            return;
          }

          const { roomCode, finishTime, totalTime, wpm, accuracy, totalWords } =
            data;
          const room = rooms.get(roomCode);

          if (!room) {
            socket.emit("error", { message: "Room not found" });
            return;
          }

          if (room.duelType !== "typing") {
            socket.emit("error", { message: "Not a typing room" });
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

          // Mark participant as finished
          participant.typingProgress.finishTime = finishTime;
          participant.typingProgress.wpm = wpm;
          participant.typingProgress.accuracy = accuracy;
          participant.hasSubmitted = true;

          // Set winner and end the duel
          room.winner = socket.userId;
          room.status = "finished";
          room.endTime = new Date();

          console.log(
            `${socket.username} completed typing duel in room: ${roomCode} - ${wpm} WPM, ${accuracy}% accuracy`
          );

          // Notify all participants about the completion
          this.io.to(roomCode).emit("typing-duel-finished", {
            room,
            winner: {
              userId: socket.userId,
              username: socket.username,
            },
            reason: "completion",
            stats: {
              wpm,
              accuracy,
              totalTime,
              totalWords,
            },
            finalResults: room.participants.map((p) => ({
              userId: p.userId,
              username: p.username,
              typingProgress: p.typingProgress,
              finishTime: p.typingProgress.finishTime,
              isWinner: p.userId === socket.userId,
            })),
          });

          // Update user stats for all participants
          for (const participant of room.participants) {
            const isWinner = participant.userId === socket.userId;
            await updateUserStats(participant.userId, isWinner);
          }

          // Save duel history
          await saveDuelHistory(room, "completion");
        } catch (error) {
          console.error("Typing completion error:", error);
          socket.emit("error", {
            message: "Failed to handle typing completion",
          });
        }
      });

      // Handle anti-cheat violations
      socket.on("anti-cheat-violation", async (data) => {
        try {
          const { roomCode, violation } = data;

          if (!roomCode || !violation) {
            socket.emit("error", { message: "Invalid anti-cheat data" });
            return;
          }

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

          console.log(
            `[ANTI-CHEAT] Violation detected - Room: ${roomCode}, User: ${socket.username}, Type: ${violation.type}`
          );

          // Log the violation
          if (!room.antiCheatViolations) {
            room.antiCheatViolations = [];
          }

          room.antiCheatViolations.push({
            userId: socket.userId,
            username: socket.username,
            violation: violation,
            timestamp: new Date(),
          });

          // Count violations for this user
          const userViolations = room.antiCheatViolations.filter(v => v.userId === socket.userId);
          const userViolationCount = userViolations.length;

          // For serious violations (focus loss, tab switch, fullscreen exit), end the duel
          const seriousViolations = [
            "FOCUS_LOST",
            "TAB_SWITCH",
            "FULLSCREEN_EXIT",
          ];

          // Minor violations that accumulate
          const minorViolations = [
            "RIGHT_CLICK_ATTEMPT",
            "KEYBOARD_SHORTCUT",
            "DEV_TOOLS_ATTEMPT",
          ];

          // Check if this is a serious violation or if minor violations have accumulated
          const shouldDisqualify = seriousViolations.includes(violation.type) ||
                                  (minorViolations.includes(violation.type) && userViolationCount >= 5);

          if (shouldDisqualify) {
            // Mark the violating participant as disqualified
            participant.disqualified = true;
            participant.disqualificationReason = seriousViolations.includes(violation.type)
              ? violation.message
              : `Multiple anti-cheat violations (${userViolationCount} total)`;

            // Find the other participant as winner
            const otherParticipant = room.participants.find(
              (p) => p.userId !== socket.userId
            );

            if (otherParticipant && room.status === "active") {
              room.winner = otherParticipant.userId;
              room.status = "finished";
              room.endTime = new Date();

              console.log(
                `[ANTI-CHEAT] Duel terminated - Room: ${roomCode}, Winner: ${otherParticipant.username}, Violator: ${socket.username}`
              );

              // Notify all participants about the violation and result
              this.io.to(roomCode).emit("duel-finished", {
                room,
                winner: {
                  userId: otherParticipant.userId,
                  username: otherParticipant.username,
                },
                reason: "anti-cheat-violation",
                violator: {
                  userId: socket.userId,
                  username: socket.username,
                  violation: violation.message,
                },
              });

              // Update user stats
              await updateUserStats(otherParticipant.userId, true); // Winner
              await updateUserStats(socket.userId, false); // Loser (disqualified)

              // Save duel history
              await saveDuelHistory(room, "anti-cheat");
            }
          } else {
            // For minor violations, notify other participants and warn user
            socket.to(roomCode).emit("anti-cheat-warning", {
              userId: socket.userId,
              username: socket.username,
              violation: violation,
            });

            // Warn user about accumulating violations
            if (minorViolations.includes(violation.type)) {
              const remainingViolations = 5 - userViolationCount;
              if (remainingViolations <= 2) {
                socket.emit("anti-cheat-warning", {
                  message: `Warning: ${remainingViolations} more violations will result in disqualification`,
                  violationCount: userViolationCount,
                  maxViolations: 5
                });
              }
            }
          }
        } catch (error) {
          console.error("Anti-cheat violation handler error:", error);
          socket.emit("error", {
            message: "Failed to process anti-cheat violation",
          });
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
