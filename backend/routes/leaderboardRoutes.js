import express from "express";
import { requireAuth } from "@clerk/express";
import {
  getGlobalLeaderboard,
  getContestLeaderboard,
  getDuelLeaderboard,
  getWeeklyLeaderboard,
  getUserStats,
} from "../controllers/leaderboardController.js";

const router = express.Router();

// Public routes
router.get("/global", getGlobalLeaderboard);
router.get("/contests", getContestLeaderboard);
router.get("/duels", getDuelLeaderboard);
router.get("/weekly", getWeeklyLeaderboard);

// Protected routes (require authentication)
router.get("/me/stats", requireAuth(), getUserStats);

export default router;
