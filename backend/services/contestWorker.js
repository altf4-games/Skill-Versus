import { processSubmissionQueue } from "../controllers/contestSubmissionController.js";
import redisContestUtils from "../utils/redisContestUtils.js";

/**
 * Background worker service for processing contest submissions
 * Runs continuously to process submissions from Redis queue
 */
class ContestWorker {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.processingInterval = 2000; // Process every 2 seconds
  }

  async start() {
    if (this.isRunning) {
      console.log("Contest worker is already running");
      return;
    }

    // Check if Redis is available
    const redisAvailable = await redisContestUtils.isRedisAvailable();
    if (!redisAvailable) {
      console.warn("Redis not available - contest worker disabled");
      return;
    }

    this.isRunning = true;
    console.log("Starting contest submission worker...");

    // Start processing loop
    this.intervalId = setInterval(async () => {
      try {
        await this.processSubmissions();
      } catch (error) {
        console.error("Contest worker error:", error);
      }
    }, this.processingInterval);

    console.log(`Contest worker started - processing every ${this.processingInterval}ms`);
  }

  async stop() {
    if (!this.isRunning) {
      console.log("Contest worker is not running");
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log("Contest worker stopped");
  }

  async processSubmissions() {
    if (!this.isRunning) return;

    try {
      // Process one submission from the queue
      await processSubmissionQueue();
    } catch (error) {
      console.error("Error processing submission:", error);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      processingInterval: this.processingInterval,
    };
  }
}

// Create singleton instance
const contestWorker = new ContestWorker();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down contest worker...');
  await contestWorker.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down contest worker...');
  await contestWorker.stop();
  process.exit(0);
});

export default contestWorker;
