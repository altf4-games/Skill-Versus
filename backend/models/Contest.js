import mongoose from "mongoose";

const contestProblemSchema = new mongoose.Schema({
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Problem",
    required: true,
  },
  points: {
    type: Number,
    required: true,
    min: 1,
    max: 1000,
  },
  order: {
    type: Number,
    required: true,
    min: 1,
  },
});

const contestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByUsername: {
      type: String,
      required: true,
    },
    
    // Contest timing
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      required: true,
      min: 30,
      max: 300, // 5 hours max
    },
    
    // Contest configuration
    problems: [contestProblemSchema],
    maxParticipants: {
      type: Number,
      default: null, // null means unlimited
      min: 1,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    allowVirtualParticipation: {
      type: Boolean,
      default: true,
    },
    
    // Contest rules
    penaltyPerWrongSubmission: {
      type: Number,
      default: 20, // minutes
      min: 0,
    },
    maxSubmissionsPerProblem: {
      type: Number,
      default: 50,
      min: 1,
    },
    
    // Contest status
    status: {
      type: String,
      enum: ["upcoming", "active", "finished"],
      default: "upcoming",
    },
    
    // Participation tracking
    registeredUsers: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      username: {
        type: String,
        required: true,
      },
      registeredAt: {
        type: Date,
        default: Date.now,
      },
    }],
    
    // Final results (populated after contest ends)
    finalStandings: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      username: {
        type: String,
        required: true,
      },
      rank: {
        type: Number,
        required: true,
      },
      totalScore: {
        type: Number,
        required: true,
        default: 0,
      },
      totalPenalty: {
        type: Number,
        required: true,
        default: 0,
      },
      problemsSolved: {
        type: Number,
        required: true,
        default: 0,
      },
      lastSubmissionTime: {
        type: Date,
      },
    }],

    // Virtual contest final results
    virtualFinalStandings: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      username: {
        type: String,
        required: true,
      },
      rank: {
        type: Number,
        required: true,
      },
      totalScore: {
        type: Number,
        required: true,
        default: 0,
      },
      totalPenalty: {
        type: Number,
        required: true,
        default: 0,
      },
      problemsSolved: {
        type: Number,
        required: true,
        default: 0,
      },
      lastSubmissionTime: {
        type: Date,
      },
    }],

    // Statistics
    totalParticipants: {
      type: Number,
      default: 0,
    },
    totalVirtualParticipants: {
      type: Number,
      default: 0,
    },
    totalSubmissions: {
      type: Number,
      default: 0,
    },
    
    // Admin flags
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
contestSchema.index({ startTime: 1 });
contestSchema.index({ endTime: 1 });
contestSchema.index({ status: 1 });
contestSchema.index({ createdBy: 1 });
contestSchema.index({ "registeredUsers.userId": 1 });

// Virtual for contest state
contestSchema.virtual("isUpcoming").get(function () {
  return new Date() < this.startTime;
});

contestSchema.virtual("isCurrentlyActive").get(function () {
  const now = new Date();
  return now >= this.startTime && now <= this.endTime;
});

contestSchema.virtual("isFinished").get(function () {
  return new Date() > this.endTime;
});

// Methods
contestSchema.methods.canRegister = function () {
  const now = new Date();
  return (
    this.isActive &&
    now < this.startTime &&
    (this.maxParticipants === null || this.registeredUsers.length < this.maxParticipants)
  );
};

contestSchema.methods.isUserRegistered = function (userId) {
  return this.registeredUsers.some(
    (user) => user.userId.toString() === userId.toString()
  );
};

contestSchema.methods.registerUser = function (userId, username) {
  if (this.isUserRegistered(userId)) {
    throw new Error("User already registered");
  }
  
  if (!this.canRegister()) {
    throw new Error("Registration not allowed");
  }
  
  this.registeredUsers.push({
    userId,
    username,
    registeredAt: new Date(),
  });
};

contestSchema.methods.updateStatus = function () {
  const now = new Date();
  if (now < this.startTime) {
    this.status = "upcoming";
  } else if (now <= this.endTime) {
    this.status = "active";
  } else {
    this.status = "finished";
  }
};

// Pre-save middleware to update status
contestSchema.pre("save", function (next) {
  this.updateStatus();
  next();
});

export default mongoose.model("Contest", contestSchema);
