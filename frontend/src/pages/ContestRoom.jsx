import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useUserContext } from "../contexts/UserContext";
import { useTheme } from "../contexts/ThemeContext";
import { useAntiCheat } from "../hooks/useAntiCheat";
import { useContestRealtime } from "../hooks/useContestRealtime";
import { Editor } from "@monaco-editor/react";
import FullscreenPromptModal from "../components/FullscreenPromptModal";
import { SEO } from "../components/SEO";
import { API_ENDPOINTS } from "../config/api";
import { apiClient } from "../lib/api";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Play,
  Send,
  CheckCircle,
  Shield,
  AlertTriangle,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ContestRoom = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, getToken } = useUserContext();
  const { theme } = useTheme();

  // Contest state
  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [currentProblem, setCurrentProblem] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [canRegister, setCanRegister] = useState(false);

  // Submission state
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [submitting, setSubmitting] = useState(false);

  // Store code per problem: { [problemIndex]: { [language]: code } }
  const [savedCode, setSavedCode] = useState({});

  // Code execution
  const [isRunning, setIsRunning] = useState(false);
  const [runOutput, setRunOutput] = useState(null);
  const [showOutput, setShowOutput] = useState(false);
  const [customInput, setCustomInput] = useState("");

  // Contest timing
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [contestStatus, setContestStatus] = useState("loading");
  const [serverTimeOffset, setServerTimeOffset] = useState(0);

  // Virtual contest
  const [isVirtual, setIsVirtual] = useState(
    searchParams.get("virtual") === "true"
  );
  const [virtualStartTime, setVirtualStartTime] = useState(null);

  // UI state
  const [activeTab, setActiveTab] = useState("problem");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [antiCheatWarning, setAntiCheatWarning] = useState("");
  const [showProblemList, setShowProblemList] = useState(true);
  const [exitModalOpen, setExitModalOpen] = useState(false);

  // Anti-cheat measures
  const [antiCheatViolations, setAntiCheatViolations] = useState([]);
  const [isDisqualified, setIsDisqualified] = useState(false);

  const handleAntiCheatViolation = useCallback(
    async (violation) => {
      console.log("Anti-cheat violation detected:", violation);
      setAntiCheatWarning(`Anti-cheat violation: ${violation.message}`);
      setTimeout(() => setAntiCheatWarning(""), 5000);

      setAntiCheatViolations((prev) => [
        ...prev,
        {
          ...violation,
          timestamp: new Date(),
        },
      ]);

      const seriousViolations = ["FOCUS_LOST", "TAB_SWITCH", "FULLSCREEN_EXIT"];
      if (seriousViolations.includes(violation.type)) {
        try {
          const response = await fetch(
            API_ENDPOINTS.contestAntiCheatViolation(contestId),
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${await getToken()}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                violation,
                isVirtual,
                virtualStartTime: virtualStartTime?.toISOString(),
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.disqualified) {
              setIsDisqualified(true);
              setError(
                "You have been disqualified from this contest due to anti-cheat violations."
              );
            }
          }
        } catch (err) {
          console.error("Failed to report anti-cheat violation:", err);
        }
      }
    },
    [contestId, getToken, isVirtual, virtualStartTime]
  );

  const handleAntiCheatWarning = useCallback((message) => {
    setAntiCheatWarning(message);
    setTimeout(() => setAntiCheatWarning(""), 3000);
  }, []);

  const antiCheatActive = contestStatus === "active" && isRegistered;

  const {
    isFullscreen,
    hasFocus,
    violations,
    violationCount,
    isFullscreenSupported,
    enterFullscreen,
    exitFullscreen,
  } = useAntiCheat({
    isActive: antiCheatActive,
    onViolation: handleAntiCheatViolation,
    onWarning: handleAntiCheatWarning,
    enableFullscreen: true,
    enableCopyPastePrevention: true,
    enableFocusDetection: true,
  });

  const [showFullscreenModal, setShowFullscreenModal] = useState(false);

  useEffect(() => {
    if (
      contestStatus === "active" &&
      isRegistered &&
      isFullscreenSupported &&
      !isFullscreen &&
      !exitModalOpen
    ) {
      setShowFullscreenModal(true);
    } else {
      setShowFullscreenModal(false);
    }
  }, [
    contestStatus,
    isRegistered,
    isFullscreen,
    isFullscreenSupported,
    exitModalOpen,
  ]);

  const {
    leaderboard,
    submissions,
    refreshLeaderboard,
    refreshSubmissions,
    getUserRank,
    getUserScore,
    getSubmissionStats,
    isPolling,
  } = useContestRealtime({
    contestId,
    isActive: contestStatus === "active" && (isRegistered || isVirtual),
    isVirtual,
  });

  useEffect(() => {
    fetchContestDetails();
  }, [contestId]);

  useEffect(() => {
    const checkDisqualificationStatus = async () => {
      if (!contestId || !user) return;
      try {
        const response = await fetch(
          API_ENDPOINTS.contestDisqualificationStatus(contestId),
          {
            headers: { Authorization: `Bearer ${await getToken()}` },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setIsDisqualified(data.isDisqualified);
          if (data.isDisqualified) {
            setError(
              "You have been disqualified from this contest due to anti-cheat violations."
            );
          }
        }
      } catch (err) {
        console.error("Failed to check disqualification status:", err);
      }
    };
    checkDisqualificationStatus();
  }, [contestId, user, getToken]);

  useEffect(() => {
    if (searchParams.get("virtual") === "true" && contest && !isVirtual) {
      handleStartVirtual();
    }
  }, [contest, searchParams]);

  // Fetch problems only when contest is active or finished (not upcoming)
  useEffect(() => {
    if (
      contest &&
      isRegistered &&
      (contestStatus === "active" || contestStatus === "finished")
    ) {
      fetchProblems();
    }
  }, [contest, isRegistered, contestStatus]);

  const updateTimer = useCallback(() => {
    if (!contest) return;
    const now = new Date(Date.now() + serverTimeOffset);
    let targetTime;

    if (isVirtual && virtualStartTime) {
      const virtualEnd = new Date(
        virtualStartTime.getTime() + contest.duration * 60 * 1000
      );
      targetTime = virtualEnd;
    } else {
      targetTime =
        contestStatus === "upcoming"
          ? new Date(contest.startTime)
          : new Date(contest.endTime);
    }

    const diff = targetTime - now;
    if (diff <= 0) {
      setTimeRemaining(null);
      if (contestStatus === "upcoming") {
        setContestStatus("active");
      } else if (contestStatus === "active") {
        setContestStatus("finished");
      }
    } else {
      setTimeRemaining(diff);
    }
  }, [contest, contestStatus, serverTimeOffset, isVirtual, virtualStartTime]);

  useEffect(() => {
    if (contest) {
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [contest, updateTimer]);

  useEffect(() => {
    if (
      !isRegistered &&
      !isVirtual &&
      (contestStatus === "active" || contestStatus === "finished")
    ) {
      setActiveTab("leaderboard");
    }
  }, [isRegistered, isVirtual, contestStatus]);

  // Save current code before switching problems or language
  const saveCurrentCode = useCallback(() => {
    if (problems.length > 0 && code) {
      setSavedCode((prev) => ({
        ...prev,
        [currentProblem]: {
          ...(prev[currentProblem] || {}),
          [language]: code,
        },
      }));
    }
  }, [currentProblem, language, code, problems.length]);

  // Load code for current problem/language or use template
  useEffect(() => {
    if (problems.length > 0 && currentProblem >= 0) {
      const problem = problems[currentProblem];
      // Check if we have saved code for this problem and language
      const saved = savedCode[currentProblem]?.[language];
      if (saved) {
        setCode(saved);
      } else {
        // Use template
        const template =
          problem?.languageBoilerplate?.[language] ||
          problem?.functionSignatures?.[language] ||
          problem?.functionSignature ||
          "";
        setCode(template);
      }
    }
  }, [language, currentProblem, problems, savedCode]);

  const fetchContestDetails = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.contestDetails(contestId), {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      const data = await response.json();

      if (response.ok) {
        setContest(data.contest);
        setIsRegistered(data.isRegistered);
        setCanRegister(data.canRegister);

        if (data.serverTime) {
          const serverTime = new Date(data.serverTime);
          const localTime = new Date();
          setServerTimeOffset(serverTime.getTime() - localTime.getTime());
        }

        updateContestStatus(data.contest, data.serverTime);
        setTimeout(() => updateTimer(), 100);
      } else {
        setError(data.error || "Failed to fetch contest details");
      }
    } catch (err) {
      setError("Failed to fetch contest details");
      console.error("Fetch contest error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProblems = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.contestProblems(contestId), {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      const data = await response.json();

      if (response.ok) {
        setProblems(data.problems);
        if (data.problems.length > 0) {
          setCode(data.problems[0].functionSignature?.javascript || "");
        }
        if (
          contestStatus === "active" &&
          isRegistered &&
          isFullscreenSupported
        ) {
          enterFullscreen();
        }
      }
    } catch (err) {
      console.error("Fetch problems error:", err);
    }
  };

  const updateContestStatus = (contestData, serverTime = null) => {
    const now = serverTime
      ? new Date(serverTime)
      : new Date(Date.now() + serverTimeOffset);
    const start = new Date(contestData.startTime);
    const end = new Date(contestData.endTime);

    let status;
    if (now < start) status = "upcoming";
    else if (now <= end) status = "active";
    else status = "finished";

    const finalStatus = contestData.currentStatus || status;
    setContestStatus(finalStatus);
  };

  const formatTime = (ms) => {
    if (!ms || ms <= 0) return "00:00:00";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleRegister = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.contestRegister(contestId), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getToken()}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (response.ok) {
        setIsRegistered(true);
        setCanRegister(false);
        fetchContestDetails();
      } else {
        setError(data.error || "Failed to register");
      }
    } catch (err) {
      setError("Failed to register");
    }
  };

  const handleStartVirtual = async () => {
    try {
      const response = await fetch(
        API_ENDPOINTS.contestVirtualStart(contestId),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${await getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();

      if (response.ok) {
        setIsVirtual(true);
        setVirtualStartTime(new Date(data.virtualStartTime));
        setContestStatus("active");
        fetchProblems();
      } else {
        setError(data.error || "Failed to start virtual contest");
      }
    } catch (err) {
      setError("Failed to start virtual contest");
    }
  };

  const handleExitContest = async () => {
    // Exit fullscreen first
    await exitFullscreen();
    setExitModalOpen(false);
    navigate("/contests");
  };

  const handleSubmit = async () => {
    if (!code.trim() || !problems[currentProblem]) return;
    if (isDisqualified) {
      setError("Cannot submit: You have been disqualified from this contest.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        API_ENDPOINTS.contestSubmit(contestId, problems[currentProblem].id),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${await getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            language,
            isVirtual,
            virtualStartTime: virtualStartTime?.toISOString(),
            antiCheatViolations,
          }),
        }
      );
      const data = await response.json();

      if (response.ok) {
        setActiveTab("submissions");
        refreshSubmissions();
        setError("");
      } else {
        setError(data.error || "Failed to submit code");
        if (data.disqualified) setIsDisqualified(true);
      }
    } catch (err) {
      setError("Failed to submit code");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProblemChange = (index) => {
    // Save current code before switching
    saveCurrentCode();
    setCurrentProblem(index);
  };

  const runCode = async () => {
    if (!code.trim()) {
      setError("Please write some code to run");
      return;
    }
    if (!problems[currentProblem]?.id) {
      setError("Problem information not available");
      return;
    }

    setIsRunning(true);
    setRunOutput(null);
    setError(null);

    try {
      const result = await apiClient.request("/api/judge0/run-tests", {
        method: "POST",
        body: JSON.stringify({
          source_code: code,
          language_id: getLanguageId(language),
          problem_id: problems[currentProblem].id,
          custom_input: customInput,
          contest_id: contestId,
          is_virtual: isVirtual,
          virtual_start_time: virtualStartTime?.toISOString(),
        }),
      });

      setRunOutput(result);
      setShowOutput(true);
    } catch (error) {
      setError("Failed to run code: " + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const getLanguageId = (lang) => {
    const languageMap = {
      javascript: 63,
      python: 71,
      java: 62,
      cpp: 54,
      c: 50,
    };
    return languageMap[lang] || 63;
  };

  const getMonacoLanguage = (lang) => {
    const monacoLanguageMap = {
      javascript: "javascript",
      python: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
    };
    return monacoLanguageMap[lang] || "javascript";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Contest Not Found
          </h2>
          <Button onClick={() => navigate("/contests")}>
            Back to Contests
          </Button>
        </div>
      </div>
    );
  }

  // Show registration/virtual contest UI if not registered and not participating virtually
  if (!isRegistered && !isVirtual && contestStatus !== "finished") {
    return (
      <div className="min-h-screen bg-background">
        <SEO
          title={`${contest.title} - Contest`}
          description={contest.description}
        />

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-lg shadow-lg border border-border p-8">
              <h1 className="text-3xl font-bold text-foreground mb-4">
                {contest.title}
              </h1>
              <p className="text-muted-foreground mb-6">
                {contest.description}
              </p>

              <div className="bg-muted rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      contestStatus === "upcoming"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        : contestStatus === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                    }`}
                  >
                    {contestStatus.charAt(0).toUpperCase() +
                      contestStatus.slice(1)}
                  </span>
                </div>
                {timeRemaining && (
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-muted-foreground">
                      {contestStatus === "upcoming"
                        ? "Starts in:"
                        : "Time remaining:"}
                    </span>
                    <span className="font-mono text-lg text-foreground">
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                )}
              </div>

              {canRegister && contestStatus === "upcoming" && (
                <Button onClick={handleRegister} className="w-full" size="lg">
                  Register for Contest
                </Button>
              )}

              {!canRegister && contestStatus === "upcoming" && (
                <p className="text-center text-muted-foreground">
                  Registration is closed.
                </p>
              )}

              {contestStatus === "active" && (
                <p className="text-center text-muted-foreground">
                  Contest is running. You need to have registered before the
                  contest started.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show finished contest with virtual option
  if (contestStatus === "finished" && !isVirtual) {
    return (
      <div className="min-h-screen bg-background">
        <SEO
          title={`${contest.title} - Results`}
          description={contest.description}
        />

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-lg shadow-lg border border-border p-8 mb-6">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h1 className="text-3xl font-bold text-foreground text-center mb-2">
                {contest.title}
              </h1>
              <p className="text-center text-green-600 dark:text-green-400 font-medium">
                Contest Finished
              </p>

              {contest?.allowVirtualParticipation && (
                <div className="mt-6 text-center">
                  <Button onClick={handleStartVirtual} size="lg">
                    Start Virtual Contest
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Practice with the same problems and time limit
                  </p>
                </div>
              )}
            </div>

            {/* Leaderboard */}
            <div className="bg-card rounded-lg shadow-lg border border-border">
              <div className="p-4 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">
                  Final Results
                </h2>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {leaderboard.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No submissions
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          Rank
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          Username
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                          Score
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                          Penalty
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                          Solved
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {leaderboard.map((entry) => (
                        <tr
                          key={entry.userId}
                          className={
                            entry.username === user?.username
                              ? "bg-primary/10"
                              : ""
                          }
                        >
                          <td className="px-4 py-3 text-sm font-medium">
                            #{entry.rank}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {entry.username}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-mono">
                            {entry.totalScore}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                            {entry.totalPenalty}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {entry.problemsSolved}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main contest interface - CodeChef style
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <SEO
        title={`${contest.title} - Contest`}
        description={contest.description}
      />

      {/* Anti-cheat warning toast */}
      {antiCheatWarning && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          {antiCheatWarning}
        </div>
      )}

      {/* Exit Contest Modal */}
      {exitModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4 border border-border shadow-xl">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Exit Contest?
            </h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to exit the contest? Your submissions will
              be saved, but you won't be able to make new submissions after
              leaving.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setExitModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleExitContest}
                className="flex-1"
              >
                Exit Contest
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex-shrink-0 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Left: Contest info */}
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-foreground truncate max-w-[300px]">
              {contest.title}
            </h1>
            {isVirtual && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 text-xs rounded-full">
                Virtual
              </span>
            )}
          </div>

          {/* Center: Timer */}
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <span
              className={`font-mono text-xl font-bold ${
                timeRemaining && timeRemaining < 300000
                  ? "text-red-500 animate-pulse"
                  : "text-foreground"
              }`}
            >
              {formatTime(timeRemaining)}
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {antiCheatActive && (
              <div className="flex items-center gap-1 text-sm">
                <Shield
                  className={`w-4 h-4 ${
                    hasFocus && isFullscreen
                      ? "text-green-500"
                      : "text-yellow-500"
                  }`}
                />
                <span className="text-muted-foreground hidden sm:inline">
                  Anti-cheat active
                </span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExitModalOpen(true)}
              className="text-red-500 border-red-500 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Exit
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-border">
          {["problem", "leaderboard", "submissions"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "problem"
                ? "Problems"
                : tab === "leaderboard"
                ? "Leaderboard"
                : "My Submissions"}
              {tab === "submissions" && ` (${submissions.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Disqualification Banner */}
      {isDisqualified && (
        <div className="flex-shrink-0 bg-red-500/10 border-b border-red-500 px-4 py-2 flex items-center gap-2 text-red-500">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">
            Disqualified - You cannot submit solutions
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === "problem" && (
          <>
            {/* Problem Panel */}
            <div
              className={`${
                showProblemList ? "w-[40%]" : "w-[25%]"
              } flex-shrink-0 flex flex-col border-r border-border transition-all duration-300`}
            >
              {/* Problem Tabs */}
              <div className="flex-shrink-0 flex items-center bg-muted/50 border-b border-border">
                <button
                  onClick={() => setShowProblemList(!showProblemList)}
                  className="p-2 hover:bg-muted transition-colors flex-shrink-0"
                  title={
                    showProblemList
                      ? "Collapse problem list"
                      : "Expand problem list"
                  }
                >
                  {showProblemList ? (
                    <ChevronLeft className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                <div className="flex overflow-x-auto flex-1 scrollbar-none">
                  {problems.map((problem, index) => (
                    <button
                      key={problem.id}
                      onClick={() => handleProblemChange(index)}
                      className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                        currentProblem === index
                          ? "border-primary text-primary bg-primary/5"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                      title={problem.title}
                    >
                      {String.fromCharCode(65 + index)}
                      {showProblemList && (
                        <span className="ml-1 truncate max-w-[80px] inline-block align-bottom">
                          {problem.title}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Problem Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {problems[currentProblem] && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-foreground mb-1">
                        {String.fromCharCode(65 + currentProblem)}.{" "}
                        {problems[currentProblem].title}
                      </h2>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-xs rounded ${
                            problems[currentProblem].difficulty === "Easy"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : problems[currentProblem].difficulty === "Medium"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {problems[currentProblem].difficulty}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {problems[currentProblem].points} pts
                        </span>
                      </div>
                    </div>

                    <div className="prose dark:prose-invert max-w-none text-sm">
                      <div className="whitespace-pre-wrap text-foreground">
                        {problems[currentProblem].description}
                      </div>
                    </div>

                    {problems[currentProblem].examples && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-3">
                          Examples
                        </h3>
                        {problems[currentProblem].examples.map(
                          (example, idx) => (
                            <div
                              key={idx}
                              className="bg-muted rounded-lg p-3 mb-3 text-sm"
                            >
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Input
                                  </div>
                                  <pre className="bg-background p-2 rounded text-foreground font-mono text-xs overflow-x-auto">
                                    {example.input}
                                  </pre>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Output
                                  </div>
                                  <pre className="bg-background p-2 rounded text-foreground font-mono text-xs overflow-x-auto">
                                    {example.output}
                                  </pre>
                                </div>
                              </div>
                              {example.explanation && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  <span className="font-medium">
                                    Explanation:
                                  </span>{" "}
                                  {example.explanation}
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {problems[currentProblem].constraints && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">
                          Constraints
                        </h3>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {problems[currentProblem].constraints}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Code Editor Panel */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Editor Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
                <select
                  value={language}
                  onChange={(e) => {
                    saveCurrentCode();
                    setLanguage(e.target.value);
                  }}
                  className="bg-background border border-border text-foreground text-sm rounded px-3 py-1.5"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="c">C</option>
                </select>

                <div className="flex items-center gap-2">
                  {!isDisqualified && (
                    <Button
                      onClick={runCode}
                      disabled={isRunning || !code.trim() || !isFullscreen}
                      variant="outline"
                      size="sm"
                      title={
                        !isFullscreen ? "Enable fullscreen to run code" : ""
                      }
                    >
                      <Play className="w-4 h-4 mr-1" />
                      {isRunning ? "Running..." : "Run"}
                    </Button>
                  )}
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      submitting ||
                      !code.trim() ||
                      isDisqualified ||
                      !isFullscreen
                    }
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    title={
                      !isFullscreen
                        ? "Enable fullscreen to submit"
                        : isDisqualified
                        ? "Cannot submit - you have been disqualified"
                        : ""
                    }
                  >
                    <Send className="w-4 h-4 mr-1" />
                    {submitting ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </div>

              {/* Monaco Editor - Takes most of the space */}
              <div className="flex-1 min-h-0">
                <Editor
                  height="100%"
                  language={getMonacoLanguage(language)}
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  theme={theme === "dark" ? "vs-dark" : "light"}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: "on",
                    wordWrap: "on",
                    automaticLayout: true,
                    readOnly: submitting,
                    contextmenu: false,
                    padding: { top: 10 },
                  }}
                />
              </div>

              {/* Output Panel (collapsible) */}
              {showOutput && runOutput && (
                <div className="flex-shrink-0 border-t border-border bg-muted/50 max-h-[200px] overflow-y-auto">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border sticky top-0 bg-muted/50">
                    <h4 className="text-sm font-medium text-foreground">
                      Test Results ({runOutput.passedCount}/
                      {runOutput.totalCount} passed)
                    </h4>
                    <button
                      onClick={() => setShowOutput(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-3">
                    {runOutput.testResults?.map((result, index) => (
                      <div
                        key={index}
                        className="mb-3 last:mb-0 p-2 bg-background rounded text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">Test {index + 1}</span>
                          <span
                            className={`px-2 py-0.5 rounded ${
                              result.passed
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {result.passed ? "PASS" : "FAIL"}
                          </span>
                        </div>
                        {!result.passed && (
                          <div className="space-y-1 mt-2">
                            <div>
                              <span className="text-muted-foreground">
                                Expected:
                              </span>{" "}
                              <code className="text-foreground">
                                {result.expectedOutput}
                              </code>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Got:
                              </span>{" "}
                              <code
                                className={
                                  result.passed
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {result.actualOutput || "(no output)"}
                              </code>
                            </div>
                            {result.error && (
                              <div className="text-red-500">
                                Error: {result.error}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Input */}
              <div className="flex-shrink-0 border-t border-border p-3 bg-muted/50">
                <div className="text-xs text-muted-foreground mb-1">
                  Custom Input (optional)
                </div>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Enter test input..."
                  className="w-full h-16 px-2 py-1 text-sm bg-background border border-border rounded text-foreground resize-none"
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "leaderboard" && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">
                  Leaderboard
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshLeaderboard}
                >
                  Refresh
                </Button>
              </div>
              {getUserRank() && (
                <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                  <span className="text-sm text-muted-foreground">
                    Your rank:{" "}
                  </span>
                  <span className="font-bold text-foreground">
                    #{getUserRank()}
                  </span>
                  <span className="text-sm text-muted-foreground ml-4">
                    Score:{" "}
                  </span>
                  <span className="font-bold text-foreground">
                    {getUserScore()?.totalScore || 0}
                  </span>
                </div>
              )}
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                {leaderboard.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No submissions yet
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          Rank
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          Username
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                          Score
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                          Penalty
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                          Solved
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {leaderboard.map((entry) => (
                        <tr
                          key={entry.userId}
                          className={
                            entry.username === user?.username
                              ? "bg-primary/10"
                              : ""
                          }
                        >
                          <td className="px-4 py-3 text-sm font-medium">
                            #{entry.rank}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {entry.username}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-mono">
                            {entry.totalScore}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                            {entry.totalPenalty}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {entry.problemsSolved}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "submissions" && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">
                  My Submissions
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshSubmissions}
                >
                  Refresh
                </Button>
              </div>
              {(() => {
                const stats = getSubmissionStats();
                return (
                  <div className="mb-4 text-sm text-muted-foreground">
                    {stats.total} submissions | {stats.accepted} accepted |{" "}
                    {stats.acceptanceRate}% success rate
                  </div>
                );
              })()}
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                {submissions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No submissions yet
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {submissions.map((submission) => (
                      <div
                        key={submission._id}
                        className="p-4 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-foreground">
                            {submission.problemId?.title || "Problem"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(
                              submission.submissionTime
                            ).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              submission.status === "accepted"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : submission.status === "pending" ||
                                  submission.status === "judging"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {submission.verdict ||
                              submission.status.toUpperCase()}
                          </div>
                          {submission.isAccepted && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {submission.points} pts
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      <FullscreenPromptModal
        isOpen={showFullscreenModal}
        onEnterFullscreen={() => setShowFullscreenModal(false)}
        onClose={() => setShowFullscreenModal(false)}
      />
    </div>
  );
};

export default ContestRoom;
