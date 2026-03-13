import Room from "../models/Room.js";
import User from "../models/User.js";
import Problem from "../models/Problem.js";
import DuelHistory from "../models/DuelHistory.js";
import pusherServer from "../utils/pusher.js";
import {
  getRandomTypingText,
  calculateTypingStats,
} from "../utils/typingTexts.js";
import { calculateXPGain } from "../utils/helpers.js";

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function saveDuelHistory(room, completionReason) {
  try {
    if (!room.winner || room.participants.length !== 2) return;

    const duration = room.endTime && room.startTime
      ? Math.floor((new Date(room.endTime) - new Date(room.startTime)) / 1000)
      : 0;

    const duelHistoryData = {
      duelType: room.duelType,
      roomCode: room.roomCode,
      participants: room.participants.map((p) => ({
        userId: p.userId,
        username: p.username,
        isWinner: p.userId.toString() === room.winner.toString(),
        submissionResult: p.submissionResult
          ? {
              passedCount: p.submissionResult.passedCount,
              totalCount: p.submissionResult.totalCount,
              submissionTime: p.submissionTime,
            }
          : undefined,
        typingStats: p.typingProgress
          ? {
              wpm: p.typingProgress.wpm,
              accuracy: p.typingProgress.accuracy,
              finishTime: p.typingProgress.finishTime,
            }
          : undefined,
      })),
      winner: {
        userId: room.winner,
        username: room.winnerUsername,
      },
      completionReason,
      startTime: room.startTime,
      endTime: room.endTime,
      duration,
    };

    if (room.duelType === "coding" && room.problem) {
      duelHistoryData.problem = {
        id: room.problem._id || room.problem.id,
        title: room.problem.title,
      };
    } else if (room.duelType === "typing" && room.typingContent) {
      duelHistoryData.typingContent = {
        category: room.typingContent.category,
        totalWords: room.typingContent.totalWords,
      };
    }

    const duelHistory = new DuelHistory(duelHistoryData);
    await duelHistory.save();
    console.log(`Duel history saved for room: ${room.roomCode}`);
  } catch (error) {
    console.error(`Error saving duel history for room ${room.roomCode}:`, error.message);
  }
}

async function updateUserStats(userId, isWinner) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    user.stats.totalDuels += 1;
    if (isWinner) {
      user.stats.wins += 1;
      user.addXP(calculateXPGain(true));
    } else {
      user.stats.losses += 1;
      user.addXP(calculateXPGain(false));
    }
    user.updateStreak();
    await user.save();

    console.log(`Updated stats for ${user.username}: ${user.stats.wins}W/${user.stats.losses}L`);
    return user;
  } catch (error) {
    console.error(`Error updating user stats for ${userId}:`, error);
  }
}

// POST /api/duels/create
export const createDuel = async (req, res) => {
  try {
    console.log("createDuel called! body:", req.body, "authId:", req.auth?.userId);
    const { timeLimit = 30 } = req.body;
    const clerkId = req.auth.userId;

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Get a random problem
    const problemCount = await Problem.countDocuments({
      isActive: true,
      $or: [{ isContestOnly: { $exists: false } }, { isContestOnly: false }],
    });
    if (problemCount === 0)
      return res.status(400).json({ error: "No problems available" });

    const randomSkip = Math.floor(Math.random() * problemCount);
    const problem = await Problem.findOne({
      isActive: true,
      $or: [{ isContestOnly: { $exists: false } }, { isContestOnly: false }],
    }).skip(randomSkip);

    let roomCode;
    let attempts = 0;
    do {
      roomCode = generateRoomCode();
      attempts++;
    } while ((await Room.findOne({ roomCode })) && attempts < 10);

    const room = await Room.create({
      roomCode,
      host: user._id.toString(),
      hostUsername: user.username,
      duelType: "coding",
      problem: {
        _id: problem._id.toString(),
        id: problem._id.toString(),
        title: problem.title,
        description: problem.description,
        examples: problem.examples,
        constraints: problem.constraints,
        difficulty: problem.difficulty,
        functionSignature: problem.functionSignature,
        functionSignatures: problem.functionSignatures || {},
        languageBoilerplate: problem.functionSignatures || {},
        testCases: problem.testCases,
      },
      timeLimit,
      status: "waiting",
      participants: [
        {
          userId: user._id.toString(),
          username: user.username,
          clerkId,
          isReady: false,
          code: problem.functionSignature?.javascript || "",
          hasSubmitted: false,
        },
      ],
    });

    console.log(`Room created: ${roomCode} by ${user.username}, full object:`, room);
    res.status(201).json({ room });
  } catch (error) {
    console.error("Create duel error:", error);
    res.status(500).json({ error: "Failed to create duel" });
  }
};

