import express from "express";
import userRoutes from "./userRoutes.js";

const router = express.Router();

// API routes
router.use("/users", userRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "SkillVersus API is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;
