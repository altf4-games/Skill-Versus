import Contest from "../models/Contest.js";
import ContestSubmission from "../models/ContestSubmission.js";
import ContestRanking from "../models/ContestRanking.js";
import Problem from "../models/Problem.js";
import User from "../models/User.js";
import redisContestUtils from "../utils/redisContestUtils.js";
import ratingService from "../services/ratingService.js";

// Get all contests (public listing)
export const getAllContests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { isActive: true };
    if (status && ["upcoming", "active", "finished"].includes(status)) {
      query.status = status;
    }
    
    const contests = await Contest.find(query)
      .select("title description startTime endTime duration status totalParticipants createdByUsername")
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Contest.countDocuments(query);
    
    res.json({
      contests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get contests error:", error);
    res.status(500).json({ error: "Failed to get contests" });
  }
};

// Get contest details
export const getContestDetails = async (req, res) => {
  try {
    const { contestId } = req.params;
    const clerkUserId = req.auth?.userId;

    const contest = await Contest.findById(contestId)
      .populate("problems.problemId", "title description difficulty examples constraints")
      .lean();

    if (!contest || !contest.isActive) {
      return res.status(404).json({ error: "Contest not found" });
    }

    // Check if user is registered
    let isRegistered = false;
    let canRegister = false;
    let mongoUserId = null;

    if (clerkUserId) {
      // Get MongoDB user ID from Clerk ID
      const user = await User.findOne({ clerkId: clerkUserId });
      if (user) {
        mongoUserId = user._id;
        isRegistered = contest.registeredUsers.some(
          (regUser) => regUser.userId.toString() === mongoUserId.toString()
        );
        canRegister = !isRegistered && new Date() < contest.startTime;
      }
    }
    
    // Hide problem details if contest hasn't started and user isn't registered
    if (new Date() < contest.startTime && !isRegistered) {
      contest.problems = contest.problems.map(p => ({
        ...p,
        problemId: {
          title: p.problemId.title,
          difficulty: p.problemId.difficulty,
        }
      }));
    }
    
    // Calculate real-time status based on server time
    const now = new Date();
    const contestStart = new Date(contest.startTime);
    const contestEnd = new Date(contest.endTime);

    let currentStatus;
    if (now < contestStart) {
      currentStatus = 'upcoming';
    } else if (now <= contestEnd) {
      currentStatus = 'active';
    } else {
      currentStatus = 'finished';
    }

    res.json({
      contest: {
        ...contest,
        currentStatus, // Real-time status based on server time
      },
      isRegistered,
      canRegister,
      serverTime: now.toISOString(), // Send server time to frontend
    });
  } catch (error) {
    console.error("Get contest details error:", error);
    res.status(500).json({ error: "Failed to get contest details" });
  }
};

