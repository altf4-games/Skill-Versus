import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';

export default function AdminPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('problems');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const token = await getToken();
        const response = await apiClient.getUserProfile(token);
        if (response.success && response.user) {
          setUser(response.user);
          if (!response.user.contestAdmin) {
            navigate('/');
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Failed to verify admin status:', error);
        navigate('/');
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAdminStatus();
  }, [getToken, navigate]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.contestAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
          <p className="mt-2 text-gray-400">You do not have admin privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-300">Manage contests, problems, and users</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['problems', 'contests', 'disqualifications', 'users'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 rounded-lg p-6">
          {activeTab === 'problems' && <ProblemsTab getToken={getToken} />}
          {activeTab === 'contests' && <ContestsTab getToken={getToken} />}
          {activeTab === 'disqualifications' && <DisqualificationsTab getToken={getToken} />}
          {activeTab === 'users' && <UsersTab getToken={getToken} />}
        </div>
      </div>
    </div>
  );
}

// Problems Tab Component
function ProblemsTab({ getToken }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'Easy',
    timeLimit: 2000,
    memoryLimit: 256,
    constraints: '',
    tags: '',
    examples: [{ input: '', output: '', explanation: '' }],
    testCases: [{ input: '', output: '', isHidden: false }],
  });

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/problems`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setProblems(data.problems || []);
    } catch (error) {
      console.error('Failed to fetch problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProblem = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        examples: formData.examples.filter(ex => ex.input && ex.output),
        testCases: formData.testCases.filter(tc => tc.input && tc.output),
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/problems`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Problem created successfully!');
        setShowCreateForm(false);
        fetchProblems();
        // Reset form
        setFormData({
          title: '',
          description: '',
          difficulty: 'Easy',
          timeLimit: 2000,
          memoryLimit: 256,
          constraints: '',
          tags: '',
          examples: [{ input: '', output: '', explanation: '' }],
          testCases: [{ input: '', output: '', isHidden: false }],
        });
      } else {
        const error = await response.json();
        alert(`Failed to create problem: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create problem:', error);
      alert('Failed to create problem');
    } finally {
      setLoading(false);
    }
  };

  const toggleContestOnly = async (problemId, currentStatus) => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/problems/${problemId}/contest-only`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isContestOnly: !currentStatus }),
        }
      );

      if (response.ok) {
        fetchProblems();
      }
    } catch (error) {
      console.error('Failed to toggle contest-only:', error);
    }
  };

  const addExample = () => {
    setFormData({
      ...formData,
      examples: [...formData.examples, { input: '', output: '', explanation: '' }],
    });
  };

  const addTestCase = () => {
    setFormData({
      ...formData,
      testCases: [...formData.testCases, { input: '', output: '', isHidden: false }],
    });
  };

  if (loading && !showCreateForm) {
    return <div className="text-white text-center">Loading problems...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Contest Problems</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          {showCreateForm ? 'Cancel' : 'Create New Problem'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateProblem} className="mb-8 bg-gray-700 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-4">Create Contest Problem</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-white mb-2">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-600"
              />
            </div>
            <div>
              <label className="block text-white mb-2">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-600"
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-white mb-2">Description *</label>
            <textarea
              required
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-600"
            />
          </div>

          <div className="mb-4">
            <label className="block text-white mb-2">Constraints</label>
            <textarea
              rows={3}
              value={formData.constraints}
              onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-600"
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-white mb-2">Time Limit (ms)</label>
              <input
                type="number"
                value={formData.timeLimit}
                onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-600"
              />
            </div>
            <div>
              <label className="block text-white mb-2">Memory Limit (MB)</label>
              <input
                type="number"
                value={formData.memoryLimit}
                onChange={(e) => setFormData({ ...formData, memoryLimit: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-600"
              />
            </div>
            <div>
              <label className="block text-white mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-600"
                placeholder="array, hash-table"
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-white">Examples *</label>
              <button
                type="button"
                onClick={addExample}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Example
              </button>
            </div>
            {formData.examples.map((example, idx) => (
              <div key={idx} className="mb-3 p-3 bg-gray-800 rounded">
                <input
                  type="text"
                  placeholder="Input"
                  value={example.input}
                  onChange={(e) => {
                    const newExamples = [...formData.examples];
                    newExamples[idx].input = e.target.value;
                    setFormData({ ...formData, examples: newExamples });
                  }}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded mb-2"
                />
                <input
                  type="text"
                  placeholder="Output"
                  value={example.output}
                  onChange={(e) => {
                    const newExamples = [...formData.examples];
                    newExamples[idx].output = e.target.value;
                    setFormData({ ...formData, examples: newExamples });
                  }}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded mb-2"
                />
                <input
                  type="text"
                  placeholder="Explanation (optional)"
                  value={example.explanation}
                  onChange={(e) => {
                    const newExamples = [...formData.examples];
                    newExamples[idx].explanation = e.target.value;
                    setFormData({ ...formData, examples: newExamples });
                  }}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                />
              </div>
            ))}
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-white">Test Cases *</label>
              <button
                type="button"
                onClick={addTestCase}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Test Case
              </button>
            </div>
            {formData.testCases.map((testCase, idx) => (
              <div key={idx} className="mb-3 p-3 bg-gray-800 rounded flex gap-2">
                <input
                  type="text"
                  placeholder="Input"
                  value={testCase.input}
                  onChange={(e) => {
                    const newTestCases = [...formData.testCases];
                    newTestCases[idx].input = e.target.value;
                    setFormData({ ...formData, testCases: newTestCases });
                  }}
                  className="flex-1 px-3 py-2 bg-gray-700 text-white rounded"
                />
                <input
                  type="text"
                  placeholder="Expected Output"
                  value={testCase.output}
                  onChange={(e) => {
                    const newTestCases = [...formData.testCases];
                    newTestCases[idx].output = e.target.value;
                    setFormData({ ...formData, testCases: newTestCases });
                  }}
                  className="flex-1 px-3 py-2 bg-gray-700 text-white rounded"
                />
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={testCase.isHidden}
                    onChange={(e) => {
                      const newTestCases = [...formData.testCases];
                      newTestCases[idx].isHidden = e.target.checked;
                      setFormData({ ...formData, testCases: newTestCases });
                    }}
                    className="mr-2"
                  />
                  Hidden
                </label>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Problem'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-white">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Difficulty</th>
              <th className="px-4 py-3 text-left">Contest Only</th>
              <th className="px-4 py-3 text-left">Created By</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem) => (
              <tr key={problem._id} className="border-b border-gray-700">
                <td className="px-4 py-3">{problem.title}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    problem.difficulty === 'Easy' ? 'bg-green-600' :
                    problem.difficulty === 'Medium' ? 'bg-yellow-600' :
                    'bg-red-600'
                  }`}>
                    {problem.difficulty}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {problem.isContestOnly ? '✅ Yes' : '❌ No'}
                </td>
                <td className="px-4 py-3">{problem.createdByUsername || 'N/A'}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleContestOnly(problem._id, problem.isContestOnly)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Toggle Contest-Only
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Contests Tab Component
function ContestsTab({ getToken }) {
  const [contests, setContests] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedContest, setSelectedContest] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    duration: 120,
    problems: [],
    maxParticipants: null,
    isPublic: true,
    allowVirtualParticipation: true,
    penaltyPerWrongSubmission: 20,
    maxSubmissionsPerProblem: 50,
  });

  useEffect(() => {
    fetchContests();
    fetchProblems();
  }, []);

  const fetchContests = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/contests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setContests(data.contests || []);
    } catch (error) {
      console.error('Failed to fetch contests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProblems = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/problems`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setProblems(data.problems || []);
    } catch (error) {
      console.error('Failed to fetch problems:', error);
    }
  };

  const fetchLeaderboard = async (contestId) => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/contests/${contestId}/leaderboard`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setLeaderboard(data);
      setSelectedContest(contestId);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  const handleCreateContest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/contests`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Contest created successfully!\nShare Link: ${data.contest.shareLink}`);
        setShowCreateForm(false);
        fetchContests();
      } else {
        const error = await response.json();
        alert(`Failed to create contest: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create contest:', error);
      alert('Failed to create contest');
    } finally {
      setLoading(false);
    }
  };

  const addProblem = () => {
    setFormData({
      ...formData,
      problems: [...formData.problems, { problemId: '', points: 100, order: formData.problems.length + 1 }],
    });
  };

  if (loading && !showCreateForm) {
    return <div className="text-white text-center">Loading contests...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Contests</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          {showCreateForm ? 'Cancel' : 'Create New Contest'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateContest} className="mb-8 bg-gray-700 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-4">Create Contest</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-white mb-2">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-600"
              />
            </div>
            <div>
              <label className="block text-white mb-2">Start Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-600"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-white mb-2">Description *</label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-white mb-2">Duration (minutes) *</label>
              <input
                type="number"
                required
                min="30"
                max="300"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-600"
              />
            </div>
            <div>
              <label className="block text-white mb-2">Max Participants</label>
              <input
                type="number"
                placeholder="Unlimited"
                value={formData.maxParticipants || ''}
                onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-600"
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-white">Problems *</label>
              <button
                type="button"
                onClick={addProblem}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Problem
              </button>
            </div>
            {formData.problems.map((problem, idx) => (
              <div key={idx} className="mb-3 p-3 bg-gray-800 rounded flex gap-2">
                <select
                  required
                  value={problem.problemId}
                  onChange={(e) => {
                    const newProblems = [...formData.problems];
                    newProblems[idx].problemId = e.target.value;
                    setFormData({ ...formData, problems: newProblems });
                  }}
                  className="flex-1 px-3 py-2 bg-gray-700 text-white rounded"
                >
                  <option value="">Select Problem</option>
                  {problems.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title} ({p.difficulty})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Points"
                  required
                  value={problem.points}
                  onChange={(e) => {
                    const newProblems = [...formData.problems];
                    newProblems[idx].points = parseInt(e.target.value);
                    setFormData({ ...formData, problems: newProblems });
                  }}
                  className="w-24 px-3 py-2 bg-gray-700 text-white rounded"
                />
                <input
                  type="number"
                  placeholder="Order"
                  required
                  value={problem.order}
                  onChange={(e) => {
                    const newProblems = [...formData.problems];
                    newProblems[idx].order = parseInt(e.target.value);
                    setFormData({ ...formData, problems: newProblems });
                  }}
                  className="w-20 px-3 py-2 bg-gray-700 text-white rounded"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <label className="flex items-center text-white">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="mr-2"
              />
              Public Contest
            </label>
            <label className="flex items-center text-white">
              <input
                type="checkbox"
                checked={formData.allowVirtualParticipation}
                onChange={(e) => setFormData({ ...formData, allowVirtualParticipation: e.target.checked })}
                className="mr-2"
              />
              Allow Virtual Participation
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Contest'}
          </button>
        </form>
      )}

      {selectedContest && leaderboard && (
        <div className="mb-8 bg-gray-700 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Live Leaderboard: {leaderboard.contestTitle}</h3>
            <button
              onClick={() => setSelectedContest(null)}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Close
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left">Rank</th>
                  <th className="px-4 py-2 text-left">Username</th>
                  <th className="px-4 py-2 text-left">Score</th>
                  <th className="px-4 py-2 text-left">Penalty</th>
                  <th className="px-4 py-2 text-left">Solved</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.leaderboard.map((entry, idx) => (
                  <tr key={entry.userId} className="border-b border-gray-600">
                    <td className="px-4 py-2">{idx + 1}</td>
                    <td className="px-4 py-2">{entry.user?.username || 'Unknown'}</td>
                    <td className="px-4 py-2">{entry.totalScore || 0}</td>
                    <td className="px-4 py-2">{entry.totalPenalty || 0}</td>
                    <td className="px-4 py-2">{entry.problemsSolved || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-white">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Start Time</th>
              <th className="px-4 py-3 text-left">Participants</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contests.map((contest) => (
              <tr key={contest._id} className="border-b border-gray-700">
                <td className="px-4 py-3">{contest.title}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    contest.status === 'upcoming' ? 'bg-blue-600' :
                    contest.status === 'active' ? 'bg-green-600' :
                    'bg-gray-600'
                  }`}>
                    {contest.status}
                  </span>
                </td>
                <td className="px-4 py-3">{new Date(contest.startTime).toLocaleString()}</td>
                <td className="px-4 py-3">{contest.totalParticipants || 0}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => fetchLeaderboard(contest._id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm mr-2"
                  >
                    View Leaderboard
                  </button>
                  <button
                    onClick={() => {
                      const shareLink = `${window.location.origin}/contests/${contest._id}`;
                      navigator.clipboard.writeText(shareLink);
                      alert('Contest link copied to clipboard!');
                    }}
                    className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                  >
                    Copy Link
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Disqualifications Tab Component
function DisqualificationsTab({ getToken }) {
  const [contests, setContests] = useState([]);
  const [selectedContest, setSelectedContest] = useState('');
  const [disqualified, setDisqualified] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/contests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setContests(data.contests || []);
    } catch (error) {
      console.error('Failed to fetch contests:', error);
    }
  };

  const fetchDisqualified = async (contestId) => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/contests/${contestId}/disqualified`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setDisqualified(data.disqualifiedUsers || []);
    } catch (error) {
      console.error('Failed to fetch disqualified users:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeDisqualification = async (userId) => {
    if (!confirm('Are you sure you want to remove this disqualification?')) return;

    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/contests/${selectedContest}/disqualified/${userId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        alert('Disqualification removed successfully!');
        fetchDisqualified(selectedContest);
      }
    } catch (error) {
      console.error('Failed to remove disqualification:', error);
    }
  };

  const clearAll = async () => {
    if (!confirm('Are you sure you want to clear ALL disqualifications for this contest?')) return;

    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/contests/${selectedContest}/disqualified`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        alert('All disqualifications cleared!');
        fetchDisqualified(selectedContest);
      }
    } catch (error) {
      console.error('Failed to clear disqualifications:', error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Manage Disqualifications</h2>

      <div className="mb-6">
        <label className="block text-white mb-2">Select Contest</label>
        <select
          value={selectedContest}
          onChange={(e) => {
            setSelectedContest(e.target.value);
            if (e.target.value) fetchDisqualified(e.target.value);
          }}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600"
        >
          <option value="">-- Select a contest --</option>
          {contests.map((contest) => (
            <option key={contest._id} value={contest._id}>
              {contest.title} ({contest.status})
            </option>
          ))}
        </select>
      </div>

      {selectedContest && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">
              Disqualified Users ({disqualified.length})
            </h3>
            {disqualified.length > 0 && (
              <button
                onClick={clearAll}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Clear All Disqualifications
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-white text-center">Loading...</div>
          ) : disqualified.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No disqualified users</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Username</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Reason</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Time</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {disqualified.map((entry) => (
                    <tr key={entry.userId} className="border-b border-gray-700">
                      <td className="px-4 py-3">{entry.user?.username || 'Unknown'}</td>
                      <td className="px-4 py-3">{entry.user?.email || 'N/A'}</td>
                      <td className="px-4 py-3">{entry.disqualificationData?.reason || 'N/A'}</td>
                      <td className="px-4 py-3">{entry.disqualificationData?.violationType || 'N/A'}</td>
                      <td className="px-4 py-3">
                        {entry.disqualificationData?.timestamp
                          ? new Date(entry.disqualificationData.timestamp).toLocaleString()
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeDisqualification(entry.userId)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        >
                          Unban
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Users Tab Component
function UsersTab({ getToken }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/admins`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAdmins(data.adminUsers || []);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const grantAdmin = async () => {
    if (!searchEmail) {
      alert('Please enter a user email');
      return;
    }

    try {
      const token = await getToken();
      // First, search for user by email (you'll need to add this endpoint or use existing user search)
      // For now, we'll assume you have the userId
      alert('User search by email not implemented. Please use the grantContestAdmin.js script.');
    } catch (error) {
      console.error('Failed to grant admin:', error);
    }
  };

  const revokeAdmin = async (userId) => {
    if (!confirm('Are you sure you want to revoke admin privileges?')) return;

    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/admins/${userId}/revoke`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        alert('Admin privileges revoked!');
        fetchAdmins();
      }
    } catch (error) {
      console.error('Failed to revoke admin:', error);
    }
  };

  if (loading) {
    return <div className="text-white text-center">Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Admin Users</h2>

      <div className="mb-6 bg-gray-700 p-4 rounded">
        <h3 className="text-white font-semibold mb-2">Grant Admin Privileges</h3>
        <p className="text-gray-400 text-sm mb-3">
          Use the grantContestAdmin.js script in the backend/utils folder to grant admin privileges.
        </p>
        <code className="text-green-400 text-sm">
          node backend/utils/grantContestAdmin.js [email]
        </code>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-white">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">Username</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Since</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin._id} className="border-b border-gray-700">
                <td className="px-4 py-3">{admin.username}</td>
                <td className="px-4 py-3">{admin.email}</td>
                <td className="px-4 py-3">
                  {admin.firstName} {admin.lastName}
                </td>
                <td className="px-4 py-3">{new Date(admin.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => revokeAdmin(admin._id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Revoke Admin
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
