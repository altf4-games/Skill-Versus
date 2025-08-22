import mongoose from "mongoose";

const contestRankingSchema = new mongoose.Schema(
  {
    // User info
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
    },
    
    // CP Rating system (similar to Codeforces/CodeChef)
    rating: {
      type: Number,
      default: 1200, // Starting rating
      min: 0,
      max: 4000,
    },
    maxRating: {
      type: Number,
      default: 1200,
      min: 0,
      max: 4000,
    },
    
    // Rank based on rating
    rank: {
      type: String,
      enum: [
        "Newbie",        // 0-1199
        "Pupil",         // 1200-1399  
        "Specialist",    // 1400-1599
        "Expert",        // 1600-1899
        "Candidate Master", // 1900-2099
        "Master",        // 2100-2299
        "International Master", // 2300-2399
        "Grandmaster",   // 2400-2599
        "International Grandmaster", // 2600-2999
        "Legendary Grandmaster" // 3000+
      ],
      default: "Newbie",
    },
    
    // Contest participation stats
    contestsParticipated: {
      type: Number,
      default: 0,
      min: 0,
    },
    contestsWon: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Problem solving stats
    totalProblemsAttempted: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalProblemsSolved: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Difficulty-wise problem stats
    problemStats: {
      easy: {
        attempted: { type: Number, default: 0 },
        solved: { type: Number, default: 0 },
      },
      medium: {
        attempted: { type: Number, default: 0 },
        solved: { type: Number, default: 0 },
      },
      hard: {
        attempted: { type: Number, default: 0 },
        solved: { type: Number, default: 0 },
      },
    },
    
    // Recent contest performances (last 10 contests)
    recentPerformances: [{
      contestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contest",
        required: true,
      },
      contestTitle: {
        type: String,
        required: true,
      },
      rank: {
        type: Number,
        required: true,
      },
      totalParticipants: {
        type: Number,
        required: true,
      },
      ratingChange: {
        type: Number,
        required: true,
      },
      newRating: {
        type: Number,
        required: true,
      },
      problemsSolved: {
        type: Number,
        required: true,
      },
      totalScore: {
        type: Number,
        required: true,
      },
      contestDate: {
        type: Date,
        required: true,
      },
    }],
    
    // Rating history for graphs
    ratingHistory: [{
      contestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contest",
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      ratingChange: {
        type: Number,
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
    }],
    
    // Achievements and milestones
    achievements: [{
      type: {
        type: String,
        enum: [
          "FIRST_CONTEST",
          "FIRST_AC",
          "FIRST_WIN",
          "RATING_MILESTONE",
          "PROBLEM_MILESTONE",
          "STREAK_MILESTONE"
        ],
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      achievedAt: {
        type: Date,
        default: Date.now,
      },
      value: {
        type: Number, // For milestones (rating reached, problems solved, etc.)
      },
    }],
    
    // Streaks
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastContestDate: {
      type: Date,
    },
    
    // Global ranking position
    globalRank: {
      type: Number,
      min: 1,
    },
    
    // Activity tracking
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
contestRankingSchema.index({ rating: -1 });
contestRankingSchema.index({ rank: 1 });
contestRankingSchema.index({ globalRank: 1 });
contestRankingSchema.index({ contestsParticipated: -1 });
contestRankingSchema.index({ totalProblemsSolved: -1 });

// Virtual for win rate
contestRankingSchema.virtual("winRate").get(function () {
  if (this.contestsParticipated === 0) return 0;
  return ((this.contestsWon / this.contestsParticipated) * 100).toFixed(1);
});

// Virtual for solve rate
contestRankingSchema.virtual("solveRate").get(function () {
  if (this.totalProblemsAttempted === 0) return 0;
  return ((this.totalProblemsSolved / this.totalProblemsAttempted) * 100).toFixed(1);
});

// Methods
contestRankingSchema.methods.updateRank = function () {
  const rating = this.rating;
  if (rating >= 3000) this.rank = "Legendary Grandmaster";
  else if (rating >= 2600) this.rank = "International Grandmaster";
  else if (rating >= 2400) this.rank = "Grandmaster";
  else if (rating >= 2300) this.rank = "International Master";
  else if (rating >= 2100) this.rank = "Master";
  else if (rating >= 1900) this.rank = "Candidate Master";
  else if (rating >= 1600) this.rank = "Expert";
  else if (rating >= 1400) this.rank = "Specialist";
  else if (rating >= 1200) this.rank = "Pupil";
  else this.rank = "Newbie";
};

contestRankingSchema.methods.updateRating = function (newRating, contestData) {
  const oldRating = this.rating;
  const ratingChange = newRating - oldRating;
  
  this.rating = newRating;
  this.maxRating = Math.max(this.maxRating, newRating);
  this.updateRank();
  
  // Add to rating history
  this.ratingHistory.push({
    contestId: contestData.contestId,
    rating: newRating,
    ratingChange: ratingChange,
    date: new Date(),
  });
  
  // Keep only last 50 rating history entries
  if (this.ratingHistory.length > 50) {
    this.ratingHistory = this.ratingHistory.slice(-50);
  }
  
  // Add to recent performances
  this.recentPerformances.push({
    contestId: contestData.contestId,
    contestTitle: contestData.contestTitle,
    rank: contestData.rank,
    totalParticipants: contestData.totalParticipants,
    ratingChange: ratingChange,
    newRating: newRating,
    problemsSolved: contestData.problemsSolved,
    totalScore: contestData.totalScore,
    contestDate: new Date(),
  });
  
  // Keep only last 10 performances
  if (this.recentPerformances.length > 10) {
    this.recentPerformances = this.recentPerformances.slice(-10);
  }
  
  this.lastUpdated = new Date();
};

contestRankingSchema.methods.addAchievement = function (type, title, description, value = null) {
  // Check if achievement already exists
  const exists = this.achievements.some(
    (achievement) => achievement.type === type && achievement.value === value
  );
  
  if (!exists) {
    this.achievements.push({
      type,
      title,
      description,
      value,
      achievedAt: new Date(),
    });
  }
};

// Pre-save middleware
contestRankingSchema.pre("save", function (next) {
  this.updateRank();
  this.lastUpdated = new Date();
  next();
});

export default mongoose.model("ContestRanking", contestRankingSchema);