// POST /api/duels/create-typing
export const createTypingDuel = async (req, res) => {
  try {
    const { timeLimit = 30, difficulty = null } = req.body;
    const clerkId = req.auth.userId;

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const typingContent = await getRandomTypingText(difficulty);

    let roomCode;
    let attempts = 0;
    do {
      roomCode = generateRoomCode();
      attempts++;
    } while ((await Room.findOne({ roomCode })) && attempts < 10);

    const defaultProgress = {
      currentWordIndex: 0,
      typedText: "",
      accuracy: 100,
      wpm: 0,
      startTime: null,
      finishTime: null,
      correctChars: 0,
      totalChars: 0,
    };

    const room = await Room.create({
      roomCode,
      host: user._id.toString(),
      hostUsername: user.username,
      duelType: "typing",
      typingContent: {
        text: typingContent.text,
        words: typingContent.words,
        totalWords: typingContent.totalWords,
        difficulty: typingContent.difficulty,
        category: typingContent.category,
      },
      timeLimit,
      status: "waiting",
      participants: [
        {
          userId: user._id.toString(),
          username: user.username,
          clerkId,
          isReady: false,
          typingProgress: defaultProgress,
          hasSubmitted: false,
        },
      ],
    });

    console.log(`Typing room created: ${roomCode} by ${user.username}`);
    res.status(201).json({ room });
  } catch (error) {
    console.error("Create typing duel error:", error);
    res.status(500).json({ error: "Failed to create typing duel" });
  }
};

// GET /api/duels/room/:roomCode
export const getRoom = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json({ room });
  } catch (error) {
    console.error("Get room error:", error);
    res.status(500).json({ error: "Failed to get room" });
  }
};

// POST /api/duels/join/:roomCode
export const joinDuel = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const clerkId = req.auth.userId;

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) return res.status(404).json({ error: "Room not found" });
    if (room.status !== "waiting") return res.status(400).json({ error: "Room already started" });

    const existing = room.participants.find((p) => p.userId === user._id.toString());
    if (!existing) {
      if (room.participants.length >= 2)
        return res.status(400).json({ error: "Room is full" });

      const newParticipant = {
        userId: user._id.toString(),
        username: user.username,
        clerkId,
        isReady: false,
        hasSubmitted: false,
      };
      if (room.duelType === "typing") {
        newParticipant.typingProgress = {
          currentWordIndex: 0, typedText: "", accuracy: 100,
          wpm: 0, startTime: null, finishTime: null, correctChars: 0, totalChars: 0,
        };
      } else {
        newParticipant.code = room.problem?.functionSignature?.javascript || "";
      }
      room.participants.push(newParticipant);
      await room.save();
    }

    await pusherServer.trigger(`room-${room.roomCode}`, "participant-joined", {
      room: room.toObject(),
      joinedUser: { userId: user._id.toString(), username: user.username },
    });

    console.log(`${user.username} joined room: ${room.roomCode}`);
    res.json({ room });
  } catch (error) {
    console.error("Join duel error:", error);
    res.status(500).json({ error: "Failed to join duel" });
  }
};

