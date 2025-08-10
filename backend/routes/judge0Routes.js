import express from "express";
import * as judge0Controller from "../controllers/judge0Controller.js";

const router = express.Router();

// Get available programming languages
router.get("/languages", judge0Controller.getLanguages);

// Submit code for execution (synchronous - waits for result)
router.post("/execute", judge0Controller.submitCode);

// Submit code for execution (asynchronous - returns token immediately)
router.post("/submit", judge0Controller.submitCodeAsync);

// Get submission result by token
router.get("/submission/:token", judge0Controller.getSubmission);

// Get multiple submissions by tokens
router.get("/submissions/batch", judge0Controller.getBatchSubmissions);

export default router;
