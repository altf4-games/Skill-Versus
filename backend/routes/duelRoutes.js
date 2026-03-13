import express from "express";
import { requireAuth } from "@clerk/express";

// Custom API-friendly auth middleware to prevent 302 redirects
const apiRequireAuth = (req, res, next) => {
  if (!req.auth || !req.auth.userId) {
    console.warn(`[Auth] Rejected API request to ${req.originalUrl}. Auth State:`, req.auth);
    return res.status(401).json({ error: "Unauthorized", message: "Missing or invalid authentication token" });
  }
  next();
};
import {
  createDuel,
  createTypingDuel,
  joinDuel,
  toggleReady,
  submitCode,
  sendChat,
  getRoom,
  updateTypingProgress,
  finishTyping,
  reportAntiCheat,
} from "../controllers/roomController.js";
import Problem from "../models/Problem.js";

const router = express.Router();

// Get all problems (for duel problem list)
router.get("/problems/list", requireAuth(), async (_req, res) => {
  try {
    const problems = await Problem.find({ isActive: true })
      .select("title difficulty description examples constraints")
      .sort({ difficulty: 1 });
    res.json({ problems });
  } catch (error) {
    console.error("Get problems error:", error);
    res.status(500).json({ error: "Failed to get problems" });
  }
});

// Room management
router.post("/create", apiRequireAuth, createDuel);

// Test bypass route for debugging Clerk
router.post("/create-test", async (req, res, next) => {
  req.auth = { userId: "user_2l7T9kC71m3" }; // we will get the first user ID from DB in controller
  const User = (await import("../models/User.js")).default;
  const user = await User.findOne();
  if (user) req.auth.userId = user.clerkId;
  next();
}, createDuel);

router.post("/create-typing", apiRequireAuth, createTypingDuel);
router.get("/room/:roomCode", apiRequireAuth, getRoom);
router.post("/join/:roomCode", apiRequireAuth, joinDuel);
router.post("/ready/:roomCode", apiRequireAuth, toggleReady);
router.post("/submit/:roomCode", apiRequireAuth, submitCode);
router.post("/typing-progress/:roomCode", apiRequireAuth, updateTypingProgress);
router.post("/typing-finish/:roomCode", apiRequireAuth, finishTyping);
router.post("/chat/:roomCode", apiRequireAuth, sendChat);
router.post("/anti-cheat/:roomCode", apiRequireAuth, reportAntiCheat);

export default router;
