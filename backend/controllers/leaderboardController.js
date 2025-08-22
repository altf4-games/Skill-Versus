import User from "../models/User.js";
import ContestRanking from "../models/ContestRanking.js";
import DuelHistory from "../models/DuelHistory.js";
import ratingService from "../services/ratingService.js";

// Get global leaderboard combining all achievements
export const getGlobalLeaderboard = async (req, res) => {
  try {
    const { page = 1, limit = 50, type = 'combined' } = req.query;
    const skip = (page - 1) * limit;
    
    let leaderboard = [];
    let total = 0;
    
    switch (type) {
      case 'xp':
        // XP-based leaderboard
        const xpUsers = await User.find({})
          .select("username firstName lastName profileImage stats bio")
          .sort({ "stats.xp": -1 })
          .limit(parseInt(limit))
          .skip(skip);
        
        total = await User.countDocuments({});
        
        leaderboard = xpUsers.map((user, index) => ({
          rank: skip + index + 1,
          id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage,
          score: user.stats?.xp || 0,
          scoreType: 'XP',
          stats: user.stats,
          bio: user.bio,
        }));
        break;
        
      case 'rating':
        // Contest rating-based leaderboard
        const rankings = await ratingService.getGlobalRankings(parseInt(limit), skip);
        total = await ContestRanking.countDocuments({ isActive: true });
        
        leaderboard = rankings.map((ranking, index) => ({
          rank: skip + index + 1,
          id: ranking.userId,
          username: ranking.username,
          score: ranking.rating,
          scoreType: 'Rating',
          contestRank: ranking.rank,
          contestsParticipated: ranking.contestsParticipated,
          contestsWon: ranking.contestsWon,
        }));
        break;
        
      case 'combined':
      default:
        // Combined leaderboard with weighted scoring
        const users = await User.find({})
          .select("username firstName lastName profileImage stats bio")
          .lean();
        
        const contestRankings = await ContestRanking.find({ isActive: true })
          .select("userId rating contestsParticipated contestsWon")
          .lean();
        
        const duelStats = await DuelHistory.aggregate([
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
            }
          },
          {
            $unwind: "$participants"
          },
          {
            $group: {
              _id: "$participants.userId",
              totalDuels: { $sum: 1 },
              wins: {
                $sum: {
                  $cond: [{ $eq: ["$participants.isWinner", true] }, 1, 0]
                }
              }
            }
          }
        ]);
        
        // Create a map for quick lookup
        const contestRankingMap = new Map();
        contestRankings.forEach(ranking => {
          contestRankingMap.set(ranking.userId.toString(), ranking);
        });
        
        const duelStatsMap = new Map();
        duelStats.forEach(stat => {
          duelStatsMap.set(stat._id.toString(), stat);
        });
        
        // Calculate combined scores
        const combinedUsers = users.map(user => {
          const contestRanking = contestRankingMap.get(user._id.toString());
          const duelStat = duelStatsMap.get(user._id.toString());
          
          // Weighted scoring system
          const xpScore = (user.stats?.xp || 0) * 0.3;
          const ratingScore = (contestRanking?.rating || 1200) * 0.5;
          const duelScore = (duelStat?.wins || 0) * 50 * 0.2;
          
          const combinedScore = Math.round(xpScore + ratingScore + duelScore);
          
          return {
            id: user._id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImage: user.profileImage,
            score: combinedScore,
            scoreType: 'Combined',
            stats: user.stats,
            bio: user.bio,
            contestRating: contestRanking?.rating || 1200,
            contestRank: contestRanking?.rank || 'Newbie',
            recentDuelWins: duelStat?.wins || 0,
            recentDuelTotal: duelStat?.totalDuels || 0,
          };
        });
        
        // Sort by combined score and paginate
        combinedUsers.sort((a, b) => b.score - a.score);
        total = combinedUsers.length;
        
        leaderboard = combinedUsers
          .slice(skip, skip + parseInt(limit))
          .map((user, index) => ({
            ...user,
            rank: skip + index + 1,
          }));
        break;
    }
    
    res.json({
      leaderboard,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      type,
    });
  } catch (error) {
    console.error("Get global leaderboard error:", error);
    res.status(500).json({ error: "Failed to get leaderboard" });
  }
};

