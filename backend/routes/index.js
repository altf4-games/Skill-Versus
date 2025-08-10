import express from "express";
import userRoutes from "./userRoutes.js";
import judge0Routes from "./judge0Routes.js";
import roomRoutes from "./roomRoutes.js";

const router = express.Router();

// API routes
router.use("/users", userRoutes);
router.use("/judge0", judge0Routes);
router.use("/rooms", roomRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "SkillVersus API is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;
