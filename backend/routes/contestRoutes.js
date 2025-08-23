import express from "express";
import { requireAuth } from "@clerk/express";
import {
  getAllContests,
  getContestDetails,
  createContest,
  registerForContest,
  getContestLeaderboard,
  getUserContestSubmissions,
  startVirtualContest,
  updateContestStatus,
  getContestProblems,
  getVirtualContestRankings,
  getDisqualificationStatus,
  handleAntiCheatViolation,
} from "../controllers/contestController.js";
import {
  submitContestCode,
  getSubmissionStatus,
} from "../controllers/contestSubmissionController.js";

const router = express.Router();

// Public routes
router.get("/", getAllContests);
router.get("/:contestId", getContestDetails);
router.get("/:contestId/leaderboard", getContestLeaderboard);

// Protected routes (require authentication)
router.post("/", requireAuth(), createContest);
router.post("/:contestId/register", requireAuth(), registerForContest);
router.get("/:contestId/problems", requireAuth(), getContestProblems);
router.get("/:contestId/submissions", requireAuth(), getUserContestSubmissions);
router.post("/:contestId/virtual/start", requireAuth(), startVirtualContest);
router.get("/:contestId/virtual/rankings", getVirtualContestRankings);

// Submission routes
router.post("/:contestId/problems/:problemId/submit", requireAuth(), submitContestCode);
router.get("/submissions/:submissionId", requireAuth(), getSubmissionStatus);

// Anti-cheat routes
router.get("/:contestId/disqualification-status", requireAuth(), getDisqualificationStatus);
router.post("/:contestId/anti-cheat-violation", requireAuth(), handleAntiCheatViolation);

// Admin routes
router.patch("/:contestId/status", requireAuth(), updateContestStatus);

export default router;
