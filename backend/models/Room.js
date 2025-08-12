import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        socketId: String,
        code: {
          type: String,
          default: "",
        },
        isReady: {
          type: Boolean,
          default: false,
        },
        submittedAt: Date,
        isCorrect: {
          type: Boolean,
          default: false,
        },
        hasSubmitted: {
          type: Boolean,
          default: false,
        },
      },
    ],
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    status: {
      type: String,
      enum: ["waiting", "ready", "active", "finished"],
      default: "waiting",
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    startTime: Date,
    endTime: Date,
    maxParticipants: {
      type: Number,
      default: 2,
    },
    timeLimit: {
      type: Number,
      default: 30, // minutes
    },
    chatMessages: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        username: String,
        message: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient room code lookups
roomSchema.index({ roomCode: 1 });

export default mongoose.model("Room", roomSchema);
