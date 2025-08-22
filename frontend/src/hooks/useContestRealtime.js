import { useState, useEffect, useCallback, useRef } from 'react';
import { useUserContext } from '../contexts/UserContext';
import { API_ENDPOINTS } from '../config/api';

/**
 * Custom hook for real-time contest features
 * Handles polling for leaderboard updates, submission status, and contest state
 */
export const useContestRealtime = ({
  contestId,
  isActive = false,
  isVirtual = false,
}) => {
  const { user, getToken } = useUserContext();
  const [leaderboard, setLeaderboard] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [contestStatus, setContestStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Polling intervals
  const leaderboardIntervalRef = useRef(null);
  const submissionsIntervalRef = useRef(null);
  const statusIntervalRef = useRef(null);
  
  // Polling frequencies
  const LEADERBOARD_INTERVAL = 30000; // 30 seconds
  const SUBMISSIONS_INTERVAL = 2000;  // 2 seconds
  const STATUS_INTERVAL = 60000;      // 1 minute

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    if (!contestId || !isActive) return;
    
    try {
      const params = new URLSearchParams();
      if (isVirtual) params.append('virtual', 'true');
      
      const response = await fetch(`${API_ENDPOINTS.contestLeaderboard(contestId)}?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setLeaderboard(data.leaderboard || []);
      } else {
        console.error('Failed to fetch leaderboard:', data.error);
      }
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
    }
  }, [contestId, isActive, isVirtual]);

  // Fetch user submissions
  const fetchSubmissions = useCallback(async () => {
    if (!contestId || !isActive || !user) return;
    
    try {
      const params = new URLSearchParams();
      if (isVirtual) params.append('virtual', 'true');
      
      const response = await fetch(`${API_ENDPOINTS.contestSubmissions(contestId)}?${params}`, {
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        setSubmissions(data.submissions || []);
      } else {
        console.error('Failed to fetch submissions:', data.error);
      }
    } catch (err) {
      console.error('Submissions fetch error:', err);
    }
  }, [contestId, isActive, isVirtual, user]);

  // Fetch contest status
  const fetchContestStatus = useCallback(async () => {
    if (!contestId) return;
    
    try {
      const response = await fetch(API_ENDPOINTS.contestDetails(contestId));
      const data = await response.json();
      
      if (response.ok) {
        setContestStatus(data.contest);
      } else {
        console.error('Failed to fetch contest status:', data.error);
      }
    } catch (err) {
      console.error('Contest status fetch error:', err);
    }
  }, [contestId]);

  // Check submission status for pending submissions
  const checkPendingSubmissions = useCallback(async () => {
    if (!user) return;
    
    const pendingSubmissions = submissions.filter(
      sub => sub.status === 'pending' || sub.status === 'judging'
    );
    
    if (pendingSubmissions.length === 0) return;
    
    try {
      const promises = pendingSubmissions.map(async (submission) => {
        const response = await fetch(API_ENDPOINTS.submissionStatus(submission._id), {
          headers: {
            'Authorization': `Bearer ${await getToken()}`,
          },
        });
        return response.ok ? response.json() : null;
      });
      
      const results = await Promise.all(promises);
      
      // Update submissions with new status
      setSubmissions(prevSubmissions => {
        const updated = [...prevSubmissions];
        results.forEach((result, index) => {
          if (result?.submission) {
            const submissionIndex = updated.findIndex(
              sub => sub._id === pendingSubmissions[index]._id
            );
            if (submissionIndex !== -1) {
              updated[submissionIndex] = {
                ...updated[submissionIndex],
                ...result.submission,
              };
            }
          }
        });
        return updated;
      });
    } catch (err) {
      console.error('Check pending submissions error:', err);
    }
  }, [submissions, user]);

  // Start polling
  const startPolling = useCallback(() => {
    if (!isActive) return;
    
    // Initial fetch
    fetchLeaderboard();
    fetchSubmissions();
    fetchContestStatus();
    
    // Set up intervals
    leaderboardIntervalRef.current = setInterval(fetchLeaderboard, LEADERBOARD_INTERVAL);
    submissionsIntervalRef.current = setInterval(() => {
      fetchSubmissions();
      checkPendingSubmissions();
    }, SUBMISSIONS_INTERVAL);
    statusIntervalRef.current = setInterval(fetchContestStatus, STATUS_INTERVAL);
    
  }, [isActive, fetchLeaderboard, fetchSubmissions, fetchContestStatus, checkPendingSubmissions]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (leaderboardIntervalRef.current) {
      clearInterval(leaderboardIntervalRef.current);
      leaderboardIntervalRef.current = null;
    }
    if (submissionsIntervalRef.current) {
      clearInterval(submissionsIntervalRef.current);
      submissionsIntervalRef.current = null;
    }
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
  }, []);

  // Manual refresh functions
  const refreshLeaderboard = useCallback(async () => {
    setLoading(true);
    await fetchLeaderboard();
    setLoading(false);
  }, [fetchLeaderboard]);

  const refreshSubmissions = useCallback(async () => {
    setLoading(true);
    await fetchSubmissions();
    await checkPendingSubmissions();
    setLoading(false);
  }, [fetchSubmissions, checkPendingSubmissions]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchLeaderboard(),
      fetchSubmissions(),
      fetchContestStatus(),
    ]);
    await checkPendingSubmissions();
    setLoading(false);
  }, [fetchLeaderboard, fetchSubmissions, fetchContestStatus, checkPendingSubmissions]);

  // Effect to start/stop polling based on isActive
  useEffect(() => {
    if (isActive) {
      startPolling();
    } else {
      stopPolling();
    }
    
    return () => {
      stopPolling();
    };
  }, [isActive, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Get user's rank from leaderboard
  const getUserRank = useCallback(() => {
    if (!user || !leaderboard.length) return null;
    
    const userEntry = leaderboard.find(entry => 
      entry.userId === user.id || entry.username === user.username
    );
    
    return userEntry ? userEntry.rank : null;
  }, [user, leaderboard]);

  // Get user's score from leaderboard
  const getUserScore = useCallback(() => {
    if (!user || !leaderboard.length) return null;
    
    const userEntry = leaderboard.find(entry => 
      entry.userId === user.id || entry.username === user.username
    );
    
    return userEntry ? {
      totalScore: userEntry.totalScore,
      totalPenalty: userEntry.totalPenalty,
      problemsSolved: userEntry.problemsSolved,
    } : null;
  }, [user, leaderboard]);

  // Get submission statistics
  const getSubmissionStats = useCallback(() => {
    const total = submissions.length;
    const accepted = submissions.filter(sub => sub.isAccepted).length;
    const pending = submissions.filter(sub => 
      sub.status === 'pending' || sub.status === 'judging'
    ).length;
    const rejected = total - accepted - pending;
    
    return {
      total,
      accepted,
      pending,
      rejected,
      acceptanceRate: total > 0 ? ((accepted / total) * 100).toFixed(1) : '0.0',
    };
  }, [submissions]);

  return {
    // Data
    leaderboard,
    submissions,
    contestStatus,
    
    // State
    loading,
    error,
    
    // Actions
    refreshLeaderboard,
    refreshSubmissions,
    refreshAll,
    startPolling,
    stopPolling,
    
    // Computed values
    getUserRank,
    getUserScore,
    getSubmissionStats,
    
    // Polling status
    isPolling: isActive && (
      leaderboardIntervalRef.current !== null ||
      submissionsIntervalRef.current !== null ||
      statusIntervalRef.current !== null
    ),
  };
};
