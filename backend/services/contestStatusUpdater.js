import Contest from '../models/Contest.js';
import { generateLeaderboard } from '../controllers/contestController.js';
import ratingService from './ratingService.js';
import redisContestUtils from '../utils/redisContestUtils.js';

/**
 * Background service to update contest statuses in real-time
 * Automatically transitions contests from upcoming -> active -> finished
 * Handles final processing when contests end
 */
class ContestStatusUpdater {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.updateInterval = 30000; // Check every 30 seconds
  }

  async start() {
    if (this.isRunning) {
      console.log("Contest status updater is already running");
      return;
    }

    this.isRunning = true;
    console.log("Starting contest status updater...");

    // Start update loop
    this.intervalId = setInterval(async () => {
      try {
        await this.updateAllContestStatuses();
      } catch (error) {
        console.error("Contest status updater error:", error);
      }
    }, this.updateInterval);

    console.log(`Contest status updater started - checking every ${this.updateInterval}ms`);
  }

  async stop() {
    if (!this.isRunning) {
      console.log("Contest status updater is not running");
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log("Contest status updater stopped");
  }

  async updateAllContestStatuses() {
    if (!this.isRunning) return;

    try {
      const now = new Date();
      
      // Find contests that need status updates
      const contestsToUpdate = await Contest.find({
        isActive: true,
        $or: [
          // Upcoming contests that should be active
          {
            status: 'upcoming',
            startTime: { $lte: now }
          },
          // Active contests that should be finished
          {
            status: 'active',
            endTime: { $lte: now }
          }
        ]
      });

      console.log(`Found ${contestsToUpdate.length} contests needing status updates`);

      for (const contest of contestsToUpdate) {
        await this.updateContestStatus(contest, now);
      }

    } catch (error) {
      console.error("Error updating contest statuses:", error);
    }
  }

  async updateContestStatus(contest, now = new Date()) {
    const oldStatus = contest.status;
    let newStatus;

    // Determine new status
    if (now < contest.startTime) {
      newStatus = 'upcoming';
    } else if (now <= contest.endTime) {
      newStatus = 'active';
    } else {
      newStatus = 'finished';
    }

    // Only update if status changed
    if (oldStatus === newStatus) {
      return;
    }

    console.log(`Contest ${contest.title} (${contest._id}): ${oldStatus} -> ${newStatus}`);

    // Update status
    contest.status = newStatus;
    await contest.save();

    // Handle status-specific actions
    if (newStatus === 'active') {
      await this.handleContestStart(contest);
    } else if (newStatus === 'finished') {
      await this.handleContestEnd(contest);
    }
  }

  async handleContestStart(contest) {
    console.log(`Contest started: ${contest.title}`);
    
    // Initialize Redis data for real-time leaderboard
    try {
      await redisContestUtils.initializeContest(contest._id.toString());
    } catch (error) {
      console.warn("Failed to initialize Redis for contest:", error.message);
    }
  }

  async handleContestEnd(contest) {
    console.log(`Contest finished: ${contest.title}`);
    
    try {
      // Generate final leaderboard
      const finalStandings = await generateLeaderboard(contest._id.toString());
      
      // Save final standings to contest
      contest.finalStandings = finalStandings;
      contest.totalParticipants = finalStandings.length;
      await contest.save();

      console.log(`Final standings saved for contest ${contest.title}: ${finalStandings.length} participants`);

      // Update CP ratings for all participants
      if (finalStandings.length > 0) {
        await ratingService.updateContestRatings(contest._id.toString(), finalStandings);
        console.log(`CP ratings updated for contest ${contest.title}`);
      }

      // Clean up Redis data after a delay
      setTimeout(async () => {
        try {
          await redisContestUtils.deleteContestData(contest._id.toString());
          console.log(`Redis data cleaned up for contest ${contest.title}`);
        } catch (error) {
          console.error("Failed to cleanup Redis data:", error);
        }
      }, 300000); // 5 minute delay

    } catch (error) {
      console.error(`Error handling contest end for ${contest.title}:`, error);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      updateInterval: this.updateInterval,
    };
  }
}

// Create singleton instance
const contestStatusUpdater = new ContestStatusUpdater();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down contest status updater...');
  await contestStatusUpdater.stop();
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down contest status updater...');
  await contestStatusUpdater.stop();
});

export default contestStatusUpdater;
