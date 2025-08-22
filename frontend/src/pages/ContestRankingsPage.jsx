import { useState, useEffect } from 'react';
import { useUserContext } from '../contexts/UserContext';
import { SEO } from '../components/SEO';
import { API_ENDPOINTS } from '../config/api';

const ContestRankingsPage = () => {
  const { user, getToken } = useUserContext();
  const [rankings, setRankings] = useState([]);
  const [userRanking, setUserRanking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [activeTab, setActiveTab] = useState('global');

  useEffect(() => {
    fetchRankings();
    if (user) {
      fetchUserRanking();
    }
  }, [page, user]);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_ENDPOINTS.contestRankings}?page=${page}&limit=50`);
      const data = await response.json();

      if (response.ok) {
        setRankings(data.rankings);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Failed to fetch rankings');
      }
    } catch (err) {
      setError('Failed to fetch rankings');
      console.error('Fetch rankings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRanking = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.userRanking, {
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setUserRanking(data.ranking);
      }
    } catch (err) {
      console.error('Fetch user ranking error:', err);
    }
  };

  const getRankColor = (rank) => {
    const colors = {
      'Newbie': 'text-gray-600',
      'Pupil': 'text-green-600',
      'Specialist': 'text-cyan-600',
      'Expert': 'text-blue-600',
      'Candidate Master': 'text-purple-600',
      'Master': 'text-orange-600',
      'International Master': 'text-orange-700',
      'Grandmaster': 'text-red-600',
      'International Grandmaster': 'text-red-700',
      'Legendary Grandmaster': 'text-red-800',
    };
    return colors[rank] || 'text-gray-600';
  };

  const getRankBadge = (rank) => {
    const badges = {
      'Newbie': 'bg-gray-100 text-gray-800',
      'Pupil': 'bg-green-100 text-green-800',
      'Specialist': 'bg-cyan-100 text-cyan-800',
      'Expert': 'bg-blue-100 text-blue-800',
      'Candidate Master': 'bg-purple-100 text-purple-800',
      'Master': 'bg-orange-100 text-orange-800',
      'International Master': 'bg-orange-200 text-orange-900',
      'Grandmaster': 'bg-red-100 text-red-800',
      'International Grandmaster': 'bg-red-200 text-red-900',
      'Legendary Grandmaster': 'bg-red-300 text-red-900',
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[rank] || badges['Newbie']}`}>
        {rank}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <SEO title="Contest Rankings" description="Competitive Programming Contest Rankings" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEO title="Contest Rankings" description="Competitive Programming Contest Rankings" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Contest Rankings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Global competitive programming rankings based on contest performance
          </p>
        </div>

        {/* User's Ranking Card */}
        {userRanking && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Your Ranking
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  #{userRanking.globalRank || 'Unranked'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Global Rank</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userRanking.rating}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Current Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {userRanking.maxRating}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Max Rating</div>
              </div>
              <div className="text-center">
                {getRankBadge(userRanking.rank)}
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Rank</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span className="font-medium">Contests:</span> {userRanking.contestsParticipated}
              </div>
              <div>
                <span className="font-medium">Wins:</span> {userRanking.contestsWon}
              </div>
              <div>
                <span className="font-medium">Win Rate:</span>{' '}
                {userRanking.contestsParticipated > 0
                  ? ((userRanking.contestsWon / userRanking.contestsParticipated) * 100).toFixed(1)
                  : '0.0'}%
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Rankings Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Global Rankings
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Max Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Wins
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {rankings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No rankings available
                    </td>
                  </tr>
                ) : (
                  rankings.map((ranking, index) => (
                    <tr
                      key={ranking.userId}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        ranking.username === user?.username
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            #{ranking.globalRank}
                          </span>
                          {ranking.globalRank <= 3 && (
                            <span className="ml-2">
                              {ranking.globalRank === 1 && '🥇'}
                              {ranking.globalRank === 2 && '🥈'}
                              {ranking.globalRank === 3 && '🥉'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className={`text-sm font-medium ${getRankColor(ranking.rank)}`}>
                            {ranking.username}
                          </div>
                          <div className="mt-1">
                            {getRankBadge(ranking.rank)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {ranking.rating}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {ranking.maxRating}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {ranking.contestsParticipated}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {ranking.contestsWon}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {((page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                    Page {page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.pages}
                    className="px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContestRankingsPage;
