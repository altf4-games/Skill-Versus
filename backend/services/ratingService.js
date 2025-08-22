import ContestRanking from "../models/ContestRanking.js";

/**
 * Rating calculation service for competitive programming contests
 * Uses ELO-based rating system similar to Codeforces
 */

class RatingService {
  constructor() {
    this.K_FACTOR = 32; // Rating change multiplier
    this.INITIAL_RATING = 1200;
  }

  /**
   * Calculate expected score for a user against all other participants
   * @param {number} userRating - User's current rating
   * @param {Array} allRatings - Array of all participants' ratings
   * @returns {number} Expected score (0-1)
   */
  calculateExpectedScore(userRating, allRatings) {
    let expectedScore = 0;
    
    for (const opponentRating of allRatings) {
      if (opponentRating !== userRating) {
        expectedScore += 1 / (1 + Math.pow(10, (opponentRating - userRating) / 400));
      }
    }
    
    return expectedScore / (allRatings.length - 1);
  }

  /**
   * Calculate actual score based on rank
   * @param {number} rank - User's rank in contest (1-based)
   * @param {number} totalParticipants - Total number of participants
   * @returns {number} Actual score (0-1)
   */
  calculateActualScore(rank, totalParticipants) {
    return (totalParticipants - rank) / (totalParticipants - 1);
  }

  /**
   * Calculate rating change for a single user
   * @param {number} currentRating - User's current rating
   * @param {number} rank - User's rank in contest
   * @param {Array} allRatings - All participants' ratings
   * @returns {number} Rating change (can be negative)
   */
  calculateRatingChange(currentRating, rank, allRatings) {
    const totalParticipants = allRatings.length;
    
    if (totalParticipants < 2) {
      return 0; // No rating change for contests with less than 2 participants
    }
    
    const expectedScore = this.calculateExpectedScore(currentRating, allRatings);
    const actualScore = this.calculateActualScore(rank, totalParticipants);
    
    // Apply volatility factor for new users
    let kFactor = this.K_FACTOR;
    if (currentRating === this.INITIAL_RATING) {
      kFactor = this.K_FACTOR * 2; // Double K-factor for new users
    }
    
    const ratingChange = Math.round(kFactor * (actualScore - expectedScore));
    
    // Ensure minimum rating of 0
    const newRating = Math.max(0, currentRating + ratingChange);
    return newRating - currentRating;
  }

  /**
   * Update ratings for all contest participants
   * @param {string} contestId - Contest ID
   * @param {Array} finalStandings - Array of final standings with userId, rank, etc.
   * @returns {Promise<Array>} Array of rating updates
   */
  async updateContestRatings(contestId, finalStandings) {
    try {
      // Get current ratings for all participants
      const userIds = finalStandings.map(standing => standing.userId);
      const currentRankings = await ContestRanking.find({
        userId: { $in: userIds }
      });
      
      // Create rating map
      const ratingMap = new Map();
      currentRankings.forEach(ranking => {
        ratingMap.set(ranking.userId.toString(), ranking.rating);
      });
      
      // Fill in default ratings for new users
      const allRatings = [];
      finalStandings.forEach(standing => {
        const userId = standing.userId.toString();
        const rating = ratingMap.get(userId) || this.INITIAL_RATING;
        ratingMap.set(userId, rating);
        allRatings.push(rating);
      });
      
      // Calculate rating changes
      const ratingUpdates = [];
      
      for (let i = 0; i < finalStandings.length; i++) {
        const standing = finalStandings[i];
        const userId = standing.userId.toString();
        const currentRating = ratingMap.get(userId);
        const ratingChange = this.calculateRatingChange(currentRating, standing.rank, allRatings);
        const newRating = currentRating + ratingChange;
        
        ratingUpdates.push({
          userId: standing.userId,
          username: standing.username,
          oldRating: currentRating,
          newRating: newRating,
          ratingChange: ratingChange,
          rank: standing.rank,
          totalParticipants: finalStandings.length,
          problemsSolved: standing.problemsSolved,
          totalScore: standing.totalScore,
        });
      }
      
      // Update database
      await this.saveRatingUpdates(contestId, ratingUpdates);
      
      return ratingUpdates;
    } catch (error) {
      console.error("Update contest ratings error:", error);
      throw error;
    }
  }

