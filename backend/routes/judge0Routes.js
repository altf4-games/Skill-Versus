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

// Run code with sample test cases (for practice/run button)
router.post("/run-tests", judge0Controller.runCodeWithTests);

// Submit code with all test cases (for submission)
router.post("/submit-tests", judge0Controller.submitCodeWithTests);

export default router;
