import { configDotenv } from "dotenv";
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
