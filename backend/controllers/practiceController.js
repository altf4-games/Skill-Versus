import { configDotenv } from "dotenv";

configDotenv();

const JUDGE0_BASE_URL = process.env.JUDGE0_BASE_URL;

// Helper function to get file extension based on language name
function getFileExtension(languageName) {
  const name = languageName.toLowerCase();
  if (name.includes("python")) return "py";
  if (name.includes("java")) return "java";
  if (name.includes("c++") || name.includes("cpp")) return "cpp";
  if (name.includes("c#")) return "cs";
  if (name.includes("javascript")) return "js";
  if (name.includes("typescript")) return "ts";
  if (name.includes("ruby")) return "rb";
  if (name.includes("php")) return "php";
  if (name.includes("go")) return "go";
  if (name.includes("rust")) return "rs";
  if (name.includes("swift")) return "swift";
  if (name.includes("kotlin")) return "kt";
  if (name.includes("scala")) return "scala";
  if (name.includes("c ")) return "c";
  return "txt";
}

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

    // Filter and format languages for practice mode
    // Only allow Python, C, C++, Java, JavaScript (all versions)
    const allowedLanguages = [
      71, 70, // Python 3, Python 2
      62, 91, // Java
      54, 53, 52, 76, 75, // C++ (GCC and Clang versions)
      50, 49, 48, // C (GCC versions)
      63, 93  // JavaScript (Node.js versions)
    ];

    const practiceLanguages = languages
      .filter((lang) => allowedLanguages.includes(lang.id))
      .map((lang) => ({
        id: lang.id,
        name: lang.name,
        source_file: lang.source_file || `main.${getFileExtension(lang.name)}`,
        compile_cmd: lang.compile_cmd,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      success: true,
      languages: practiceLanguages,
    });
  } catch (error) {
    console.error("Error fetching languages:", error);

    // Return fallback languages if Judge0 API fails
    const fallbackLanguages = [
      {
        id: 71,
        name: "Python (3.8.1)",
        source_file: "main.py",
        compile_cmd: null,
      },
      {
        id: 62,
        name: "Java (OpenJDK 13.0.1)",
        source_file: "Main.java",
        compile_cmd: "javac Main.java",
      },
      {
        id: 54,
        name: "C++ (GCC 9.2.0)",
        source_file: "main.cpp",
        compile_cmd: "g++ -o main main.cpp",
      },
      {
        id: 50,
        name: "C (GCC 9.2.0)",
        source_file: "main.c",
        compile_cmd: "gcc -o main main.c",
      },
      {
        id: 63,
        name: "JavaScript (Node.js 12.14.0)",
        source_file: "main.js",
        compile_cmd: null,
      },
    ];

    res.json({
      success: true,
      languages: fallbackLanguages,
    });
  }
};

// Execute code in practice mode (anonymous)
export const executeCode = async (req, res) => {
  try {
    const { source_code, language_id, stdin, expected_output } = req.body;

    if (!source_code || !language_id) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "source_code and language_id are required",
      });
    }

    // Prepare submission for Judge0
    const submission = {
      source_code,
      language_id: parseInt(language_id),
      stdin: stdin || "",
      expected_output: expected_output || null,
      cpu_time_limit: 5, // 5 seconds for practice mode
      memory_limit: 256000, // 256MB for practice mode
      wall_time_limit: 10, // 10 seconds wall time
    };

    // Submit to Judge0 and wait for result
    const result = await makeJudge0Request(
      "/submissions?base64_encoded=false&wait=true",
      {
        method: "POST",
        body: JSON.stringify(submission),
      }
    );

    // Format response for frontend
    const response = {
      success: true,
      execution: {
        stdout: result.stdout || "",
        stderr: result.stderr || "",
        compile_output: result.compile_output || "",
        status: result.status,
        time: result.time,
        memory: result.memory,
        exit_code: result.exit_code,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Practice code execution error:", error);
    res.status(500).json({
      error: "Failed to execute code",
      message: error.message,
    });
  }
};