// Create contest (admin only)
export const createContest = async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    // Check if user is contest admin
    const user = await User.findOne({ clerkId: userId });
    if (!user || !user.contestAdmin) {
      return res.status(403).json({ error: "Access denied. Contest admin required." });
    }
    
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
    } = req.body;
    
    // Validate start time
    const start = new Date(startTime);
    if (start <= new Date()) {
      return res.status(400).json({ error: "Start time must be in the future" });
    }
    
    // Calculate end time
    const end = new Date(start.getTime() + duration * 60 * 1000);
    
    // Validate problems exist
    const problemIds = problems.map(p => p.problemId);
    const existingProblems = await Problem.find({
      _id: { $in: problemIds },
      isActive: true,
    });
    
    if (existingProblems.length !== problemIds.length) {
      return res.status(400).json({ error: "Some problems not found or inactive" });
    }
    
    // Create contest
    const contest = new Contest({
      title,
      description,
      createdBy: user._id,
      createdByUsername: user.username,
      startTime: start,
      endTime: end,
      duration,
      problems: problems.map(p => ({
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
    
    res.status(201).json({
      message: "Contest created successfully",
      contest: {
        id: contest._id,
        title: contest.title,
        startTime: contest.startTime,
        endTime: contest.endTime,
      },
    });
  } catch (error) {
    console.error("Create contest error:", error);
    res.status(500).json({ error: "Failed to create contest" });
  }
};

// Register for contest
export const registerForContest = async (req, res) => {
  try {
    const { contestId } = req.params;
    const userId = req.auth.userId;
    
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const contest = await Contest.findById(contestId);
    if (!contest || !contest.isActive) {
      return res.status(404).json({ error: "Contest not found" });
    }
    
    // Check if already registered
    if (contest.isUserRegistered(user._id)) {
      return res.status(400).json({ error: "Already registered for this contest" });
    }
    
    // Check if registration is allowed
    if (!contest.canRegister()) {
      return res.status(400).json({ error: "Registration not allowed" });
    }
    
    // Register user
    contest.registerUser(user._id, user.username);
    await contest.save();
    
    res.json({ message: "Successfully registered for contest" });
  } catch (error) {
    console.error("Register for contest error:", error);
    res.status(500).json({ error: error.message || "Failed to register for contest" });
  }
};

// Get contest leaderboard
export const getContestLeaderboard = async (req, res) => {
  try {
    const { contestId } = req.params;
    const { virtual = false } = req.query;
    
    const contest = await Contest.findById(contestId);
    if (!contest || !contest.isActive) {
      return res.status(404).json({ error: "Contest not found" });
    }
    
    // For active contests, try to get from Redis first
    if (contest.status === "active" && !virtual) {
      try {
        const redisLeaderboard = await redisContestUtils.getLeaderboard(contestId);
        if (redisLeaderboard) {
          return res.json({ leaderboard: redisLeaderboard, fromCache: true });
        }
      } catch (error) {
        console.warn("Redis leaderboard fetch failed:", error.message);
      }
    }
    
    // For finished contests or if Redis fails, get from MongoDB
    if (contest.status === "finished") {
      return res.json({ 
        leaderboard: contest.finalStandings,
        fromCache: false 
      });
    }
    
    // Generate leaderboard from submissions
    const leaderboard = await generateLeaderboard(contestId, virtual);
    res.json({ leaderboard, fromCache: false });
    
  } catch (error) {
    console.error("Get leaderboard error:", error);
    res.status(500).json({ error: "Failed to get leaderboard" });
  }
};

// Helper function to generate leaderboard
export const generateLeaderboard = async (contestId, isVirtual = false) => {
  const submissions = await ContestSubmission.find({
    contestId,
    isVirtual,
  }).sort({ submissionTime: 1 });

  const userStats = {};

  // Get contest details for penalty calculation
  const contest = await Contest.findById(contestId);
  const penaltyPerWrongSubmission = contest?.penaltyPerWrongSubmission || 20;

  // Get disqualified users
  const disqualifiedUsers = await redisContestUtils.getDisqualifiedUsers(contestId);

  // Process submissions to calculate scores
  submissions.forEach(submission => {
    const userId = submission.userId.toString();

    if (!userStats[userId]) {
      userStats[userId] = {
        userId: submission.userId,
        username: submission.username,
        totalScore: 0,
        totalPenalty: 0,
        problemsSolved: 0,
        lastSubmissionTime: null,
        problems: {},
      };
    }

    const problemId = submission.problemId.toString();
    if (!userStats[userId].problems[problemId]) {
      userStats[userId].problems[problemId] = {
        attempts: 0,
        wrongAttempts: 0,
        solved: false,
        points: 0,
        penalty: 0,
        firstAcceptedTime: null,
      };
    }

    const problemData = userStats[userId].problems[problemId];
    problemData.attempts++;

    if (submission.isAccepted && !problemData.solved) {
      problemData.solved = true;
      problemData.points = submission.points;
      // CP penalty: submission time + (wrong attempts * penalty per wrong submission)
      problemData.penalty = submission.timeFromStart + (problemData.wrongAttempts * penaltyPerWrongSubmission);
      problemData.firstAcceptedTime = submission.submissionTime;

      userStats[userId].totalScore += submission.points;
      userStats[userId].problemsSolved++;
      userStats[userId].lastSubmissionTime = submission.submissionTime;
    } else if (!submission.isAccepted && !problemData.solved) {
      // Count wrong attempts only if problem is not yet solved
      problemData.wrongAttempts++;
    }
  });
  
  // Convert to array and sort
  const leaderboard = Object.values(userStats)
    .map(user => ({
      ...user,
      totalPenalty: Object.values(user.problems)
        .filter(p => p.solved)
        .reduce((sum, p) => sum + p.penalty, 0),
    }))
    .sort((a, b) => {
      if (a.totalScore !== b.totalScore) return b.totalScore - a.totalScore;
      if (a.totalPenalty !== b.totalPenalty) return a.totalPenalty - b.totalPenalty;
      return new Date(a.lastSubmissionTime) - new Date(b.lastSubmissionTime);
    })
    .map((user, index) => ({
      ...user,
      rank: index + 1,
      isDisqualified: disqualifiedUsers.includes(user.userId.toString()),
    }));
  
  return leaderboard;
};

// Get user's contest submissions
export const getUserContestSubmissions = async (req, res) => {
  try {
    const { contestId } = req.params;
    const userId = req.auth.userId;
    const { virtual = false } = req.query;

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const submissions = await ContestSubmission.find({
      contestId,
      userId: user._id,
      isVirtual: virtual === "true",
    })
    .populate("problemId", "title difficulty")
    .sort({ submissionTime: -1 })
    .lean();

    res.json({ submissions });
  } catch (error) {
    console.error("Get user submissions error:", error);
    res.status(500).json({ error: "Failed to get submissions" });
  }
};

// Start virtual contest
export const startVirtualContest = async (req, res) => {
  try {
    const { contestId } = req.params;
    const userId = req.auth.userId;

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const contest = await Contest.findById(contestId);
    if (!contest || !contest.isActive) {
      return res.status(404).json({ error: "Contest not found" });
    }

    if (!contest.allowVirtualParticipation) {
      return res.status(400).json({ error: "Virtual participation not allowed" });
    }

    if (contest.status !== "finished") {
      return res.status(400).json({ error: "Can only start virtual contest for finished contests" });
    }

    // Check if user already has a virtual contest running
    const existingVirtual = await ContestSubmission.findOne({
      contestId,
      userId: user._id,
      isVirtual: true,
    });

    if (existingVirtual) {
      const virtualStartTime = existingVirtual.virtualStartTime;
      const virtualEndTime = new Date(virtualStartTime.getTime() + contest.duration * 60 * 1000);

      if (new Date() < virtualEndTime) {
        return res.json({
          message: "Virtual contest already running",
          virtualStartTime,
          virtualEndTime,
        });
      }
    }

    const virtualStartTime = new Date();
    const virtualEndTime = new Date(virtualStartTime.getTime() + contest.duration * 60 * 1000);

    res.json({
      message: "Virtual contest started",
      virtualStartTime,
      virtualEndTime,
    });
  } catch (error) {
    console.error("Start virtual contest error:", error);
    res.status(500).json({ error: "Failed to start virtual contest" });
  }
};

// Update contest status (admin only)
export const updateContestStatus = async (req, res) => {
  try {
    const { contestId } = req.params;
    const { status } = req.body;
    const userId = req.auth.userId;

    // Check if user is contest admin
    const user = await User.findOne({ clerkId: userId });
    if (!user || !user.contestAdmin) {
      return res.status(403).json({ error: "Access denied. Contest admin required." });
    }

    if (!["upcoming", "active", "finished"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    contest.status = status;
    await contest.save();

    // If contest is finished, save final standings to MongoDB
    if (status === "finished") {
      const leaderboard = await generateLeaderboard(contestId);
      contest.finalStandings = leaderboard;
      contest.totalParticipants = leaderboard.length;

      // Also save virtual contest standings if there are any virtual participants
      const virtualLeaderboard = await generateLeaderboard(contestId, true);
      if (virtualLeaderboard.length > 0) {
        contest.virtualFinalStandings = virtualLeaderboard;
        contest.totalVirtualParticipants = virtualLeaderboard.length;
      }

      await contest.save();

      // Update contest ratings for all participants
      try {
        const ratingUpdates = await ratingService.updateContestRatings(contestId, leaderboard);
        console.log(`Updated ratings for ${ratingUpdates.length} participants in contest ${contestId}`);
      } catch (error) {
        console.error("Failed to update contest ratings:", error);
      }

      // Clean up Redis data after a delay
      setTimeout(async () => {
        try {
          await redisContestUtils.deleteContestData(contestId);
        } catch (error) {
          console.error("Failed to cleanup Redis data:", error);
        }
      }, 60000); // 1 minute delay
    }

    res.json({ message: "Contest status updated successfully" });
  } catch (error) {
    console.error("Update contest status error:", error);
    res.status(500).json({ error: "Failed to update contest status" });
  }
};

// Check user disqualification status
export const getDisqualificationStatus = async (req, res) => {
  try {
    const { contestId } = req.params;
    const userId = req.auth.userId;

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    // Check if user is disqualified in Redis
    try {
      await redisContestUtils.init();
      const disqualifiedUsers = await redisContestUtils.getDisqualifiedUsers(contestId);
      const isDisqualified = disqualifiedUsers.includes(user._id.toString());

      res.json({
        isDisqualified,
        contestId,
        userId: user._id.toString()
      });
    } catch (redisError) {
      console.warn("Redis check failed, assuming not disqualified:", redisError.message);
      res.json({
        isDisqualified: false,
        contestId,
        userId: user._id.toString()
      });
    }

  } catch (error) {
    console.error("Get disqualification status error:", error);
    res.status(500).json({ error: "Failed to get disqualification status" });
  }
};

// Handle anti-cheat violations
export const handleAntiCheatViolation = async (req, res) => {
  try {
    const { contestId } = req.params;
    const { violation, isVirtual, virtualStartTime } = req.body;
    const userId = req.auth.userId;

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    // Check if user is registered for the contest
    const isRegistered = contest.isUserRegistered(user._id);
    if (!isRegistered && !isVirtual) {
      return res.status(403).json({ error: "User not registered for contest" });
    }

    // Log the violation
    console.log(`[ANTI-CHEAT] Contest violation - User: ${user.username}, Contest: ${contestId}, Type: ${violation.type}`);

    // Check for serious violations that trigger disqualification
    const seriousViolations = ['FOCUS_LOST', 'TAB_SWITCH', 'FULLSCREEN_EXIT'];
    let disqualified = false;

    if (seriousViolations.includes(violation.type)) {
      // Mark user as disqualified in Redis
      await redisContestUtils.disqualifyUser(contestId, user._id.toString(), {
        reason: violation.message,
        timestamp: new Date(),
        violationType: violation.type,
        isVirtual
      });

      disqualified = true;
      console.log(`[ANTI-CHEAT] User ${user.username} disqualified from contest ${contestId}`);
    }

    res.json({
      message: "Anti-cheat violation recorded",
      disqualified,
      violation: {
        type: violation.type,
        message: violation.message,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error("Handle anti-cheat violation error:", error);
    res.status(500).json({ error: "Failed to handle anti-cheat violation" });
  }
};

// Get virtual contest rankings
export const getVirtualContestRankings = async (req, res) => {
  try {
    const { contestId } = req.params;

    const contest = await Contest.findById(contestId);
    if (!contest || !contest.isActive) {
      return res.status(404).json({ error: "Contest not found" });
    }

    if (!contest.allowVirtualParticipation) {
      return res.status(400).json({ error: "Virtual participation not allowed" });
    }

    // Generate virtual leaderboard
    const virtualLeaderboard = await generateLeaderboard(contestId, true);

    res.json({
      leaderboard: virtualLeaderboard,
      contestTitle: contest.title,
      contestDuration: contest.duration,
    });
  } catch (error) {
    console.error("Get virtual rankings error:", error);
    res.status(500).json({ error: "Failed to get virtual rankings" });
  }
};

// Get contest problems (for registered users during active contest)
export const getContestProblems = async (req, res) => {
  try {
    const { contestId } = req.params;
    const userId = req.auth.userId;

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const contest = await Contest.findById(contestId)
      .populate("problems.problemId")
      .lean();

    if (!contest || !contest.isActive) {
      return res.status(404).json({ error: "Contest not found" });
    }

    // Check if user is registered or if it's a virtual contest
    const isRegistered = contest.registeredUsers.some(
      (regUser) => regUser.userId.toString() === user._id.toString()
    );

    if (!isRegistered && contest.status === "active") {
      return res.status(403).json({ error: "Not registered for this contest" });
    }

    // For finished contests, allow access for virtual participation
    if (contest.status === "finished" && !contest.allowVirtualParticipation) {
      return res.status(403).json({ error: "Virtual participation not allowed" });
    }

    const problems = contest.problems
      .sort((a, b) => a.order - b.order)
      .map(p => ({
        id: p.problemId._id,
        title: p.problemId.title,
        description: p.problemId.description,
        difficulty: p.problemId.difficulty,
        examples: p.problemId.examples,
        constraints: p.problemId.constraints,
        functionSignature: p.problemId.functionSignature,
        functionSignatures: p.problemId.functionSignatures || {},
        languageBoilerplate: p.problemId.languageBoilerplate || {},
        points: p.points,
        order: p.order,
      }));

    res.json({ problems });
  } catch (error) {
    console.error("Get contest problems error:", error);
    res.status(500).json({ error: "Failed to get contest problems" });
  }
};
