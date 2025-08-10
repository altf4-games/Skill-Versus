import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
      default: "",
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        isReady: {
          type: Boolean,
          default: false,
        },
      },
    ],
    maxParticipants: {
      type: Number,
      default: 2,
      min: 2,
      max: 10,
    },
    status: {
      type: String,
      enum: ["waiting", "starting", "active", "completed", "cancelled"],
      default: "waiting",
    },
    gameMode: {
      type: String,
      enum: ["duel", "tournament", "practice"],
      default: "duel",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "mixed"],
      default: "medium",
    },
    timeLimit: {
      type: Number, // in minutes
      default: 30,
      min: 5,
      max: 180,
    },
    language: {
      type: String,
      default: "any", // "any" or specific language like "python", "javascript", etc.
    },
    problem: {
      title: String,
      description: String,
      difficulty: String,
      timeLimit: Number,
      memoryLimit: Number,
      testCases: [
        {
          input: String,
          expectedOutput: String,
          isHidden: {
            type: Boolean,
            default: false,
          },
        },
      ],
      constraints: String,
      examples: [
        {
          input: String,
          output: String,
          explanation: String,
        },
      ],
    },
    submissions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        code: String,
        language: String,
        submittedAt: {
          type: Date,
          default: Date.now,
        },
        result: {
          status: String,
          score: Number,
          executionTime: Number,
          memoryUsed: Number,
          testCasesPassed: Number,
          totalTestCases: Number,
        },
        judge0Token: String,
      },
    ],
    chat: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        message: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    settings: {
      isPrivate: {
        type: Boolean,
        default: false,
      },
      password: {
        type: String,
        default: null,
      },
      allowSpectators: {
        type: Boolean,
        default: true,
      },
      autoStart: {
        type: Boolean,
        default: false,
      },
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    results: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rank: Number,
        score: Number,
        totalTime: Number,
        submissions: Number,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for current participant count
roomSchema.virtual("currentParticipants").get(function () {
  return this.participants.length;
});

// Virtual for available slots
roomSchema.virtual("availableSlots").get(function () {
  return this.maxParticipants - this.participants.length;
});

// Virtual for room is full
roomSchema.virtual("isFull").get(function () {
  return this.participants.length >= this.maxParticipants;
});

// Virtual for all participants ready
roomSchema.virtual("allReady").get(function () {
  return (
    this.participants.length > 1 && this.participants.every((p) => p.isReady)
  );
});

// Generate unique room ID
roomSchema.pre("save", async function (next) {
  if (!this.roomId) {
    let roomId;
    let isUnique = false;

    while (!isUnique) {
      // Generate 6-character alphanumeric room ID
      roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

      const existingRoom = await mongoose.model("Room").findOne({ roomId });
      if (!existingRoom) {
        isUnique = true;
      }
    }

    this.roomId = roomId;
  }
  next();
});

// Indexes for performance
roomSchema.index({ status: 1, createdAt: -1 });
roomSchema.index({ host: 1 });
roomSchema.index({ "participants.user": 1 });
roomSchema.index({ gameMode: 1, difficulty: 1 });

const Room = mongoose.model("Room", roomSchema);

export default Room;
