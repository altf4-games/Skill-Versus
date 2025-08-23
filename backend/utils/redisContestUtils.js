import { getRedisClient } from "../db/connection.js";

/**
 * Redis utility functions for contest management
 * All contest data is stored with TTL = contest duration + 1 hour buffer
 */

class RedisContestUtils {
  constructor() {
    this.redis = null;
  }

  async init() {
    this.redis = getRedisClient();
    if (!this.redis) {
      throw new Error("Redis client not available");
    }
  }

  // Contest Keys
  getContestKey(contestId) {
    return `contest:${contestId}`;
  }

  getContestParticipantsKey(contestId) {
    return `contest:${contestId}:participants`;
  }

  getContestSubmissionsKey(contestId) {
    return `contest:${contestId}:submissions`;
  }

  getContestLeaderboardKey(contestId) {
    return `contest:${contestId}:leaderboard`;
  }

  getSubmissionQueueKey() {
    return `contest:submission_queue`;
  }

  getUserSubmissionsKey(contestId, userId) {
    return `contest:${contestId}:user:${userId}:submissions`;
  }

  getUserContestDataKey(contestId, userId) {
    return `contest:${contestId}:user:${userId}:data`;
  }

  getDisqualifiedUsersKey(contestId) {
    return `contest:${contestId}:disqualified`;
  }

  getUserDisqualificationKey(contestId, userId) {
    return `contest:${contestId}:user:${userId}:disqualified`;
  }

  // Contest Management
  async setContestData(contestId, contestData, ttlSeconds) {
    if (!this.redis) await this.init();
    const key = this.getContestKey(contestId);
    await this.redis.setEx(key, ttlSeconds, JSON.stringify(contestData));
  }

  async getContestData(contestId) {
    if (!this.redis) await this.init();
    const key = this.getContestKey(contestId);
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteContestData(contestId) {
    if (!this.redis) await this.init();
    const keys = [
      this.getContestKey(contestId),
      this.getContestParticipantsKey(contestId),
      this.getContestSubmissionsKey(contestId),
      this.getContestLeaderboardKey(contestId),
    ];
    
    // Also delete all user-specific keys
    const userKeys = await this.redis.keys(`contest:${contestId}:user:*`);
    keys.push(...userKeys);
    
    if (keys.length > 0) {
      await this.redis.del(keys);
    }
  }

  // Participant Management
  async addParticipant(contestId, userId, userData, ttlSeconds) {
    if (!this.redis) await this.init();
    const key = this.getContestParticipantsKey(contestId);
    await this.redis.hSet(key, userId, JSON.stringify(userData));
    await this.redis.expire(key, ttlSeconds);
  }

  async getParticipants(contestId) {
    if (!this.redis) await this.init();
    const key = this.getContestParticipantsKey(contestId);
    const participants = await this.redis.hGetAll(key);
    const result = {};
    for (const [userId, data] of Object.entries(participants)) {
      result[userId] = JSON.parse(data);
    }
    return result;
  }

  async isParticipant(contestId, userId) {
    if (!this.redis) await this.init();
    const key = this.getContestParticipantsKey(contestId);
    return await this.redis.hExists(key, userId);
  }

  // Submission Management
  async addSubmissionToQueue(submissionData) {
    if (!this.redis) await this.init();
    const key = this.getSubmissionQueueKey();
    await this.redis.lPush(key, JSON.stringify(submissionData));
  }

  async getSubmissionFromQueue() {
    if (!this.redis) await this.init();
    const key = this.getSubmissionQueueKey();
    const submission = await this.redis.brPop(key, 1); // 1 second timeout
    return submission ? JSON.parse(submission.element) : null;
  }

  async addUserSubmission(contestId, userId, problemId, submissionData, ttlSeconds) {
    if (!this.redis) await this.init();
    const key = this.getUserSubmissionsKey(contestId, userId);
    const submissionKey = `${problemId}:${Date.now()}`;
    await this.redis.hSet(key, submissionKey, JSON.stringify(submissionData));
    await this.redis.expire(key, ttlSeconds);
  }

  async getUserSubmissions(contestId, userId) {
    if (!this.redis) await this.init();
    const key = this.getUserSubmissionsKey(contestId, userId);
    const submissions = await this.redis.hGetAll(key);
    const result = {};
    for (const [submissionKey, data] of Object.entries(submissions)) {
      result[submissionKey] = JSON.parse(data);
    }
    return result;
  }

  // Leaderboard Management
  async updateLeaderboard(contestId, leaderboardData, ttlSeconds) {
    if (!this.redis) await this.init();
    const key = this.getContestLeaderboardKey(contestId);
    await this.redis.setEx(key, ttlSeconds, JSON.stringify(leaderboardData));
  }

  async getLeaderboard(contestId) {
    if (!this.redis) await this.init();
    const key = this.getContestLeaderboardKey(contestId);
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  // User Contest Data (current scores, penalties, etc.)
  async setUserContestData(contestId, userId, userData, ttlSeconds) {
    if (!this.redis) await this.init();
    const key = this.getUserContestDataKey(contestId, userId);
    await this.redis.setEx(key, ttlSeconds, JSON.stringify(userData));
  }

  async getUserContestData(contestId, userId) {
    if (!this.redis) await this.init();
    const key = this.getUserContestDataKey(contestId, userId);
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  // Utility functions
  async getAllContestKeys(contestId) {
    if (!this.redis) await this.init();
    return await this.redis.keys(`contest:${contestId}*`);
  }

  async isRedisAvailable() {
    try {
      if (!this.redis) await this.init();
      await this.redis.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Disqualification Management
  async disqualifyUser(contestId, userId, disqualificationData) {
    if (!this.redis) await this.init();

    // Add to disqualified users set
    const disqualifiedKey = this.getDisqualifiedUsersKey(contestId);
    await this.redis.sAdd(disqualifiedKey, userId);

    // Store disqualification details
    const userDisqualificationKey = this.getUserDisqualificationKey(contestId, userId);
    await this.redis.setEx(userDisqualificationKey, 86400 * 7, JSON.stringify(disqualificationData)); // 7 days TTL

    // Set TTL for disqualified users set
    await this.redis.expire(disqualifiedKey, 86400 * 7); // 7 days TTL
  }

  async isUserDisqualified(contestId, userId) {
    if (!this.redis) await this.init();
    const key = this.getDisqualifiedUsersKey(contestId);
    return await this.redis.sIsMember(key, userId);
  }

  async getUserDisqualificationData(contestId, userId) {
    if (!this.redis) await this.init();
    const key = this.getUserDisqualificationKey(contestId, userId);
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async removeUserDisqualification(contestId, userId) {
    if (!this.redis) await this.init();

    // Remove from disqualified users set
    const disqualifiedKey = this.getDisqualifiedUsersKey(contestId);
    await this.redis.sRem(disqualifiedKey, userId);

    // Remove disqualification details
    const userDisqualificationKey = this.getUserDisqualificationKey(contestId, userId);
    await this.redis.del(userDisqualificationKey);
  }

  async getDisqualifiedUsers(contestId) {
    if (!this.redis) await this.init();
    const key = this.getDisqualifiedUsersKey(contestId);
    return await this.redis.sMembers(key);
  }
}

export default new RedisContestUtils();
