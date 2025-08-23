/**
 * Quick Disqualification Utilities
 * 
 * This module provides utility functions for managing disqualifications
 * that can be imported and used in other scripts or admin endpoints.
 */

import redisContestUtils from '../utils/redisContestUtils.js';
import User from '../models/User.js';
import Contest from '../models/Contest.js';

export class DisqualificationUtils {
  
  /**
   * Get all disqualified users for a contest with detailed information
   * @param {string} contestId - Contest ID
   * @returns {Promise<Array>} Array of disqualified user objects
   */
  static async getDisqualifiedUsersWithDetails(contestId) {
    try {
      const disqualifiedUserIds = await redisContestUtils.getDisqualifiedUsers(contestId);
      const users = [];

      for (const userId of disqualifiedUserIds) {
        const user = await User.findById(userId).select('username firstName lastName email');
        const disqualificationData = await redisContestUtils.getUserDisqualificationData(contestId, userId);
        
        if (user) {
          users.push({
            userId: userId,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            disqualificationData: disqualificationData
          });
        }
      }

      return users;
    } catch (error) {
      console.error('Error getting disqualified users:', error);
      throw error;
    }
  }

  /**
   * Bulk disqualify multiple users
   * @param {string} contestId - Contest ID
   * @param {Array} userIds - Array of user IDs to disqualify
   * @param {string} reason - Reason for disqualification
   * @returns {Promise<Object>} Result object with success/failure counts
   */
  static async bulkDisqualify(contestId, userIds, reason) {
    const results = {
      successful: [],
      failed: [],
      alreadyDisqualified: []
    };

    for (const userId of userIds) {
      try {
        const isAlreadyDisqualified = await redisContestUtils.isUserDisqualified(contestId, userId);
        
        if (isAlreadyDisqualified) {
          results.alreadyDisqualified.push(userId);
          continue;
        }

        await redisContestUtils.disqualifyUser(contestId, userId, {
          reason: reason,
          timestamp: new Date(),
          violationType: 'BULK_ADMIN_ACTION',
          isVirtual: false
        });

        results.successful.push(userId);
      } catch (error) {
        results.failed.push({ userId, error: error.message });
      }
    }

    return results;
  }

  /**
   * Bulk remove disqualifications
   * @param {string} contestId - Contest ID
   * @param {Array} userIds - Array of user IDs to remove disqualification from
   * @returns {Promise<Object>} Result object with success/failure counts
   */
  static async bulkRemoveDisqualification(contestId, userIds) {
    const results = {
      successful: [],
      failed: [],
      notDisqualified: []
    };

    for (const userId of userIds) {
      try {
        const isDisqualified = await redisContestUtils.isUserDisqualified(contestId, userId);
        
        if (!isDisqualified) {
          results.notDisqualified.push(userId);
          continue;
        }

        await redisContestUtils.removeUserDisqualification(contestId, userId);
        results.successful.push(userId);
      } catch (error) {
        results.failed.push({ userId, error: error.message });
      }
    }

    return results;
  }

  /**
   * Get disqualification statistics for a contest
   * @param {string} contestId - Contest ID
   * @returns {Promise<Object>} Statistics object
   */
  static async getDisqualificationStats(contestId) {
    try {
      const contest = await Contest.findById(contestId);
      const disqualifiedUserIds = await redisContestUtils.getDisqualifiedUsers(contestId);
      
      const violationTypes = {};
      const timeDistribution = {};

      for (const userId of disqualifiedUserIds) {
        const data = await redisContestUtils.getUserDisqualificationData(contestId, userId);
        
        if (data) {
          // Count violation types
          const type = data.violationType || 'UNKNOWN';
          violationTypes[type] = (violationTypes[type] || 0) + 1;

          // Time distribution (by hour)
          if (data.timestamp) {
            const hour = new Date(data.timestamp).getHours();
            timeDistribution[hour] = (timeDistribution[hour] || 0) + 1;
          }
        }
      }

      return {
        contestId,
        contestTitle: contest?.title || 'Unknown',
        totalDisqualified: disqualifiedUserIds.length,
        totalParticipants: contest?.totalParticipants || 0,
        disqualificationRate: contest?.totalParticipants 
          ? ((disqualifiedUserIds.length / contest.totalParticipants) * 100).toFixed(2) + '%'
          : '0%',
        violationTypes,
        timeDistribution
      };
    } catch (error) {
      console.error('Error getting disqualification stats:', error);
      throw error;
    }
  }

  /**
   * Export disqualified users data to JSON
   * @param {string} contestId - Contest ID
   * @returns {Promise<Object>} Exportable data object
   */
  static async exportDisqualificationData(contestId) {
    try {
      const contest = await Contest.findById(contestId);
      const disqualifiedUsers = await this.getDisqualifiedUsersWithDetails(contestId);
      const stats = await this.getDisqualificationStats(contestId);

      return {
        exportDate: new Date().toISOString(),
        contest: {
          id: contestId,
          title: contest?.title || 'Unknown',
          startTime: contest?.startTime,
          endTime: contest?.endTime,
          status: contest?.status
        },
        statistics: stats,
        disqualifiedUsers: disqualifiedUsers
      };
    } catch (error) {
      console.error('Error exporting disqualification data:', error);
      throw error;
    }
  }

  /**
   * Validate contest and user IDs
   * @param {string} contestId - Contest ID
   * @param {string} userId - User ID (optional)
   * @returns {Promise<Object>} Validation result
   */
  static async validateIds(contestId, userId = null) {
    const result = {
      contestValid: false,
      userValid: false,
      contest: null,
      user: null
    };

    try {
      // Validate contest
      const contest = await Contest.findById(contestId);
      if (contest) {
        result.contestValid = true;
        result.contest = contest;
      }

      // Validate user if provided
      if (userId) {
        const user = await User.findById(userId);
        if (user) {
          result.userValid = true;
          result.user = user;
        }
      } else {
        result.userValid = true; // No user to validate
      }

      return result;
    } catch (error) {
      console.error('Error validating IDs:', error);
      throw error;
    }
  }
}

export default DisqualificationUtils;
