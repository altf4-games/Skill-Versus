import mongoose from "mongoose";

const duelHistorySchema = new mongoose.Schema(
  {
    // Duel basic info
    duelType: {
      type: String,
      enum: ["coding", "typing"],
      required: true,
    },
    roomCode: {
      type: String,
      required: true,
    },
    
    // Participants (only 1v1 duels)
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        username: {
          type: String,
          required: true,
        },
        isWinner: {
          type: Boolean,
          required: true,
        },
        // Coding duel specific data
        submissionResult: {
          passedCount: Number,
          totalCount: Number,
          submissionTime: Date,
        },
        // Typing duel specific data
        typingStats: {
          wpm: Number,
          accuracy: Number,
          finishTime: Date,
          totalTime: Number,
        },
      },
    ],
    
    // Winner info
    winner: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      username: {
        type: String,
        required: true,
      },
    },
    
    // Duel completion details
    completionReason: {
      type: String,
      enum: ["correct-submission", "best-score", "completion", "anti-cheat"],
      required: true,
    },
    
    // Timing
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in seconds
      required: true,
    },
    
    // Problem info (for coding duels only)
    problem: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Problem",
      },
      title: String,
      // Removed difficulty to avoid enum conflicts
    },

    // Typing content info (for typing duels only)
    typingContent: {
      category: String,
      totalWords: Number,
      // Removed difficulty to avoid enum conflicts
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
duelHistorySchema.index({ "participants.userId": 1, createdAt: -1 });
duelHistorySchema.index({ "winner.userId": 1, createdAt: -1 });
duelHistorySchema.index({ duelType: 1, createdAt: -1 });

export default mongoose.model("DuelHistory", duelHistorySchema);