// POST /api/duels/ready/:roomCode
export const toggleReady = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const clerkId = req.auth.userId;

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) return res.status(404).json({ error: "Room not found" });

    const p = room.participants.find((p) => p.userId === user._id.toString());
    if (!p) return res.status(400).json({ error: "Not in room" });

    p.isReady = !p.isReady;
    await room.save();

    await pusherServer.trigger(`room-${room.roomCode}`, "user-ready-changed", {
      room: room.toObject(),
      userId: user._id.toString(),
      isReady: p.isReady,
    });

    // Auto-start if both ready
    const allReady =
      room.participants.length === 2 &&
      room.participants.every((p) => p.isReady);

    if (allReady && room.status === "waiting") {
      setTimeout(async () => {
        try {
          const freshRoom = await Room.findOne({ roomCode: room.roomCode });
          if (!freshRoom || freshRoom.status !== "waiting") return;

          freshRoom.status = "active";
          freshRoom.startTime = new Date();

          if (freshRoom.duelType === "coding") {
            // Re-fetch a problem for the actual duel start
            const problems = await Problem.find({
              isActive: true,
              $or: [{ isContestOnly: { $exists: false } }, { isContestOnly: false }],
            });
            if (problems.length > 0) {
              const rp = problems[Math.floor(Math.random() * problems.length)];
              freshRoom.problem = {
                _id: rp._id.toString(),
                id: rp._id.toString(),
                title: rp.title,
                description: rp.description,
                examples: rp.examples,
                constraints: rp.constraints,
                difficulty: rp.difficulty,
                functionSignature: rp.functionSignature,
                functionSignatures: rp.functionSignatures || {},
                languageBoilerplate: rp.functionSignatures || {},
                testCases: rp.testCases,
              };
            }
          }

          await freshRoom.save();
          await pusherServer.trigger(`room-${freshRoom.roomCode}`, "duel-started", {
            room: freshRoom.toObject(),
          });
          console.log(`Duel auto-started in room ${freshRoom.roomCode}`);
        } catch (err) {
          console.error("Error auto-starting duel:", err);
        }
      }, 2000);
    }

    res.json({ room: room.toObject(), isReady: p.isReady });
  } catch (error) {
    console.error("Toggle ready error:", error);
    res.status(500).json({ error: "Failed to toggle ready" });
  }
};

// POST /api/duels/submit/:roomCode
export const submitCode = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { code, language, result } = req.body;
    const clerkId = req.auth.userId;

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) return res.status(404).json({ error: "Room not found" });
    if (room.status !== "active") return res.status(400).json({ error: "Duel not active" });

    const p = room.participants.find((p) => p.userId === user._id.toString());
    if (!p) return res.status(400).json({ error: "Not in room" });

    p.submissionTime = new Date();
    p.code = code;
    p.submissionResult = result;

    // Notify room about submission
    await pusherServer.trigger(`room-${room.roomCode}`, "submission-received", {
      userId: user._id.toString(),
      username: user.username,
      passed: result?.passedCount || 0,
      total: result?.totalCount || 0,
      isCorrect: result?.passedCount === result?.totalCount,
    });

    const isCorrect = result?.passedCount === result?.totalCount && result?.totalCount > 0;

    if (isCorrect && !room.winner) {
      p.hasSubmitted = true;
      room.winner = user._id.toString();
      room.winnerUsername = user.username;
      room.status = "finished";
      room.endTime = new Date();
      await room.save();

      await pusherServer.trigger(`room-${room.roomCode}`, "duel-finished", {
        room: room.toObject(),
        winner: { userId: user._id.toString(), username: user.username },
        reason: "correct-submission",
        finalResults: room.participants.map((p) => ({
          userId: p.userId,
          username: p.username,
          passed: p.submissionResult?.passedCount || 0,
          total: p.submissionResult?.totalCount || 0,
          submissionTime: p.submissionTime,
        })),
      });

      // Update stats and history async
      for (const participant of room.participants) {
        await updateUserStats(participant.userId, participant.userId === user._id.toString());
      }
      await saveDuelHistory(room.toObject(), "correct-submission");
    } else {
      await room.save();
    }

    res.json({ success: true, isCorrect, room: room.toObject() });
  } catch (error) {
    console.error("Submit code error:", error);
    res.status(500).json({ error: "Failed to submit code" });
  }
};