  /**
   * Save rating updates to database
   * @param {string} contestId - Contest ID
   * @param {Array} ratingUpdates - Array of rating update objects
   */
  async saveRatingUpdates(contestId, ratingUpdates) {
    const bulkOps = [];
    
    for (const update of ratingUpdates) {
      // Upsert contest ranking
      bulkOps.push({
        updateOne: {
          filter: { userId: update.userId },
          update: {
            $set: {
              username: update.username,
              rating: update.newRating,
              maxRating: { $max: update.newRating },
              lastUpdated: new Date(),
            },
            $inc: {
              contestsParticipated: 1,
              ...(update.rank === 1 && { contestsWon: 1 }),
            },
            $push: {
              recentPerformances: {
                $each: [{
                  contestId: contestId,
                  contestTitle: `Contest ${contestId}`, // Will be updated with actual title
                  rank: update.rank,
                  totalParticipants: update.totalParticipants,
                  ratingChange: update.ratingChange,
                  newRating: update.newRating,
                  problemsSolved: update.problemsSolved,
                  totalScore: update.totalScore,
                  contestDate: new Date(),
                }],
                $slice: -10, // Keep only last 10 performances
              },
            },
          },
          upsert: true,
        },
      });
    }
    
    if (bulkOps.length > 0) {
      await ContestRanking.bulkWrite(bulkOps);
    }
    
    // Update global ranks
    await this.updateGlobalRanks();
  }

  /**
   * Update global ranking positions
   */
  async updateGlobalRanks() {
    try {
      const rankings = await ContestRanking.find({ isActive: true })
        .sort({ rating: -1 })
        .select('_id rating');
      
      const bulkOps = rankings.map((ranking, index) => ({
        updateOne: {
          filter: { _id: ranking._id },
          update: { $set: { globalRank: index + 1 } },
        },
      }));
      
      if (bulkOps.length > 0) {
        await ContestRanking.bulkWrite(bulkOps);
      }
    } catch (error) {
      console.error("Update global ranks error:", error);
    }
  }

  /**
   * Get contest rankings leaderboard
   * @param {number} limit - Number of users to return
   * @param {number} skip - Number of users to skip
   * @returns {Promise<Array>} Array of top-rated users
   */
  async getGlobalRankings(limit = 50, skip = 0) {
    try {
      return await ContestRanking.find({ isActive: true })
        .sort({ rating: -1 })
        .skip(skip)
        .limit(limit)
        .select('userId username rating maxRating rank globalRank contestsParticipated contestsWon')
        .lean();
    } catch (error) {
      console.error("Get global rankings error:", error);
      throw error;
    }
  }

  /**
   * Get user's contest ranking
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User's ranking data
   */
  async getUserRanking(userId) {
    try {
      return await ContestRanking.findOne({ userId, isActive: true }).lean();
    } catch (error) {
      console.error("Get user ranking error:", error);
      throw error;
    }
  }

  /**
   * Initialize ranking for new user
   * @param {string} userId - User ID
   * @param {string} username - Username
   * @returns {Promise<Object>} Created ranking
   */
  async initializeUserRanking(userId, username) {
    try {
      const ranking = new ContestRanking({
        userId,
        username,
        rating: this.INITIAL_RATING,
        maxRating: this.INITIAL_RATING,
      });
      
      await ranking.save();
      await this.updateGlobalRanks();
      
      return ranking;
    } catch (error) {
      console.error("Initialize user ranking error:", error);
      throw error;
    }
  }
}

export default new RatingService();
