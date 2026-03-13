import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    clerkId: { type: String, required: true },
    isReady: { type: Boolean, default: false },
    hasSubmitted: { type: Boolean, default: false },
    submissionTime: { type: Date, default: null },
    submissionResult: { type: mongoose.Schema.Types.Mixed, default: null },
    code: { type: String, default: "" },
    // Typing duel progress
    typingProgress: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    userId: { type: String },
    username: { type: String },
    message: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    host: { type: String, required: true }, // MongoDB userId
    hostUsername: { type: String, required: true },
    duelType: {
      type: String,
      enum: ["coding", "typing"],
      default: "coding",
    },
    // For coding duels
    problem: { type: mongoose.Schema.Types.Mixed, default: null },
    // For typing duels
    typingContent: { type: mongoose.Schema.Types.Mixed, default: null },
    timeLimit: { type: Number, default: 30 }, // minutes
    status: {
      type: String,
      enum: ["waiting", "active", "finished"],
      default: "waiting",
    },
    participants: [participantSchema],
    chatMessages: [chatMessageSchema],
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    winner: { type: String, default: null }, // userId
    winnerUsername: { type: String, default: null },
    // TTL — auto-delete rooms 2 hours after creation
    createdAt: { type: Date, default: Date.now, expires: 7200 },
  },
  { timestamps: true }
);

export default mongoose.model("Room", roomSchema);
