import express from "express";
import {
  syncUser,
  getCurrentUser,
  updateProfile,
  getUserProfile,
  getLeaderboard,
  searchUsers,
  updateOnlineStatus,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriends,
  getFriendRequests,
  getDuelHistory,
} from "../controllers/userController.js";
import { requireAuth } from "@clerk/express";

const router = express.Router();

// Protected routes (require authentication)
router.post("/sync", requireAuth(), syncUser);
router.get("/me", requireAuth(), getCurrentUser);
router.put("/profile", requireAuth(), updateProfile);
router.put("/status", requireAuth(), updateOnlineStatus);
router.get("/duel-history", requireAuth(), getDuelHistory);

// Friends routes (protected)
router.post("/friends/request", requireAuth(), sendFriendRequest);
router.post("/friends/accept", requireAuth(), acceptFriendRequest);
router.post("/friends/reject", requireAuth(), rejectFriendRequest);
router.delete("/friends/:friendId", requireAuth(), removeFriend);
router.get("/friends", requireAuth(), getFriends);
router.get("/friends/requests", requireAuth(), getFriendRequests);

// Public routes
router.get("/profile/:identifier", getUserProfile);
router.get("/leaderboard", getLeaderboard);
router.get("/search", searchUsers);

export default router;
