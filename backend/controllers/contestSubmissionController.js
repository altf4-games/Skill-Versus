import Contest from "../models/Contest.js";
import ContestSubmission from "../models/ContestSubmission.js";
import Problem from "../models/Problem.js";
import User from "../models/User.js";
import redisContestUtils from "../utils/redisContestUtils.js";
import * as judge0Controller from "./judge0Controller.js";

// Submit code for contest problem
export const submitContestCode = async (req, res) => {
  try {
    const { contestId, problemId } = req.params;
    const { code, language, isVirtual = false, virtualStartTime, antiCheatViolations = [] } = req.body;
    const userId = req.auth.userId;

    console.log(`Contest submission received: Contest=${contestId}, Problem=${problemId}, Language=${language}, User=${userId}`);

    // Validate inputs
    if (!code || !language) {
      return res.status(400).json({ error: "Code and language are required" });
    }
    
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const contest = await Contest.findById(contestId);
    if (!contest || !contest.isActive) {
      return res.status(404).json({ error: "Contest not found" });
    }
    
    const problem = await Problem.findById(problemId);
    if (!problem || !problem.isActive) {
      return res.status(404).json({ error: "Problem not found" });
    }
    
    // Check if problem is part of the contest
    const contestProblem = contest.problems.find(
      p => p.problemId.toString() === problemId
    );
    if (!contestProblem) {
      return res.status(400).json({ error: "Problem not part of this contest" });
    }
    
    // Validate contest timing and user registration
    const now = new Date();
    let contestStartTime = contest.startTime;
    let contestEndTime = contest.endTime;
    
    if (isVirtual) {
      if (!contest.allowVirtualParticipation || contest.status !== "finished") {
        return res.status(400).json({ error: "Virtual participation not allowed" });
      }
      
      if (!virtualStartTime) {
        return res.status(400).json({ error: "Virtual start time required" });
      }
      
      contestStartTime = new Date(virtualStartTime);
      contestEndTime = new Date(contestStartTime.getTime() + contest.duration * 60 * 1000);
      
      if (now > contestEndTime) {
        return res.status(400).json({ error: "Virtual contest has ended" });
      }
    } else {
      // Regular contest validation - check actual time instead of database status
      const contestStart = new Date(contest.startTime);
      const contestEnd = new Date(contest.endTime);

      if (now < contestStart) {
        return res.status(400).json({
          error: "Contest has not started yet",
          contestStatus: "upcoming",
          startTime: contest.startTime,
          message: "Please wait for the contest to begin."
        });
      }

      if (now > contestEnd) {
        return res.status(400).json({
          error: "Contest has ended. Submissions are no longer accepted.",
          contestStatus: "finished",
          endTime: contest.endTime,
          message: "Check the final leaderboard for results. You can participate virtually if enabled."
        });
      }

      const isRegistered = contest.registeredUsers.some(
        regUser => regUser.userId.toString() === user._id.toString()
      );

      if (!isRegistered) {
        return res.status(403).json({ error: "Not registered for this contest" });
      }
    }
    
    // Check submission limits
    const userSubmissions = await ContestSubmission.countDocuments({
      contestId,
      problemId,
      userId: user._id,
      isVirtual,
    });
    
    if (userSubmissions >= contest.maxSubmissionsPerProblem) {
      return res.status(400).json({ 
        error: `Maximum ${contest.maxSubmissionsPerProblem} submissions per problem exceeded` 
      });
    }
    
    // Calculate time from contest start
    const timeFromStart = Math.floor((now - contestStartTime) / (1000 * 60)); // minutes
    
    // Submit code directly with all test cases (like duel system)
    console.log(`Submitting to Judge0 with all test cases: Language ID=${getLanguageId(language)}`);

    // Create a promise to capture the result from submitCodeWithTests
    let testResult;
    const mockRes = {
      json: (data) => { testResult = data; },
      status: (code) => ({ json: (data) => { testResult = { error: data.error, statusCode: code }; } })
    };

    await judge0Controller.submitCodeWithTests({
      body: {
        source_code: code,
        language_id: getLanguageId(language),
        problem_id: problemId,
      }
    }, mockRes);

    console.log(`Judge0 test result:`, testResult);

    if (!testResult || !testResult.success) {
      console.log(`Judge0 submission failed:`, testResult);
      return res.status(500).json({ error: testResult?.error || "Failed to submit to judge" });
    }
    
    // Process results immediately (like duel system)
    const passedCount = testResult.passedCount || 0;
    const totalCount = testResult.totalCount || 0;
    const isAccepted = testResult.accepted || false;

    // Calculate points
    let points = 0;
    if (isAccepted) {
      points = contestProblem.points;
    }

    // Create submission record with final results
    const submission = new ContestSubmission({
      contestId,
      problemId,
      userId: user._id,
      username: user.username,
      code,
      language,
      status: isAccepted ? 'accepted' : 'wrong_answer',
      verdict: testResult.verdict || (isAccepted ? 'Accepted' : 'Wrong Answer'),
      submissionTime: new Date(),
      timeFromStart,
      passedTestCases: passedCount,
      totalTestCases: totalCount,
      points,
      isAccepted,
      isVirtual,
      virtualStartTime: isVirtual ? contestStartTime : undefined,
      antiCheatViolations: antiCheatViolations.map(violation => ({
        type: violation.type,
        timestamp: new Date(violation.timestamp),
        message: violation.message,
      })),
    });
    
    console.log('Saving submission with data:', {
      contestId,
      problemId,
      userId: user._id,
      username: user.username,
      status: submission.status,
      passedTestCases: passedCount,
      totalTestCases: totalCount,
      points,
      isAccepted
    });

    await submission.save();
    console.log('Submission saved successfully:', submission._id);

    // Update contest leaderboard immediately
    await updateContestLeaderboard(contestId, isVirtual);

    res.status(201).json({
      message: "Code submitted successfully",
      submissionId: submission._id,
      status: submission.status,
      accepted: isAccepted,
      passedCount: passedCount,
      totalCount: totalCount,
      points,
      verdict: submission.verdict,
    });
  } catch (error) {
    console.error("Submit contest code error:", error);
    res.status(500).json({ error: "Failed to submit code" });
  }
};

