import express from "express";
import { requireAuth } from "@clerk/express";
import Problem from "../models/Problem.js";

const router = express.Router();

// Get all problems
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

export default router;
