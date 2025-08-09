import express from "express";
import {
  syncUser,
  getCurrentUser,
  updateProfile,
  getUserProfile,
  getLeaderboard,
  searchUsers,
  updateOnlineStatus,
} from "../controllers/userController.js";
import { requireAuth } from "@clerk/express";

const router = express.Router();

// Protected routes (require authentication)
router.post("/sync", requireAuth(), syncUser);
router.get("/me", requireAuth(), getCurrentUser);
router.put("/profile", requireAuth(), updateProfile);
router.put("/status", requireAuth(), updateOnlineStatus);

// Public routes
router.get("/profile/:identifier", getUserProfile);
router.get("/leaderboard", getLeaderboard);
router.get("/search", searchUsers);

export default router;
