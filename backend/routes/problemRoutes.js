import express from "express";
import { requireAuth } from "@clerk/express";
import {
  seedTwoSumProblem,
  createProblem,
  getAllProblems,
  getProblemById,
} from "../controllers/problemController.js";

const router = express.Router();

// Seed Two Sum problem
router.post("/seed-two-sum", seedTwoSumProblem);

// Create a new problem (admin only)
router.post("/", requireAuth(), createProblem);

// Get all problems
router.get("/", getAllProblems);

// Get problem by ID
router.get("/:id", getProblemById);

export default router;