// Get submission status
export const getSubmissionStatus = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.auth.userId;
    
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const submission = await ContestSubmission.findById(submissionId)
      .populate("problemId", "title")
      .lean();
    
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }
    
    // Check if user owns this submission
    if (submission.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    res.json({
      submission: {
        id: submission._id,
        status: submission.status,
        verdict: submission.verdict,
        passedTestCases: submission.passedTestCases,
        totalTestCases: submission.totalTestCases,
        points: submission.points,
        penalty: submission.penalty,
        submissionTime: submission.submissionTime,
        timeFromStart: submission.timeFromStart,
        maxExecutionTime: submission.maxExecutionTime,
        maxMemoryUsed: submission.maxMemoryUsed,
        compilerOutput: submission.compilerOutput,
        runtimeError: submission.runtimeError,
        problem: {
          title: submission.problemId.title,
        },
      },
    });
  } catch (error) {
    console.error("Get submission status error:", error);
    res.status(500).json({ error: "Failed to get submission status" });
  }
};

// Helper function to map language to Judge0 language ID
const getLanguageId = (language) => {
  const languageMap = {
    javascript: 63, // Node.js
    python: 71,     // Python 3
    java: 62,       // Java
    cpp: 54,        // C++
    c: 50,          // C
  };
  
  return languageMap[language] || 63; // Default to JavaScript
};

