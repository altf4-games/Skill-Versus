import mongoose from "mongoose";

const contestSubmissionSchema = new mongoose.Schema(
  {
    // Contest and problem info
    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      required: true,
      index: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
      index: true,
    },
    
    // User info
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
    },
    
    // Submission details
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
      enum: ["javascript", "python", "java", "cpp", "c"],
    },
    
    // Judge0 integration (optional for immediate processing)
    judge0Token: {
      type: String,
      required: false,
    },
    
    // Submission results
    status: {
      type: String,
      enum: [
        "pending",
        "judging", 
        "accepted",
        "wrong_answer",
        "time_limit_exceeded",
        "memory_limit_exceeded",
        "runtime_error",
        "compilation_error",
        "internal_error"
      ],
      default: "pending",
      index: true,
    },
    
    // Test case results
    testCaseResults: [{
      testCaseIndex: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        enum: ["passed", "failed", "error"],
        required: true,
      },
      executionTime: {
        type: Number, // in milliseconds
      },
      memoryUsed: {
        type: Number, // in KB
      },
      output: {
        type: String,
      },
      expectedOutput: {
        type: String,
      },
      errorMessage: {
        type: String,
      },
    }],
    
    // Overall execution stats
    totalTestCases: {
      type: Number,
      required: true,
      default: 0,
    },
    passedTestCases: {
      type: Number,
      required: true,
      default: 0,
    },
    maxExecutionTime: {
      type: Number, // in milliseconds
      default: 0,
    },
    maxMemoryUsed: {
      type: Number, // in KB
      default: 0,
    },
    
    // Contest-specific data
    submissionTime: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    timeFromStart: {
      type: Number, // minutes from contest start
      required: true,
    },
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
    penalty: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Flags
    isAccepted: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFirstAccepted: {
      type: Boolean,
      default: false, // First AC for this user on this problem
    },
    
    // Virtual contest support
    isVirtual: {
      type: Boolean,
      default: false,
      index: true,
    },
    virtualStartTime: {
      type: Date,
    },
    
    // Anti-cheat data
    antiCheatViolations: [{
      type: {
        type: String,
        enum: ["FOCUS_LOST", "TAB_SWITCH", "KEYBOARD_SHORTCUT", "DEV_TOOLS_ATTEMPT"],
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      message: String,
    }],
    
    // Compilation/Runtime details
    compilerOutput: {
      type: String,
    },
    runtimeError: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
contestSubmissionSchema.index({ contestId: 1, userId: 1, problemId: 1 });
contestSubmissionSchema.index({ contestId: 1, submissionTime: 1 });
contestSubmissionSchema.index({ contestId: 1, isAccepted: 1 });
contestSubmissionSchema.index({ userId: 1, submissionTime: -1 });

// Virtual for submission verdict
contestSubmissionSchema.virtual("verdict").get(function () {
  switch (this.status) {
    case "accepted":
      return "AC";
    case "wrong_answer":
      return "WA";
    case "time_limit_exceeded":
      return "TLE";
    case "memory_limit_exceeded":
      return "MLE";
    case "runtime_error":
      return "RE";
    case "compilation_error":
      return "CE";
    case "pending":
      return "PENDING";
    case "judging":
      return "JUDGING";
    default:
      return "ERROR";
  }
});

// Methods
contestSubmissionSchema.methods.calculatePoints = function (problemPoints) {
  if (this.isAccepted) {
    return problemPoints;
  }
  return 0;
};

contestSubmissionSchema.methods.calculatePenalty = function (penaltyPerWrongSubmission, wrongAttempts = 0) {
  if (this.isAccepted) {
    // For accepted submissions: submission time + (wrong attempts * penalty per wrong submission)
    return this.timeFromStart + (wrongAttempts * penaltyPerWrongSubmission);
  }
  // For wrong submissions, penalty is just the penalty per wrong submission
  return penaltyPerWrongSubmission;
};

contestSubmissionSchema.methods.updateResults = function (judge0Result) {
  // Update based on Judge0 response
  this.status = this.mapJudge0Status(judge0Result.status?.id);
  this.compilerOutput = judge0Result.compile_output;
  this.runtimeError = judge0Result.stderr;
  
  if (this.status === "accepted") {
    this.isAccepted = true;
  }
  
  // Update execution stats if available
  if (judge0Result.time) {
    this.maxExecutionTime = Math.max(this.maxExecutionTime, parseFloat(judge0Result.time) * 1000);
  }
  if (judge0Result.memory) {
    this.maxMemoryUsed = Math.max(this.maxMemoryUsed, parseInt(judge0Result.memory));
  }
};

contestSubmissionSchema.methods.mapJudge0Status = function (statusId) {
  const statusMap = {
    1: "pending", // In Queue
    2: "judging", // Processing
    3: "accepted", // Accepted
    4: "wrong_answer", // Wrong Answer
    5: "time_limit_exceeded", // Time Limit Exceeded
    6: "compilation_error", // Compilation Error
    7: "runtime_error", // Runtime Error (SIGSEGV)
    8: "runtime_error", // Runtime Error (SIGXFSZ)
    9: "runtime_error", // Runtime Error (SIGFPE)
    10: "runtime_error", // Runtime Error (SIGABRT)
    11: "runtime_error", // Runtime Error (NZEC)
    12: "runtime_error", // Runtime Error (Other)
    13: "internal_error", // Internal Error
    14: "internal_error", // Exec Format Error
  };
  
  return statusMap[statusId] || "internal_error";
};

export default mongoose.model("ContestSubmission", contestSubmissionSchema);
