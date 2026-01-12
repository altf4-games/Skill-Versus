import Problem from "../models/Problem.js";
import User from "../models/User.js";

// Seed Two Sum problem
export const seedTwoSumProblem = async (req, res) => {
  try {
    // Check if problem already exists
    const existingProblem = await Problem.findOne({ title: "Two Sum" });
    if (existingProblem) {
      return res.json({
        message: "Two Sum problem already exists",
        problem: existingProblem,
      });
    }

    const twoSumProblem = new Problem({
      title: "Two Sum",
      description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
      difficulty: "Easy",
      constraints: `• 2 <= nums.length <= 10^4
• -10^9 <= nums[i] <= 10^9
• -10^9 <= target <= 10^9
• Only one valid answer exists.

**Follow-up:** Can you come up with an algorithm that is less than O(n²) time complexity?`,
      examples: [
        {
          input: "nums = [2,7,11,15], target = 9",
          output: "[0,1]",
          explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
        },
        {
          input: "nums = [3,2,4], target = 6",
          output: "[1,2]",
          explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
        },
        {
          input: "nums = [3,3], target = 6",
          output: "[0,1]",
          explanation: "Because nums[0] + nums[1] == 6, we return [0, 1].",
        },
      ],
      testCases: [
        {
          input: "[2,7,11,15]\\n9",
          expectedOutput: "[0,1]",
          isHidden: false,
        },
        {
          input: "[3,2,4]\\n6",
          expectedOutput: "[1,2]",
          isHidden: false,
        },
        {
          input: "[3,3]\\n6",
          expectedOutput: "[0,1]",
          isHidden: false,
        },
        {
          input: "[1,2,3,4,5]\\n9",
          expectedOutput: "[3,4]",
          isHidden: true,
        },
        {
          input: "[-1,-2,-3,-4,-5]\\n-8",
          expectedOutput: "[2,4]",
          isHidden: true,
        },
      ],
      functionSignature: `function twoSum(nums, target) {
    // Your code here
    
}`,
      hints: [
        "A really brute force way would be to search for all possible pairs of numbers but that would be too slow. Again, it's best to try out brute force solutions for just for completeness. It is from these brute force solutions that you can come up with optimizations.",
        "So, if we fix one of the numbers, say x, we have to scan the entire array to find the next number y which is value - x where value is the input parameter. Can we change our array somehow so that this search becomes faster?",
        "The second train of thought is, without changing the array, can we use additional space somehow? Like maybe a hash map to speed up the search?",
      ],
      tags: ["Array", "Hash Table"],
      timeLimit: 30,
      memoryLimit: 128,
      isActive: true,
    });

    await twoSumProblem.save();

    res.json({
      message: "Two Sum problem created successfully",
      problem: twoSumProblem,
    });
  } catch (error) {
    console.error("Error seeding Two Sum problem:", error);
    res.status(500).json({
      error: "Failed to seed Two Sum problem",
      message: error.message,
    });
  }
};

// Create a new problem (admin only)
export const createProblem = async (req, res) => {
  try {
    const userId = req.auth.userId;

    // Check if user is contest admin
    const user = await User.findOne({ clerkId: userId });
    if (!user || !user.contestAdmin) {
      return res
        .status(403)
        .json({ error: "Access denied. Contest admin required." });
    }

    const {
      title,
      description,
      difficulty,
      timeLimit,
      memoryLimit,
      tags,
      isContestOnly,
      examples,
      testCases,
      functionSignatures,
      driverCode,
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
      expectedOutput: tc.output,
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
      isContestOnly: isContestOnly || false,
      examples,
      testCases: transformedTestCases,
      functionSignatures: functionSignatures || {},
      driverCode: driverCode || {},
      createdBy: user._id,
      createdByUsername: user.username,
      constraints: "", // Add empty constraints for now
    });

    await problem.save();

    res.status(201).json({
      message: "Problem created successfully",
      problem: {
        id: problem._id,
        title: problem.title,
        difficulty: problem.difficulty,
      },
    });
  } catch (error) {
    console.error("Create problem error:", error);
    res.status(500).json({ error: "Failed to create problem" });
  }
};

export const getAllProblems = async (req, res) => {
  try {
    const { includeContestOnly } = req.query;

    let query = {};
    if (includeContestOnly === "true") {
      query = { isContestOnly: true };
    } else {
      query = {
        $or: [{ isContestOnly: { $exists: false } }, { isContestOnly: false }],
      };
    }

    const problems = await Problem.find(query).sort({ createdAt: -1 });
    res.json({ problems });
  } catch (error) {
    console.error("Error getting problems:", error);
    res.status(500).json({
      error: "Failed to get problems",
      message: error.message,
    });
  }
};

export const getProblemById = async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await Problem.findById(id);

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    res.json({ problem });
  } catch (error) {
    console.error("Error getting problem:", error);
    res.status(500).json({
      error: "Failed to get problem",
      message: error.message,
    });
  }
};
