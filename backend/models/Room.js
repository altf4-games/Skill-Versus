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
        // Typing specific fields
        typingProgress: {
          currentWordIndex: {
            type: Number,
            default: 0,
          },
          typedText: {
            type: String,
            default: "",
          },
          accuracy: {
            type: Number,
            default: 100,
          },
          wpm: {
            type: Number,
            default: 0,
          },
          startTime: Date,
          finishTime: Date,
          correctChars: {
            type: Number,
            default: 0,
          },
          totalChars: {
            type: Number,
            default: 0,
          },
        },
      },
    ],
    duelType: {
      type: String,
      enum: ["coding", "typing"],
      default: "coding",
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: function() {
        return this.duelType === "coding";
      },
    },
    typingContent: {
      text: {
        type: String,
        required: function() {
          return this.duelType === "typing";
        },
      },
      words: [{
        type: String,
      }],
      totalWords: {
        type: Number,
        required: function() {
          return this.duelType === "typing";
        },
      },
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
