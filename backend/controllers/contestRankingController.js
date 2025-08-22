import ContestRanking from "../models/ContestRanking.js";
import User from "../models/User.js";
import ratingService from "../services/ratingService.js";

// Get global contest rankings
export const getGlobalRankings = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    
    const rankings = await ratingService.getGlobalRankings(parseInt(limit), skip);
    const total = await ContestRanking.countDocuments({ isActive: true });
    
    res.json({
      rankings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get global rankings error:", error);
    res.status(500).json({ error: "Failed to get rankings" });
  }
};

// Get user's contest ranking
export const getUserRanking = async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    let ranking = await ratingService.getUserRanking(user._id);
    
    // Initialize ranking if user doesn't have one
    if (!ranking) {
      ranking = await ratingService.initializeUserRanking(user._id, user.username);
    }
    
    res.json({ ranking });
  } catch (error) {
    console.error("Get user ranking error:", error);
    res.status(500).json({ error: "Failed to get user ranking" });
  }
};

// Get specific user's ranking by username
export const getUserRankingByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const ranking = await ratingService.getUserRanking(user._id);
    if (!ranking) {
      return res.status(404).json({ error: "User ranking not found" });
    }
    
    res.json({ ranking });
  } catch (error) {
    console.error("Get user ranking by username error:", error);
    res.status(500).json({ error: "Failed to get user ranking" });
  }
};

// Get ranking statistics
export const getRankingStats = async (req, res) => {
  try {
    const stats = await ContestRanking.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$rank",
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" },
          minRating: { $min: "$rating" },
          maxRating: { $max: "$rating" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    
    const totalUsers = await ContestRanking.countDocuments({ isActive: true });
    const totalContests = await ContestRanking.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, totalContests: { $sum: "$contestsParticipated" } } },
    ]);
    
    const topRated = await ContestRanking.find({ isActive: true })
      .sort({ rating: -1 })
      .limit(10)
      .select("username rating rank")
      .lean();
    
    res.json({
      stats: {
        totalUsers,
        totalContests: totalContests[0]?.totalContests || 0,
        rankDistribution: stats,
        topRated,
      },
    });
  } catch (error) {
    console.error("Get ranking stats error:", error);
    res.status(500).json({ error: "Failed to get ranking statistics" });
  }
};

// Get user's rating history
export const getUserRatingHistory = async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const ranking = await ContestRanking.findOne({ userId: user._id })
      .select("ratingHistory recentPerformances")
      .lean();
    
    if (!ranking) {
      return res.json({ 
        ratingHistory: [], 
        recentPerformances: [] 
      });
    }
    
    res.json({
      ratingHistory: ranking.ratingHistory || [],
      recentPerformances: ranking.recentPerformances || [],
    });
  } catch (error) {
    console.error("Get user rating history error:", error);
    res.status(500).json({ error: "Failed to get rating history" });
  }
};

// Search users by rating range
export const searchUsersByRating = async (req, res) => {
  try {
    const { minRating = 0, maxRating = 4000, rank, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {
      isActive: true,
      rating: { $gte: parseInt(minRating), $lte: parseInt(maxRating) },
    };
    
    if (rank) {
      query.rank = rank;
    }
    
    const users = await ContestRanking.find(query)
      .sort({ rating: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("username rating maxRating rank globalRank contestsParticipated")
      .lean();
    
    const total = await ContestRanking.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Search users by rating error:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
};

// Get rank distribution
export const getRankDistribution = async (req, res) => {
  try {
    const distribution = await ContestRanking.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$rank",
          count: { $sum: 1 },
          percentage: {
            $multiply: [
              { $divide: [{ $sum: 1 }, { $sum: 1 }] },
              100
            ]
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const totalUsers = await ContestRanking.countDocuments({ isActive: true });
    
    // Calculate actual percentages
    const distributionWithPercentages = distribution.map(item => ({
      ...item,
      percentage: ((item.count / totalUsers) * 100).toFixed(2)
    }));
    
    res.json({
      distribution: distributionWithPercentages,
      totalUsers
    });
  } catch (error) {
    console.error("Get rank distribution error:", error);
    res.status(500).json({ error: "Failed to get rank distribution" });
  }
};
