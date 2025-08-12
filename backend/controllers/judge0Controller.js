import { configDotenv } from "dotenv";
import Problem from "../models/Problem.js";
configDotenv();

const JUDGE0_BASE_URL = process.env.JUDGE0_BASE_URL;

// Helper function to make requests to Judge0 API
async function makeJudge0Request(endpoint, options = {}) {
  const url = `${JUDGE0_BASE_URL}${endpoint}`;

  const defaultHeaders = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  };

  const fetchOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(
        `Judge0 API error: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Judge0 API request failed:", error);
    throw error;
  }
}

// Get available programming languages
export const getLanguages = async (req, res) => {
  try {
    const languages = await makeJudge0Request("/languages");
    res.json(languages);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch programming languages",
      message: error.message,
    });
  }
};

// Submit code for execution
export const submitCode = async (req, res) => {
  try {
    const { source_code, language_id, stdin, expected_output } = req.body;

    if (!source_code || !language_id) {
      return res.status(400).json({
        error:
          "Missing required fields: source_code and language_id are required",
      });
    }

    const submission = {
      source_code,
      language_id,
      stdin: stdin || "",
      expected_output: expected_output || null,
      cpu_time_limit: 2,
      memory_limit: 128000,
      wall_time_limit: 5,
    };

    const result = await makeJudge0Request(
      "/submissions?base64_encoded=false&wait=true",
      {
        method: "POST",
        body: JSON.stringify(submission),
      }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: "Failed to execute code",
      message: error.message,
    });
  }
};

// Get submission result by token
export const getSubmission = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        error: "Submission token is required",
      });
    }

    const result = await makeJudge0Request(
      `/submissions/${token}?base64_encoded=false`
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch submission result",
      message: error.message,
    });
  }
};

// Submit code without waiting for result (async)
export const submitCodeAsync = async (req, res) => {
  try {
    const { source_code, language_id, stdin, expected_output } = req.body;

    if (!source_code || !language_id) {
      return res.status(400).json({
        error:
          "Missing required fields: source_code and language_id are required",
      });
    }

    const submission = {
      source_code,
      language_id,
      stdin: stdin || "",
      expected_output: expected_output || null,
      cpu_time_limit: 2,
      memory_limit: 128000,
      wall_time_limit: 5,
    };

    const result = await makeJudge0Request(
      "/submissions?base64_encoded=false",
      {
        method: "POST",
        body: JSON.stringify(submission),
      }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: "Failed to submit code",
      message: error.message,
    });
  }
};

// Get multiple submissions
export const getBatchSubmissions = async (req, res) => {
  try {
    const { tokens } = req.query;

    if (!tokens) {
      return res.status(400).json({
        error: "Tokens parameter is required",
      });
    }

    const result = await makeJudge0Request(
      `/submissions/batch?tokens=${tokens}&base64_encoded=false`
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch batch submissions",
      message: error.message,
    });
  }
};

// Run code with sample test cases (for practice/run button)
export const runCodeWithTests = async (req, res) => {
  try {
    const { source_code, language_id, problem_id } = req.body;

    if (!source_code || !language_id || !problem_id) {
      return res.status(400).json({
        error:
          "Missing required fields: source_code, language_id, and problem_id are required",
      });
    }

    // Get the problem to access test cases
    const problem = await Problem.findById(problem_id);
    if (!problem) {
      return res.status(404).json({
        error: "Problem not found",
      });
    }

    // Get sample test cases (non-hidden ones)
    const sampleTestCases = problem.testCases.filter(
      (testCase) => !testCase.isHidden
    );

    if (sampleTestCases.length === 0) {
      return res.status(400).json({
        error: "No sample test cases available for this problem",
      });
    }

    // Run code against sample test cases
    const results = [];

    for (const testCase of sampleTestCases) {
      try {
        const submission = {
          source_code,
          language_id,
          stdin: testCase.input,
          cpu_time_limit: 2,
          memory_limit: 128000,
          wall_time_limit: 5,
        };

        const result = await makeJudge0Request(
          "/submissions?base64_encoded=false&wait=true",
          {
            method: "POST",
            body: JSON.stringify(submission),
          }
        );

        // Clean output for comparison
        const actualOutput = result.stdout ? result.stdout.trim() : "";
        const expectedOutput = testCase.expectedOutput.trim();
        const passed = actualOutput === expectedOutput;

        results.push({
          input: testCase.input,
          expectedOutput: expectedOutput,
          actualOutput: actualOutput,
          passed: passed,
          error: result.stderr || null,
          status: result.status,
        });
      } catch (error) {
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: "",
          passed: false,
          error: error.message,
          status: { description: "Runtime Error" },
        });
      }
    }

    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;

    res.json({
      success: true,
      passedCount,
      totalCount,
      allPassed: passedCount === totalCount,
      testResults: results,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to run code with test cases",
      message: error.message,
    });
  }
};

// Submit code with all test cases (for submission)
export const submitCodeWithTests = async (req, res) => {
  try {
    console.log("📝 submitCodeWithTests called with body:", req.body);
    const { source_code, language_id, problem_id } = req.body;

    if (!source_code || !language_id || !problem_id) {
      console.log("❌ Missing required fields:", {
        source_code: !!source_code,
        language_id: !!language_id,
        problem_id: !!problem_id,
      });
      return res.status(400).json({
        error:
          "Missing required fields: source_code, language_id, and problem_id are required",
      });
    }

    console.log("🔍 Looking for problem with ID:", problem_id);
    // Get the problem to access all test cases
    const problem = await Problem.findById(problem_id);
    if (!problem) {
      console.log("❌ Problem not found for ID:", problem_id);
      return res.status(404).json({
        error: "Problem not found",
      });
    }

    console.log("✅ Problem found:", problem.title);
    // Get all test cases (including hidden ones)
    const allTestCases = problem.testCases;
    console.log("📊 Test cases count:", allTestCases.length);

    if (allTestCases.length === 0) {
      console.log("❌ No test cases available");
      return res.status(400).json({
        error: "No test cases available for this problem",
      });
    }

    // Run code against all test cases
    const results = [];
    let passedCount = 0;

    for (const testCase of allTestCases) {
      try {
        const submission = {
          source_code,
          language_id,
          stdin: testCase.input,
          cpu_time_limit: 2,
          memory_limit: 128000,
          wall_time_limit: 5,
        };

        const result = await makeJudge0Request(
          "/submissions?base64_encoded=false&wait=true",
          {
            method: "POST",
            body: JSON.stringify(submission),
          }
        );

        // Clean output for comparison
        const actualOutput = result.stdout ? result.stdout.trim() : "";
        const expectedOutput = testCase.expectedOutput.trim();
        const passed = actualOutput === expectedOutput;

        if (passed) passedCount++;

        // For submission, we don't show details of hidden test cases
        if (!testCase.isHidden) {
          results.push({
            input: testCase.input,
            expectedOutput: expectedOutput,
            actualOutput: actualOutput,
            passed: passed,
            error: result.stderr || null,
            status: result.status,
            isHidden: false,
          });
        } else {
          results.push({
            passed: passed,
            isHidden: true,
          });
        }
      } catch (error) {
        if (!testCase.isHidden) {
          results.push({
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: "",
            passed: false,
            error: error.message,
            status: { description: "Runtime Error" },
            isHidden: false,
          });
        } else {
          results.push({
            passed: false,
            isHidden: true,
          });
        }
      }
    }

    const totalCount = allTestCases.length;
    const accepted = passedCount === totalCount;

    res.json({
      success: true,
      accepted,
      passedCount,
      totalCount,
      testResults: results,
      verdict: accepted
        ? "Accepted"
        : `Wrong Answer (${passedCount}/${totalCount} test cases passed)`,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to submit code with test cases",
      message: error.message,
    });
  }
};