// Process submission queue (background worker)
export const processSubmissionQueue = async () => {
  try {
    const submissionData = await redisContestUtils.getSubmissionFromQueue();
    if (!submissionData) {
      return; // No submissions in queue
    }
    
    const {
      submissionId,
      contestId,
      problemId,
      userId,
      judge0Token,
      problemPoints,
      penaltyPerWrongSubmission,
      testCases,
      isVirtual,
    } = submissionData;
    
    // Get Judge0 result
    const judge0Result = await judge0Controller.getSubmissionFromJudge0(judge0Token);

    console.log(`Judge0 result for token ${judge0Token}:`, {
      status: judge0Result?.status,
      stdout: judge0Result?.stdout,
      stderr: judge0Result?.stderr,
      compile_output: judge0Result?.compile_output
    });

    if (!judge0Result || judge0Result.status?.id <= 2) {
      // Still processing, put back in queue
      console.log(`Submission ${submissionId} still processing, re-queuing`);
      await redisContestUtils.addSubmissionToQueue(submissionData);
      return;
    }
    
    // Update submission with results
    const submission = await ContestSubmission.findById(submissionId);
    if (!submission) {
      console.error("Submission not found:", submissionId);
      return;
    }
    
    // Process test cases
    let passedCount = 0;
    const testCaseResults = [];
    
    if (judge0Result.status?.id === 3) { // Accepted
      // Run against all test cases
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        
        // Submit with test case input
        const testResult = await judge0Controller.submitCodeToJudge0({
          source_code: submission.code,
          language_id: getLanguageId(submission.language),
          stdin: testCase.input,
          expected_output: testCase.expectedOutput,
        });
        
        // Get result
        const result = await judge0Controller.getSubmissionFromJudge0(testResult.token);
        
        const passed = result.status?.id === 3 && 
                      result.stdout?.trim() === testCase.expectedOutput.trim();
        
        if (passed) passedCount++;
        
        testCaseResults.push({
          testCaseIndex: i,
          status: passed ? "passed" : "failed",
          executionTime: result.time ? parseFloat(result.time) * 1000 : 0,
          memoryUsed: result.memory ? parseInt(result.memory) : 0,
          output: result.stdout,
          expectedOutput: testCase.expectedOutput,
          errorMessage: result.stderr,
        });
      }
    }
    
    // Update submission
    submission.updateResults(judge0Result);
    submission.passedTestCases = passedCount;
    submission.testCaseResults = testCaseResults;
    
    if (passedCount === testCases.length) {
      submission.isAccepted = true;
      submission.points = problemPoints;
    }
    
    submission.penalty = submission.calculatePenalty(penaltyPerWrongSubmission);
    
    await submission.save();
    
    // Update leaderboard in Redis
    await updateContestLeaderboard(contestId, isVirtual);
    
  } catch (error) {
    console.error("Process submission queue error:", error);
  }
};

// Update contest leaderboard
const updateContestLeaderboard = async (contestId, isVirtual = false) => {
  try {
    // Generate fresh leaderboard
    const submissions = await ContestSubmission.find({
      contestId,
      isVirtual,
    }).sort({ submissionTime: 1 });
    
    const userStats = {};
    
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
          solved: false,
          points: 0,
          penalty: 0,
        };
      }
      
      const problemData = userStats[userId].problems[problemId];
      problemData.attempts++;
      
      if (submission.isAccepted && !problemData.solved) {
        problemData.solved = true;
        problemData.points = submission.points;
        problemData.penalty = submission.timeFromStart;
        
        userStats[userId].totalScore += submission.points;
        userStats[userId].problemsSolved++;
        userStats[userId].lastSubmissionTime = submission.submissionTime;
      }
    });
    
    // Convert to leaderboard format
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
      }));
    
    // Update Redis leaderboard
    const contest = await Contest.findById(contestId);
    if (contest) {
      const ttl = Math.ceil((contest.endTime - new Date()) / 1000) + 3600; // Contest duration + 1 hour
      await redisContestUtils.updateLeaderboard(contestId, leaderboard, ttl);
    }
    
  } catch (error) {
    console.error("Update leaderboard error:", error);
  }
};
