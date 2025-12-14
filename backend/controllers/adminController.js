import Contest from "../models/Contest.js";
import Problem from "../models/Problem.js";
import User from "../models/User.js";
import ContestRanking from "../models/ContestRanking.js";
import redisContestUtils from "../utils/redisContestUtils.js";

// Middleware to check if user is contest admin
export const checkContestAdmin = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const user = await User.findOne({ clerkId: userId });

    if (!user || !user.contestAdmin) {
      return res
        .status(403)
        .json({ error: "Access denied. Contest admin required." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Check admin error:", error);
    res.status(500).json({ error: "Failed to verify admin status" });
  }
};

// Create a contest-only problem
export const createContestProblem = async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      timeLimit,
      memoryLimit,
      tags,
      examples,
      testCases,
      functionSignatures,
      driverCode,
      constraints,
    } = req.body;

    // Validate required fields
    if (!title || !description || !examples || !testCases) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if problem with same title already exists
    const existingProblem = await Problem.findOne({ title });
    if (existingProblem) {
      return res
        .status(400)
        .json({ error: "Problem with this title already exists" });
    }

    // Transform testCases to match model schema
    const transformedTestCases = testCases.map((tc) => ({
      input: tc.input,
      expectedOutput: tc.output || tc.expectedOutput,
      isHidden: tc.isHidden || false,
    }));

    // Create problem
    const problem = new Problem({
      title,
      description,
      difficulty: difficulty || "Easy",
      timeLimit: timeLimit || 2000,
      memoryLimit: memoryLimit || 256,
      tags: tags || [],
      isContestOnly: true, // Always set to true for admin-created problems
      examples,
      testCases: transformedTestCases,
      functionSignatures: functionSignatures || {},
      driverCode: driverCode || {},
      createdBy: req.user._id,
      createdByUsername: req.user.username,
      constraints: constraints || "",
    });

    await problem.save();

    res.status(201).json({
      message: "Contest problem created successfully",
      problem: {
        id: problem._id,
        title: problem.title,
        difficulty: problem.difficulty,
        isContestOnly: problem.isContestOnly,
      },
    });
  } catch (error) {
    console.error("Create contest problem error:", error);
    res.status(500).json({ error: "Failed to create problem" });
  }
};

