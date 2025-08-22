import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUserContext } from '../contexts/UserContext';
import { SEO } from '../components/SEO';
import { API_ENDPOINTS } from '../config/api';

const ContestsPage = () => {
  const { user } = useUserContext();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, active, finished
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchContests();
  }, [filter, page]);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      
      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(`${API_ENDPOINTS.contests}?${params}`);
      const data = await response.json();

      if (response.ok) {
        setContests(data.contests);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Failed to fetch contests');
      }
    } catch (err) {
      setError('Failed to fetch contests');
      console.error('Fetch contests error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      finished: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <SEO title="Contests" description="Competitive Programming Contests" />
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
      <SEO title="Contests" description="Competitive Programming Contests" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Contests
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Compete in programming contests and improve your skills
            </p>
          </div>
          
          {user?.contestAdmin && (
            <Link
              to="/contests/create"
              className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Create Contest
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'upcoming', 'active', 'finished'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilter(status);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Contests List */}
        <div className="space-y-4">
          {contests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-600 text-lg">
                No contests found
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                {filter === 'all' 
                  ? 'No contests have been created yet.'
                  : `No ${filter} contests found.`
                }
              </p>
            </div>
          ) : (
            contests.map((contest) => (
              <div
                key={contest._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {contest.title}
                      </h3>
                      {getStatusBadge(contest.status)}
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {contest.description}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Start:</span>{' '}
                        {formatDate(contest.startTime)}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span>{' '}
                        {formatDuration(contest.duration)}
                      </div>
                      <div>
                        <span className="font-medium">Participants:</span>{' '}
                        {contest.totalParticipants || 0}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Created by:</span> {contest.createdByUsername}
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-0 sm:ml-6">
                    <Link
                      to={`/contests/${contest._id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      View Contest
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            
            <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
              Page {page} of {pagination.pages}
            </span>
            
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.pages}
              className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestsPage;
