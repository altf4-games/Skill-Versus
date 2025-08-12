import express from "express";
import {
  seedTwoSumProblem,
  getAllProblems,
  getProblemById,
} from "../controllers/problemController.js";

const router = express.Router();

// Seed Two Sum problem
router.post("/seed-two-sum", seedTwoSumProblem);

// Get all problems
router.get("/", getAllProblems);

// Get problem by ID
router.get("/:id", getProblemById);

export default router;