// Get contest-specific leaderboard
export const getContestLeaderboard = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    
    const rankings = await ratingService.getGlobalRankings(parseInt(limit), skip);
    const total = await ContestRanking.countDocuments({ isActive: true });
    
    res.json({
      leaderboard: rankings.map((ranking, index) => ({
        rank: skip + index + 1,
        id: ranking.userId,
        username: ranking.username,
        rating: ranking.rating,
        maxRating: ranking.maxRating,
        contestRank: ranking.rank,
        contestsParticipated: ranking.contestsParticipated,
        contestsWon: ranking.contestsWon,
        globalRank: ranking.globalRank,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get contest leaderboard error:", error);
    res.status(500).json({ error: "Failed to get contest leaderboard" });
  }
};

// Get duel-specific leaderboard
export const getDuelLeaderboard = async (req, res) => {
  try {
    const { page = 1, limit = 50, timeframe = '30d' } = req.query;
    const skip = (page - 1) * limit;
    
    // Calculate date range based on timeframe
    let dateFilter = {};
    const now = new Date();
    
    switch (timeframe) {
      case '7d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case 'all':
      default:
        dateFilter = {};
        break;
    }
    
    const duelStats = await DuelHistory.aggregate([
      { $match: dateFilter },
      { $unwind: "$participants" },
      {
        $group: {
          _id: "$participants.userId",
          totalDuels: { $sum: 1 },
          wins: {
            $sum: {
              $cond: [{ $eq: ["$participants.isWinner", true] }, 1, 0]
            }
          },
          codingDuels: {
            $sum: {
              $cond: [{ $eq: ["$duelType", "coding"] }, 1, 0]
            }
          },
          typingDuels: {
            $sum: {
              $cond: [{ $eq: ["$duelType", "typing"] }, 1, 0]
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          username: "$user.username",
          firstName: "$user.firstName",
          lastName: "$user.lastName",
          profileImage: "$user.profileImage",
          totalDuels: 1,
          wins: 1,
          losses: { $subtract: ["$totalDuels", "$wins"] },
          winRate: {
            $cond: [
              { $eq: ["$totalDuels", 0] },
              0,
              { $multiply: [{ $divide: ["$wins", "$totalDuels"] }, 100] }
            ]
          },
          codingDuels: 1,
          typingDuels: 1,
          score: { $multiply: ["$wins", 10] } // Simple scoring: 10 points per win
        }
      },
      { $sort: { score: -1, winRate: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);
    
    // Get total count for pagination
    const totalCount = await DuelHistory.aggregate([
      { $match: dateFilter },
      { $unwind: "$participants" },
      { $group: { _id: "$participants.userId" } },
      { $count: "total" }
    ]);
    
    const total = totalCount[0]?.total || 0;
    
    // Helper function to calculate duel rank
    const calculateDuelRank = (wins, winRate) => {
      if (wins >= 100 && winRate >= 80) return "Radiant";
      if (wins >= 75 && winRate >= 75) return "Immortal";
      if (wins >= 50 && winRate >= 70) return "Ascendant";
      if (wins >= 30 && winRate >= 65) return "Diamond";
      if (wins >= 20 && winRate >= 60) return "Platinum";
      if (wins >= 10 && winRate >= 55) return "Gold";
      if (wins >= 5 && winRate >= 50) return "Silver";
      if (wins >= 1) return "Bronze";
      return "Iron";
    };

    const leaderboard = duelStats.map((stat, index) => ({
      rank: skip + index + 1,
      id: stat._id,
      username: stat.username,
      firstName: stat.firstName,
      lastName: stat.lastName,
      profileImage: stat.profileImage,
      score: stat.score,
      totalDuels: stat.totalDuels,
      wins: stat.wins,
      losses: stat.losses,
      winRate: Math.round(stat.winRate * 100) / 100,
      codingDuels: stat.codingDuels,
      typingDuels: stat.typingDuels,
      duelRank: calculateDuelRank(stat.wins, stat.winRate),
    }));
    
    res.json({
      leaderboard,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      timeframe,
    });
  } catch (error) {
    console.error("Get duel leaderboard error:", error);
    res.status(500).json({ error: "Failed to get duel leaderboard" });
  }
};

// Get weekly leaderboard (last 7 days activity)
export const getWeeklyLeaderboard = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Get recent duel activity
    const recentDuelStats = await DuelHistory.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      { $unwind: "$participants" },
      {
        $group: {
          _id: "$participants.userId",
          weeklyWins: {
            $sum: {
              $cond: [{ $eq: ["$participants.isWinner", true] }, 1, 0]
            }
          },
          weeklyDuels: { $sum: 1 }
        }
      }
    ]);
    
    // Get users and combine with weekly stats
    const users = await User.find({})
      .select("username firstName lastName profileImage stats")
      .lean();
    
    const weeklyStatsMap = new Map();
    recentDuelStats.forEach(stat => {
      weeklyStatsMap.set(stat._id.toString(), stat);
    });
    
    const weeklyLeaderboard = users
      .map(user => {
        const weeklyStat = weeklyStatsMap.get(user._id.toString());
        const weeklyScore = (weeklyStat?.weeklyWins || 0) * 20; // 20 points per weekly win
        
        return {
          id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage,
          weeklyScore: weeklyScore,
          weeklyWins: weeklyStat?.weeklyWins || 0,
          weeklyDuels: weeklyStat?.weeklyDuels || 0,
          totalXP: user.stats?.xp || 0,
        };
      })
      .filter(user => user.weeklyScore > 0) // Only show users with activity
      .sort((a, b) => b.weeklyScore - a.weeklyScore)
      .slice(skip, skip + parseInt(limit))
      .map((user, index) => ({
        ...user,
        rank: skip + index + 1,
      }));
    
    const total = users.filter(user => {
      const weeklyStat = weeklyStatsMap.get(user._id.toString());
      return (weeklyStat?.weeklyWins || 0) > 0;
    }).length;
    
    res.json({
      leaderboard: weeklyLeaderboard,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get weekly leaderboard error:", error);
    res.status(500).json({ error: "Failed to get weekly leaderboard" });
  }
};

// Get user's comprehensive stats
export const getUserStats = async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Get contest ranking
    const contestRanking = await ContestRanking.findOne({ userId: user._id });
    
    // Get duel stats
    const duelStats = await DuelHistory.aggregate([
      {
        $match: {
          "participants.userId": user._id
        }
      },
      { $unwind: "$participants" },
      {
        $match: {
          "participants.userId": user._id
        }
      },
      {
        $group: {
          _id: null,
          totalDuels: { $sum: 1 },
          wins: {
            $sum: {
              $cond: [{ $eq: ["$participants.isWinner", true] }, 1, 0]
            }
          },
          codingDuels: {
            $sum: {
              $cond: [{ $eq: ["$duelType", "coding"] }, 1, 0]
            }
          },
          typingDuels: {
            $sum: {
              $cond: [{ $eq: ["$duelType", "typing"] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    const duelStat = duelStats[0] || {
      totalDuels: 0,
      wins: 0,
      codingDuels: 0,
      typingDuels: 0
    };
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        stats: user.stats,
        bio: user.bio,
      },
      contest: {
        rating: contestRanking?.rating || 1200,
        maxRating: contestRanking?.maxRating || 1200,
        rank: contestRanking?.rank || 'Newbie',
        globalRank: contestRanking?.globalRank || null,
        contestsParticipated: contestRanking?.contestsParticipated || 0,
        contestsWon: contestRanking?.contestsWon || 0,
      },
      duels: {
        totalDuels: duelStat.totalDuels,
        wins: duelStat.wins,
        losses: duelStat.totalDuels - duelStat.wins,
        winRate: duelStat.totalDuels > 0 ? Math.round((duelStat.wins / duelStat.totalDuels) * 100) : 0,
        codingDuels: duelStat.codingDuels,
        typingDuels: duelStat.typingDuels,
      }
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({ error: "Failed to get user stats" });
  }
};