// Create a contest with custom share link
export const createContest = async (req, res) => {
  try {
    const {
      title,
      description,
      startTime,
      duration,
      problems, // Array of { problemId, points, order }
      maxParticipants,
      isPublic,
      allowVirtualParticipation,
      penaltyPerWrongSubmission,
      maxSubmissionsPerProblem,
      customSlug, // Optional custom slug for the contest URL
    } = req.body;

    // Validate start time
    const start = new Date(startTime);
    if (start <= new Date()) {
      return res
        .status(400)
        .json({ error: "Start time must be in the future" });
    }

    // Calculate end time
    const end = new Date(start.getTime() + duration * 60 * 1000);

    // Validate problems exist
    const problemIds = problems.map((p) => p.problemId);
    const existingProblems = await Problem.find({
      _id: { $in: problemIds },
      isActive: true,
    });

    if (existingProblems.length !== problemIds.length) {
      return res
        .status(400)
        .json({ error: "Some problems not found or inactive" });
    }

    // Create contest
    const contest = new Contest({
      title,
      description,
      createdBy: req.user._id,
      createdByUsername: req.user.username,
      startTime: start,
      endTime: end,
      duration,
      problems: problems.map((p) => ({
        problemId: p.problemId,
        points: p.points,
        order: p.order,
      })),
      maxParticipants,
      isPublic: isPublic !== false,
      allowVirtualParticipation: allowVirtualParticipation !== false,
      penaltyPerWrongSubmission: penaltyPerWrongSubmission || 20,
      maxSubmissionsPerProblem: maxSubmissionsPerProblem || 50,
    });

    await contest.save();

    // Generate share link (using contest ID or custom slug)
    const shareSlug = customSlug || contest._id.toString();
    const shareLink = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/contests/${shareSlug}`;

    res.status(201).json({
      message: "Contest created successfully",
      contest: {
        id: contest._id,
        title: contest.title,
        startTime: contest.startTime,
        endTime: contest.endTime,
        shareLink: shareLink,
      },
    });
  } catch (error) {
    console.error("Create contest error:", error);
    res.status(500).json({ error: "Failed to create contest" });
  }
};

// Get all problems (including contest-only)
export const getAllProblems = async (req, res) => {
  try {
    const problems = await Problem.find()
      .select("title difficulty isContestOnly createdAt createdByUsername")
      .sort({ createdAt: -1 });

    res.json({ problems });
  } catch (error) {
    console.error("Get problems error:", error);
    res.status(500).json({ error: "Failed to get problems" });
  }
};

// Get all contests (including private ones)
export const getAllContests = async (req, res) => {
  try {
    const contests = await Contest.find()
      .select(
        "title status startTime endTime totalParticipants createdByUsername isPublic"
      )
      .sort({ startTime: -1 });

    res.json({ contests });
  } catch (error) {
    console.error("Get contests error:", error);
    res.status(500).json({ error: "Failed to get contests" });
  }
};

// Get live leaderboard for a contest
export const getLiveLeaderboard = async (req, res) => {
  try {
    const { contestId } = req.params;

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    // Get live leaderboard from Redis
    const leaderboard = await redisContestUtils.getLeaderboard(contestId);

    // Enrich with user data
    const enrichedLeaderboard = await Promise.all(
      leaderboard.map(async (entry) => {
        const user = await User.findById(entry.userId).select(
          "username firstName lastName profileImage"
        );
        return {
          ...entry,
          user: user || { username: "Unknown" },
        };
      })
    );

    res.json({
      contestId,
      contestTitle: contest.title,
      status: contest.status,
      leaderboard: enrichedLeaderboard,
    });
  } catch (error) {
    console.error("Get live leaderboard error:", error);
    res.status(500).json({ error: "Failed to get live leaderboard" });
  }
};

// Get all disqualified users for a contest
export const getDisqualifiedUsers = async (req, res) => {
  try {
    const { contestId } = req.params;

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    const disqualifiedUserIds = await redisContestUtils.getDisqualifiedUsers(
      contestId
    );

    const disqualifiedUsers = await Promise.all(
      disqualifiedUserIds.map(async (userId) => {
        const user = await User.findById(userId).select(
          "username firstName lastName email"
        );
        const disqualificationData =
          await redisContestUtils.getUserDisqualificationData(
            contestId,
            userId
          );

        return {
          userId,
          user: user || { username: "Unknown" },
          disqualificationData,
        };
      })
    );

    res.json({
      contestId,
      contestTitle: contest.title,
      disqualifiedUsers,
    });
  } catch (error) {
    console.error("Get disqualified users error:", error);
    res.status(500).json({ error: "Failed to get disqualified users" });
  }
};

// Disqualify a user from a contest
export const disqualifyUser = async (req, res) => {
  try {
    const { contestId } = req.params;
    const { userId, reason } = req.body;

    if (!userId || !reason) {
      return res.status(400).json({ error: "userId and reason are required" });
    }

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Disqualify user in Redis
    await redisContestUtils.disqualifyUser(contestId, userId, {
      reason,
      violationType: "admin_action",
      timestamp: new Date().toISOString(),
      adminUsername: req.user.username,
    });

    res.json({
      message: `User ${user.username} has been disqualified from the contest`,
      userId,
      username: user.username,
    });
  } catch (error) {
    console.error("Disqualify user error:", error);
    res.status(500).json({ error: "Failed to disqualify user" });
  }
};

// Remove disqualification from a user
export const removeDisqualification = async (req, res) => {
  try {
    const { contestId, userId } = req.params;

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Remove disqualification from Redis
    await redisContestUtils.removeDisqualification(contestId, userId);

    res.json({
      message: `Disqualification removed for user ${user.username}`,
      userId,
      username: user.username,
    });
  } catch (error) {
    console.error("Remove disqualification error:", error);
    res.status(500).json({ error: "Failed to remove disqualification" });
  }
};

// Clear all disqualifications for a contest
export const clearAllDisqualifications = async (req, res) => {
  try {
    const { contestId } = req.params;

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    const disqualifiedUserIds = await redisContestUtils.getDisqualifiedUsers(
      contestId
    );

    // Remove all disqualifications
    for (const userId of disqualifiedUserIds) {
      await redisContestUtils.removeDisqualification(contestId, userId);
    }

    res.json({
      message: `All disqualifications cleared for contest ${contest.title}`,
      clearedCount: disqualifiedUserIds.length,
    });
  } catch (error) {
    console.error("Clear disqualifications error:", error);
    res.status(500).json({ error: "Failed to clear disqualifications" });
  }
};

// Toggle problem contest-only status
export const toggleProblemContestOnly = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { isContestOnly } = req.body;

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    problem.isContestOnly = isContestOnly;
    await problem.save();

    res.json({
      message: `Problem "${problem.title}" contest-only status updated`,
      problemId,
      title: problem.title,
      isContestOnly: problem.isContestOnly,
    });
  } catch (error) {
    console.error("Toggle problem contest-only error:", error);
    res.status(500).json({ error: "Failed to update problem" });
  }
};

// Get all users with admin privileges
export const getAdminUsers = async (req, res) => {
  try {
    const adminUsers = await User.find({ contestAdmin: true }).select(
      "username email firstName lastName contestAdmin createdAt"
    );

    res.json({ adminUsers });
  } catch (error) {
    console.error("Get admin users error:", error);
    res.status(500).json({ error: "Failed to get admin users" });
  }
};

// Grant admin privileges to a user
export const grantAdminPrivileges = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.contestAdmin) {
      return res.status(400).json({ error: "User is already a contest admin" });
    }

    user.contestAdmin = true;
    await user.save();

    res.json({
      message: `Admin privileges granted to ${user.username}`,
      userId,
      username: user.username,
    });
  } catch (error) {
    console.error("Grant admin privileges error:", error);
    res.status(500).json({ error: "Failed to grant admin privileges" });
  }
};

// Revoke admin privileges from a user
export const revokeAdminPrivileges = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.contestAdmin) {
      return res.status(400).json({ error: "User is not a contest admin" });
    }

    user.contestAdmin = false;
    await user.save();

    res.json({
      message: `Admin privileges revoked from ${user.username}`,
      userId,
      username: user.username,
    });
  } catch (error) {
    console.error("Revoke admin privileges error:", error);
    res.status(500).json({ error: "Failed to revoke admin privileges" });
  }
};

// Get contest statistics
export const getContestStats = async (req, res) => {
  try {
    const { contestId } = req.params;

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    const totalRegistered = contest.registeredUsers.length;
    const totalParticipated = await ContestRanking.countDocuments({
      contestId,
    });
    const disqualifiedCount = (
      await redisContestUtils.getDisqualifiedUsers(contestId)
    ).length;

    res.json({
      contestId,
      title: contest.title,
      status: contest.status,
      totalRegistered,
      totalParticipated,
      disqualifiedCount,
      startTime: contest.startTime,
      endTime: contest.endTime,
      problems: contest.problems.length,
    });
  } catch (error) {
    console.error("Get contest stats error:", error);
    res.status(500).json({ error: "Failed to get contest statistics" });
  }
};
