import express from "express";
import { requireAuth } from "@clerk/express";
import {
  getGlobalRankings,
  getUserRanking,
  getUserRankingByUsername,
  getRankingStats,
  getUserRatingHistory,
  searchUsersByRating,
  getRankDistribution,
} from "../controllers/contestRankingController.js";

const router = express.Router();

// Public routes
router.get("/", getGlobalRankings);
router.get("/stats", getRankingStats);
router.get("/distribution", getRankDistribution);
router.get("/search", searchUsersByRating);
router.get("/user/:username", getUserRankingByUsername);

// Protected routes (require authentication)
router.get("/me", requireAuth(), getUserRanking);
router.get("/me/history", requireAuth(), getUserRatingHistory);

export default router;
