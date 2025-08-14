import express from "express";
import userRoutes from "./userRoutes.js";
import judge0Routes from "./judge0Routes.js";
import duelRoutes from "./duelRoutes.js";
import problemRoutes from "./problemRoutes.js";
import typingTextRoutes from "./typingTextRoutes.js";
import practiceRoutes from "./practiceRoutes.js";

const router = express.Router();

// API routes
router.use("/users", userRoutes);
router.use("/judge0", judge0Routes);
router.use("/duels", duelRoutes);
router.use("/problems", problemRoutes);
router.use("/typing-texts", typingTextRoutes);
router.use("/practice", practiceRoutes);

// Health check endpoint
router.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "SkillVersus API is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;