// POST /api/duels/typing-finish/:roomCode
export const finishTyping = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { typingStats } = req.body;
    const clerkId = req.auth.userId;

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) return res.status(404).json({ error: "Room not found" });
    if (room.status !== "active") return res.status(400).json({ error: "Duel not active" });

    const p = room.participants.find((p) => p.userId === user._id.toString());
    if (!p) return res.status(400).json({ error: "Not in room" });

    p.typingProgress = { ...p.typingProgress, ...typingStats, finishTime: new Date() };
    p.hasSubmitted = true;
    p.submissionTime = new Date();

    const allDone = room.participants.every((p) => p.hasSubmitted);

    if (allDone && !room.winner) {
      // Determine winner by accuracy then WPM
      const sorted = [...room.participants].sort((a, b) => {
        const accDiff = (b.typingProgress?.accuracy || 0) - (a.typingProgress?.accuracy || 0);
        if (accDiff !== 0) return accDiff;
        return (b.typingProgress?.wpm || 0) - (a.typingProgress?.wpm || 0);
      });
      const winner = sorted[0];

      room.winner = winner.userId;
      room.winnerUsername = winner.username;
      room.status = "finished";
      room.endTime = new Date();
      await room.save();

      await pusherServer.trigger(`room-${room.roomCode}`, "typing-duel-finished", {
        room: room.toObject(),
        winner: { userId: winner.userId, username: winner.username },
        reason: "completed",
        finalResults: room.participants.map((p) => ({
          userId: p.userId,
          username: p.username,
          wpm: p.typingProgress?.wpm || 0,
          accuracy: p.typingProgress?.accuracy || 0,
        })),
      });

      for (const participant of room.participants) {
        await updateUserStats(participant.userId, participant.userId === winner.userId);
      }
      await saveDuelHistory(room.toObject(), "completed");
    } else {
      await room.save();
      // Broadcast progress to opponent
      await pusherServer.trigger(`room-${room.roomCode}`, "participant-typing-progress", {
        userId: user._id.toString(),
        username: user.username,
        progress: typingStats,
      });
    }

    res.json({ success: true, room: room.toObject() });
  } catch (error) {
    console.error("Finish typing error:", error);
    res.status(500).json({ error: "Failed to finish typing" });
  }
};

// POST /api/duels/typing-progress/:roomCode
export const updateTypingProgress = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { progress } = req.body;
    const clerkId = req.auth.userId;

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Broadcast progress via Pusher (don't save to DB every keystroke)
    await pusherServer.trigger(`room-${roomCode.toUpperCase()}`, "participant-typing-progress", {
      userId: user._id.toString(),
      username: user.username,
      progress,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Typing progress error:", error);
    res.status(500).json({ error: "Failed to update typing progress" });
  }
};

// POST /api/duels/chat/:roomCode
export const sendChat = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { message } = req.body;
    const clerkId = req.auth.userId;

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) return res.status(404).json({ error: "Room not found" });

    const chatMsg = {
      userId: user._id.toString(),
      username: user.username,
      message: message.trim(),
      timestamp: new Date(),
    };

    room.chatMessages.push(chatMsg);
    await room.save();

    await pusherServer.trigger(`room-${room.roomCode}`, "chat-message", chatMsg);

    res.json({ success: true });
  } catch (error) {
    console.error("Send chat error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// POST /api/duels/anti-cheat/:roomCode  (no-op placeholder — duel anti-cheat is client-side only)
export const reportAntiCheat = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { violation } = req.body;
    console.log(`[ANTI-CHEAT] Room ${roomCode}:`, violation?.type);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to report violation" });
  }
};
