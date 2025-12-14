import express from "express";
import { requireAuth } from "@clerk/express";
import {
  checkContestAdmin,
  createContestProblem,
  createContest,
  getAllProblems,
  getAllContests,
  getLiveLeaderboard,
  getDisqualifiedUsers,
  disqualifyUser,
  removeDisqualification,
  clearAllDisqualifications,
  toggleProblemContestOnly,
  getAdminUsers,
  grantAdminPrivileges,
  revokeAdminPrivileges,
  getContestStats,
} from "../controllers/adminController.js";

const router = express.Router();

// All routes require authentication and admin privileges
router.use(requireAuth());
router.use(checkContestAdmin);

// Problem management
router.post("/problems", createContestProblem);
router.get("/problems", getAllProblems);
router.patch("/problems/:problemId/contest-only", toggleProblemContestOnly);

// Contest management
router.post("/contests", createContest);
router.get("/contests", getAllContests);
router.get("/contests/:contestId/stats", getContestStats);
router.get("/contests/:contestId/leaderboard", getLiveLeaderboard);

// Disqualification management
router.get("/contests/:contestId/disqualified", getDisqualifiedUsers);
router.post("/contests/:contestId/disqualify", disqualifyUser);
router.delete(
  "/contests/:contestId/disqualified/:userId",
  removeDisqualification
);
router.delete("/contests/:contestId/disqualified", clearAllDisqualifications);

// Admin user management
router.get("/admins", getAdminUsers);
router.post("/admins/:userId/grant", grantAdminPrivileges);
router.post("/admins/:userId/revoke", revokeAdminPrivileges);

export default router;
