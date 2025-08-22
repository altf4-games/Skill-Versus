import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserContext } from '../contexts/UserContext';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { useContestRealtime } from '../hooks/useContestRealtime';
import CodeEditor from '../components/CodeEditor';
import { SEO } from '../components/SEO';
import { API_ENDPOINTS } from '../config/api';
import { apiClient } from '../lib/api';

const ContestRoom = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const { user, getToken } = useUserContext();
  
  // Contest state
  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [currentProblem, setCurrentProblem] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [canRegister, setCanRegister] = useState(false);
  
  // Submission state
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [submitting, setSubmitting] = useState(false);

  // Code execution
  const [isRunning, setIsRunning] = useState(false);
  const [runOutput, setRunOutput] = useState(null);
  const [showOutput, setShowOutput] = useState(false);
  const [customInput, setCustomInput] = useState('');
  
  // Contest timing
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [contestStatus, setContestStatus] = useState('loading');
  const [serverTimeOffset, setServerTimeOffset] = useState(0); // Offset between server and local time
  
  // Virtual contest
  const [isVirtual, setIsVirtual] = useState(false);
  const [virtualStartTime, setVirtualStartTime] = useState(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState('problem');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [antiCheatWarning, setAntiCheatWarning] = useState('');

  // Anti-cheat measures
  const [antiCheatViolations, setAntiCheatViolations] = useState([]);

  const handleAntiCheatViolation = useCallback((violation) => {
    console.log('Anti-cheat violation detected:', violation);
    setAntiCheatWarning(`Anti-cheat violation: ${violation.message}`);
    setTimeout(() => setAntiCheatWarning(''), 5000);

    // Track violations for submission
    setAntiCheatViolations(prev => [...prev, {
      ...violation,
      timestamp: new Date(),
    }]);
  }, []);

  const handleAntiCheatWarning = useCallback((message) => {
    setAntiCheatWarning(message);
    setTimeout(() => setAntiCheatWarning(''), 3000);
  }, []);

  const antiCheatActive = contestStatus === 'active' && isRegistered;

  const {
    isFullscreen,
    hasFocus,
    violations,
    violationCount,
    isFullscreenSupported
  } = useAntiCheat({
    isActive: antiCheatActive,
    onViolation: handleAntiCheatViolation,
    onWarning: handleAntiCheatWarning,
    enableFullscreen: true,
    enableCopyPastePrevention: true,
    enableFocusDetection: true
  });

  // Real-time contest features
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
    isActive: contestStatus === 'active' && (isRegistered || isVirtual),
    isVirtual,
  });

  useEffect(() => {
    fetchContestDetails();
  }, [contestId]);

  useEffect(() => {
    if (contest && isRegistered) {
      fetchProblems();
    }
  }, [contest, isRegistered]);

  // Timer function - defined before useEffect to avoid temporal dead zone
  const updateTimer = useCallback(() => {
    if (!contest) return;

    // Use server time with offset for accurate timing
    const now = new Date(Date.now() + serverTimeOffset);
    let targetTime;

    if (isVirtual && virtualStartTime) {
      const virtualEnd = new Date(virtualStartTime.getTime() + contest.duration * 60 * 1000);
      targetTime = virtualEnd;
    } else {
      targetTime = contestStatus === 'upcoming'
        ? new Date(contest.startTime)
        : new Date(contest.endTime);
    }

    const diff = targetTime - now;

    if (diff <= 0) {
      setTimeRemaining(null);
      if (contestStatus === 'upcoming') {
        setContestStatus('active');
      } else if (contestStatus === 'active') {
        setContestStatus('finished');
      }
    } else {
      setTimeRemaining(diff);
    }
  }, [contest, contestStatus, serverTimeOffset, isVirtual, virtualStartTime]);

  useEffect(() => {
    if (contest) {
      // Initial timer update
      updateTimer();
      // Set up interval
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [contest, updateTimer]);

  // Auto-switch to leaderboard for unregistered users
  useEffect(() => {
    if (!isRegistered && !isVirtual && (contestStatus === 'active' || contestStatus === 'finished')) {
      setActiveTab('leaderboard');
    }
  }, [isRegistered, isVirtual, contestStatus]);

  // Update code template when language changes
  useEffect(() => {
    if (problems.length > 0 && currentProblem >= 0) {
      const problem = problems[currentProblem];
      // Use languageBoilerplate (full driver code) if available, otherwise fallback to functionSignatures
      const template = problem?.languageBoilerplate?.[language] ||
                      problem?.functionSignatures?.[language] ||
                      problem?.functionSignature || '';
      setCode(template);
    }
  }, [language, problems, currentProblem]);

  const fetchContestDetails = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.contestDetails(contestId), {
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setContest(data.contest);
        setIsRegistered(data.isRegistered);
        setCanRegister(data.canRegister);

        // Calculate server time offset if server time is provided
        if (data.serverTime) {
          const serverTime = new Date(data.serverTime);
          const localTime = new Date();
          setServerTimeOffset(serverTime.getTime() - localTime.getTime());
        }

        updateContestStatus(data.contest, data.serverTime);

        // Start timer immediately after loading contest data
        setTimeout(() => {
          updateTimer();
        }, 100);
      } else {
        setError(data.error || 'Failed to fetch contest details');
      }
    } catch (err) {
      setError('Failed to fetch contest details');
      console.error('Fetch contest error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProblems = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.contestProblems(contestId), {
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setProblems(data.problems);
        if (data.problems.length > 0) {
          setCode(data.problems[0].functionSignature?.javascript || '');
        }
      } else {
        console.error('Failed to fetch problems:', data.error);
      }
    } catch (err) {
      console.error('Fetch problems error:', err);
    }
  };



  const updateContestStatus = (contestData, serverTime = null) => {
    // Use server time if provided, otherwise use local time with offset
    const now = serverTime ? new Date(serverTime) : new Date(Date.now() + serverTimeOffset);
    const start = new Date(contestData.startTime);
    const end = new Date(contestData.endTime);

    let status;
    if (now < start) {
      status = 'upcoming';
    } else if (now <= end) {
      status = 'active';
    } else {
      status = 'finished';
    }

    // Use server-provided status if available, otherwise calculate
    const finalStatus = contestData.currentStatus || status;
    setContestStatus(finalStatus);
  };



  const formatTime = (ms) => {
    if (!ms || ms <= 0) return '00:00:00';

    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRegister = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.contestRegister(contestId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (response.ok) {
        setIsRegistered(true);
        setCanRegister(false);
        fetchContestDetails();
      } else {
        setError(data.error || 'Failed to register');
      }
    } catch (err) {
      setError('Failed to register');
      console.error('Register error:', err);
    }
  };

  const handleStartVirtual = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.contestVirtualStart(contestId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (response.ok) {
        setIsVirtual(true);
        setVirtualStartTime(new Date(data.virtualStartTime));
        setContestStatus('active');
        fetchProblems();
      } else {
        setError(data.error || 'Failed to start virtual contest');
      }
    } catch (err) {
      setError('Failed to start virtual contest');
      console.error('Start virtual error:', err);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim() || !problems[currentProblem]) return;

    try {
      setSubmitting(true);
      const response = await fetch(API_ENDPOINTS.contestSubmit(contestId, problems[currentProblem].id), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          isVirtual,
          virtualStartTime: virtualStartTime?.toISOString(),
          antiCheatViolations: antiCheatViolations,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setActiveTab('submissions');
        refreshSubmissions();
        // Show success message
        setError('');
      } else {
        setError(data.error || 'Failed to submit code');
      }
    } catch (err) {
      setError('Failed to submit code');
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProblemChange = (index) => {
    setCurrentProblem(index);
    const problem = problems[index];
    // Use languageBoilerplate (full driver code) if available, otherwise fallback to functionSignatures
    const template = problem?.languageBoilerplate?.[language] ||
                    problem?.functionSignatures?.[language] ||
                    problem?.functionSignature || '';
    setCode(template);
  };

  const runCode = async () => {
    if (!code.trim()) {
      setError('Please write some code to run');
      return;
    }

    if (!problems[currentProblem]?.id) {
      setError('Problem information not available');
      return;
    }

    setIsRunning(true);
    setRunOutput(null);
    setError(null);

    try {
      const result = await apiClient.request('/api/judge0/run-tests', {
        method: 'POST',
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
      console.error('Failed to run code:', error);
      setError('Failed to run code: ' + error.message);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contest Not Found</h2>
          <button
            onClick={() => navigate('/contests')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Contests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEO title={`${contest.title} - Contest`} description={contest.description} />
      
      {/* Anti-cheat warning */}
      {antiCheatWarning && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {antiCheatWarning}
        </div>
      )}

      {/* Contest Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {contest.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {contest.description}
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0 text-right">
              <div className="text-lg font-mono text-gray-900 dark:text-white">
                {timeRemaining ? formatTime(timeRemaining) : '00:00:00'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {contestStatus === 'upcoming' && 'Starts in'}
                {contestStatus === 'active' && 'Time remaining'}
                {contestStatus === 'finished' && 'Contest ended'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contest Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Registration/Virtual Contest */}
        {!isRegistered && !isVirtual && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            {canRegister && contestStatus === 'upcoming' && (
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Register for Contest
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You need to register before the contest starts to participate.
                </p>
                <button
                  onClick={handleRegister}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Register Now
                </button>
              </div>
            )}

            {!canRegister && contestStatus === 'upcoming' && (
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Registration Closed
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Registration for this contest is no longer available.
                </p>
              </div>
            )}

            {contestStatus === 'active' && (
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Contest is Active
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  This contest is currently running. You can view the leaderboard but cannot participate since you didn't register.
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Registration was required before the contest started.
                </div>
              </div>
            )}

            {contestStatus === 'finished' && contest.allowVirtualParticipation && (
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Virtual Contest
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  This contest has ended, but you can participate virtually.
                </p>
                <button
                  onClick={handleStartVirtual}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Start Virtual Contest
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Contest Interface - Show for registered users or when contest is active/finished */}
        {(isRegistered || isVirtual || contestStatus === 'active' || contestStatus === 'finished') && (
          <div>
            {/* Contest Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                  {(isRegistered || isVirtual) && (
                    <button
                      onClick={() => setActiveTab('problem')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'problem'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      Problems
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('leaderboard')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'leaderboard'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Leaderboard
                    {isPolling && (
                      <span className="ml-1 inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    )}
                  </button>
                  {(isRegistered || isVirtual) && (
                    <button
                      onClick={() => setActiveTab('submissions')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'submissions'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      My Submissions ({submissions.length})
                    </button>
                  )}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'problem' && (
              <div>
                {(isRegistered || isVirtual) && problems.length > 0 && (contestStatus === 'active' || contestStatus === 'finished' || isVirtual) ? (
                  <div>
                    {/* Contest Finished Message */}
                    {contestStatus === 'finished' && (
                      <div className="mb-6 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Contest Completed
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            This contest has ended. View the final results below or start a virtual contest to practice.
                          </p>
                          {contest?.allowVirtualParticipation && !isVirtual && (
                            <button
                              onClick={() => {
                                window.location.href = `/contests/${contestId}?virtual=true`;
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                            >
                              Start Virtual Contest
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className={`grid grid-cols-1 gap-6 ${contestStatus === 'finished' ? 'lg:grid-cols-1' : 'lg:grid-cols-2'}`}>
            {/* Left Panel - Problem */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {/* Problem Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex overflow-x-auto">
                  {problems.map((problem, index) => (
                    <button
                      key={problem.id}
                      onClick={() => handleProblemChange(index)}
                      className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                        currentProblem === index
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {String.fromCharCode(65 + index)}. {problem.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Problem Content */}
              <div className="p-6 max-h-96 overflow-y-auto">
                {problems[currentProblem] && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {problems[currentProblem].title}
                    </h3>
                    
                    <div className="prose dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap">
                        {problems[currentProblem].description}
                      </div>
                    </div>

                    {problems[currentProblem].examples && (
                      <div className="mt-6">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Examples:</h4>
                        {problems[currentProblem].examples.map((example, idx) => (
                          <div key={idx} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-3">
                            <div className="text-sm">
                              <div><strong>Input:</strong> {example.input}</div>
                              <div><strong>Output:</strong> {example.output}</div>
                              {example.explanation && (
                                <div><strong>Explanation:</strong> {example.explanation}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {problems[currentProblem].constraints && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Constraints:</h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {problems[currentProblem].constraints}
                        </div>
                      </div>
                    )}

                    {/* Submission Instructions */}
                    <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">📝 How to Submit</h4>
                      <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                        <li>• Complete the function template provided in the code editor</li>
                        <li>• Use the <strong>Run</strong> button to test your code with examples</li>
                        <li>• Add custom test cases in the input box below the editor</li>
                        <li>• Click <strong>Submit</strong> when ready - your code will be tested against hidden test cases</li>
                        <li>• You can submit multiple times, but each submission counts toward your penalty</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Code Editor (Hidden when contest finished) */}
            {contestStatus !== 'finished' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {/* Editor Header */}
              <div className="border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex justify-between items-center">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                  </select>

                  <div className="flex space-x-2">
                    <button
                      onClick={runCode}
                      disabled={isRunning || !code.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      {isRunning ? 'Running...' : 'Run'}
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || !code.trim()}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Code Editor */}
              <div className="h-96">
                <CodeEditor
                  value={code}
                  onChange={setCode}
                  language={language}
                  height="100%"
                  options={{
                    readOnly: submitting,
                  }}
                />
              </div>

              {/* Custom Input */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Input (Optional)
                </label>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Enter custom input for testing..."
                  className="w-full h-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                />
              </div>

              {/* Output Display */}
              {showOutput && runOutput && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Test Results ({runOutput.passedCount}/{runOutput.totalCount} passed)
                    </h4>
                    <button
                      onClick={() => setShowOutput(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 max-h-60 overflow-y-auto">
                    {runOutput.testResults?.map((result, index) => (
                      <div key={index} className="mb-4 last:mb-0 border-b border-gray-200 dark:border-gray-600 last:border-b-0 pb-3 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Test Case {index + 1}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                            result.passed
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {result.passed ? '✓ PASS' : '✗ FAIL'}
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Input:</span>
                            <pre className="mt-1 text-gray-900 dark:text-white bg-white dark:bg-gray-700 p-2 rounded border font-mono">{result.input}</pre>
                          </div>

                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Expected:</span>
                            <pre className="mt-1 text-gray-900 dark:text-white bg-white dark:bg-gray-700 p-2 rounded border font-mono">{result.expectedOutput}</pre>
                          </div>

                          <div>
                            <span className={`font-medium ${result.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              Your Output:
                            </span>
                            <pre className={`mt-1 p-2 rounded border font-mono ${
                              result.passed
                                ? 'text-green-900 dark:text-green-100 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                : 'text-red-900 dark:text-red-100 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            }`}>{result.actualOutput || '(no output)'}</pre>
                          </div>

                          {result.error && (
                            <div>
                              <span className="font-medium text-red-600 dark:text-red-400">Error:</span>
                              <pre className="mt-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border font-mono">{result.error}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
          </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Problems Not Available
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {contestStatus === 'upcoming' && isRegistered
                        ? 'You are registered! Problems will be available when the contest starts.'
                        : contestStatus === 'upcoming'
                        ? 'Problems will be available when the contest starts and you are registered.'
                        : 'You need to be registered to view contest problems.'
                      }
                    </p>
                    {contestStatus === 'upcoming' && isRegistered && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Waiting for contest to start...
                          </span>
                        </div>
                        {timeRemaining && (
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-2 text-center">
                            Contest starts in: {formatTime(timeRemaining)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {contestStatus === 'finished' ? 'Final Results' : 'Leaderboard'}
                    </h3>
                    {contestStatus !== 'finished' && (
                      <button
                        onClick={refreshLeaderboard}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Refresh
                      </button>
                    )}
                  </div>
                  {getUserRank() && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Your rank: #{getUserRank()} | Score: {getUserScore()?.totalScore || 0}
                    </div>
                  )}
                  {contestStatus === 'finished' && (
                    <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                          Contest Finished
                        </span>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Final results are displayed below. CP ratings have been updated.
                      </p>
                      {contest?.allowVirtualParticipation && !isVirtual && (
                        <div className="mt-3">
                          <button
                            onClick={() => {
                              // Start virtual contest
                              window.location.href = `/contests/${contestId}?virtual=true`;
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Start Virtual Contest
                          </button>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Practice with the same problems and time limit
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {leaderboard.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No submissions yet
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {leaderboard.map((entry, index) => (
                        <div
                          key={entry.userId}
                          className={`p-4 ${
                            entry.username === user?.username
                              ? 'bg-blue-50 dark:bg-blue-900/20'
                              : ''
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                              <span className="font-mono text-sm text-gray-500 dark:text-gray-400 w-8">
                                #{entry.rank}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {entry.username}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="font-mono text-sm text-gray-900 dark:text-white">
                                {entry.totalScore} pts
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {entry.problemsSolved} solved | {entry.totalPenalty} penalty
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submissions Tab */}
            {activeTab === 'submissions' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      My Submissions
                    </h3>
                    <button
                      onClick={refreshSubmissions}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Refresh
                    </button>
                  </div>
                  {(() => {
                    const stats = getSubmissionStats();
                    return (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {stats.total} submissions | {stats.accepted} accepted | {stats.acceptanceRate}% success rate
                      </div>
                    );
                  })()}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {submissions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No submissions yet
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {submissions.map((submission) => (
                        <div key={submission._id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {submission.problemId?.title || 'Problem'}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {new Date(submission.submissionTime).toLocaleString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                submission.status === 'accepted'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : submission.status === 'pending' || submission.status === 'judging'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              }`}>
                                {submission.verdict || submission.status.toUpperCase()}
                              </div>
                              {submission.isAccepted && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {submission.points} pts
                                </div>
                              )}
                            </div>
                          </div>
                          {submission.passedTestCases !== undefined && (
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              Test cases: {submission.passedTestCases}/{submission.totalTestCases}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestRoom;
