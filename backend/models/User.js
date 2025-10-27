import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    firstName: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    profileImage: {
      type: String,
      default: null,
    },
    // Skill Versus specific fields
    stats: {
      totalDuels: {
        type: Number,
        default: 0,
      },
      wins: {
        type: Number,
        default: 0,
      },
      losses: {
        type: Number,
        default: 0,
      },
      xp: {
        type: Number,
        default: 0,
      },
      rank: {
        type: String,
        enum: ["Iron", "Bronze", "Silver", "Gold", "Platinum"],
        default: "Iron",
      },
      streak: {
        type: Number,
        default: 0,
      },
      longestStreak: {
        type: Number,
        default: 0,
      },
      lastActivityDate: {
        type: Date,
        default: null,
      },
    },
    bio: {
      type: String,
      maxlength: 200,
      default: "",
    },
    // Contest admin flag
    contestAdmin: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    // Friends functionality
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    friendRequests: {
      sent: [
        {
          to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          sentAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      received: [
        {
          from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          sentAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
userSchema.index({ "stats.xp": -1 });
userSchema.index({ "stats.rank": 1 });

// Pre-save middleware to ensure streak fields exist for backward compatibility
userSchema.pre('save', function(next) {
  // Initialize streak fields if they don't exist
  if (this.stats.streak === undefined) {
    this.stats.streak = 0;
  }
  if (this.stats.longestStreak === undefined) {
    this.stats.longestStreak = 0;
  }
  if (this.stats.lastActivityDate === undefined) {
    this.stats.lastActivityDate = null;
  }
  next();
});

// Virtual for win rate
userSchema.virtual("winRate").get(function () {
  if (this.stats.totalDuels === 0) return 0;
  return ((this.stats.wins / this.stats.totalDuels) * 100).toFixed(1);
});

// Method to update rank based on XP
userSchema.methods.updateRank = function () {
  const xp = this.stats.xp;
  if (xp >= 10000) this.stats.rank = "Platinum";
  else if (xp >= 5000) this.stats.rank = "Gold";
  else if (xp >= 2000) this.stats.rank = "Silver";
  else if (xp >= 500) this.stats.rank = "Bronze";
  else this.stats.rank = "Iron";
};

// Method to add XP and update rank
userSchema.methods.addXP = function (points) {
  this.stats.xp += points;
  this.updateRank();
};

// Method to update daily streak
userSchema.methods.updateStreak = function () {
  const now = new Date();
  const lastActivity = this.stats.lastActivityDate;

  // Set to start of day in UTC for consistent comparison
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (!lastActivity) {
    // First activity ever
    this.stats.streak = 1;
    this.stats.longestStreak = 1;
    this.stats.lastActivityDate = now;
    return;
  }

  const lastActivityStart = new Date(
    lastActivity.getFullYear(),
    lastActivity.getMonth(),
    lastActivity.getDate()
  );

  const daysDifference = Math.floor(
    (todayStart - lastActivityStart) / (1000 * 60 * 60 * 24)
  );

  if (daysDifference === 0) {
    // Same day - no change to streak
    return;
  } else if (daysDifference === 1) {
    // Consecutive day - increment streak
    this.stats.streak += 1;
    if (this.stats.streak > this.stats.longestStreak) {
      this.stats.longestStreak = this.stats.streak;
    }
  } else {
    // Streak broken - reset to 1
    this.stats.streak = 1;
  }

  this.stats.lastActivityDate = now;
};

// Friends methods
userSchema.methods.isFriendWith = function (userId) {
  return this.friends.includes(userId);
};

userSchema.methods.hasSentFriendRequestTo = function (userId) {
  return this.friendRequests.sent.some(
    (req) => req.to.toString() === userId.toString()
  );
};

userSchema.methods.hasReceivedFriendRequestFrom = function (userId) {
  return this.friendRequests.received.some(
    (req) => req.from.toString() === userId.toString()
  );
};

const User = mongoose.model("User", userSchema);

export default User;
