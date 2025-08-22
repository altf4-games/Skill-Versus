// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// API endpoints
export const API_ENDPOINTS = {
  // Contest endpoints
  contests: `${API_BASE_URL}/api/contests`,
  contestDetails: (id) => `${API_BASE_URL}/api/contests/${id}`,
  contestRegister: (id) => `${API_BASE_URL}/api/contests/${id}/register`,
  contestProblems: (id) => `${API_BASE_URL}/api/contests/${id}/problems`,
  contestSubmissions: (id) => `${API_BASE_URL}/api/contests/${id}/submissions`,
  contestLeaderboard: (id) => `${API_BASE_URL}/api/contests/${id}/leaderboard`,
  contestSubmit: (contestId, problemId) => `${API_BASE_URL}/api/contests/${contestId}/problems/${problemId}/submit`,
  contestVirtualStart: (id) => `${API_BASE_URL}/api/contests/${id}/virtual/start`,
  contestVirtualRankings: (id) => `${API_BASE_URL}/api/contests/${id}/virtual/rankings`,
  submissionStatus: (id) => `${API_BASE_URL}/api/contests/submissions/${id}`,
  
  // Contest ranking endpoints
  contestRankings: `${API_BASE_URL}/api/contest-rankings`,
  userRanking: `${API_BASE_URL}/api/contest-rankings/me`,
  userRankingHistory: `${API_BASE_URL}/api/contest-rankings/me/history`,

  // Leaderboard endpoints
  globalLeaderboard: `${API_BASE_URL}/api/leaderboard/global`,
  globalContestLeaderboard: `${API_BASE_URL}/api/leaderboard/contests`,
  duelLeaderboard: `${API_BASE_URL}/api/leaderboard/duels`,
  weeklyLeaderboard: `${API_BASE_URL}/api/leaderboard/weekly`,
  userStats: `${API_BASE_URL}/api/leaderboard/me/stats`,

  // Other endpoints
  problems: `${API_BASE_URL}/api/problems`,
  users: `${API_BASE_URL}/api/users`,
};
