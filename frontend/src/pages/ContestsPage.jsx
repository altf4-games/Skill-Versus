import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUserContext } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { SEO } from '../components/SEO';
import { API_ENDPOINTS } from '../config/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calendar, Clock, Users, Plus, Filter } from 'lucide-react';

const ContestsPage = () => {
  const { user } = useUserContext();
  const { theme } = useTheme();
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
    const statusConfig = {
      upcoming: { variant: 'secondary', className: '' },
      active: { variant: 'default', className: 'bg-green-600 hover:bg-green-700 text-white' },
      finished: { variant: 'outline', className: '' },
    };

    const config = statusConfig[status] || statusConfig.finished;

    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return formatIST(dateString);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Contests" description="Competitive Programming Contests" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Contests" description="Competitive Programming Contests" />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full">
                <Trophy className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Contests
                </h1>
                <p className="text-muted-foreground">
                  Compete in programming contests and improve your skills
                </p>
              </div>
            </div>
          </div>

          {user?.contestAdmin && (
            <Button asChild className="mt-4 sm:mt-0">
              <Link to="/contests/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Contest
              </Link>
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card
          className="mb-6"
          style={{
            backgroundColor: theme === 'dark' ? 'hsl(222.2 84% 4.9%)' : 'hsl(0 0% 100%)',
            borderColor: theme === 'dark' ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(214.3 31.8% 91.4%)',
            color: theme === 'dark' ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)'
          }}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-lg">Filter Contests</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {['all', 'upcoming', 'active', 'finished'].map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilter(status);
                    setPage(1);
                  }}
                  className="transition-colors"
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card
            className="mb-6"
            style={{
              backgroundColor: theme === 'dark' ? 'hsl(222.2 84% 4.9%)' : 'hsl(0 0% 100%)',
              borderColor: theme === 'dark' ? 'hsl(0 62.8% 30.6%)' : 'hsl(0 84.2% 60.2%)',
              color: theme === 'dark' ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)'
            }}
          >
            <CardContent className="pt-6">
              <div className="text-destructive">
                {error}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contests List */}
        <div className="space-y-4">
          {contests.length === 0 ? (
            <Card
              style={{
                backgroundColor: theme === 'dark' ? 'hsl(222.2 84% 4.9%)' : 'hsl(0 0% 100%)',
                borderColor: theme === 'dark' ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(214.3 31.8% 91.4%)',
                color: theme === 'dark' ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)'
              }}
            >
              <CardContent className="text-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground text-lg">
                  No contests found
                </div>
                <p className="text-muted-foreground mt-2">
                  {filter === 'all'
                    ? 'No contests have been created yet.'
                    : `No ${filter} contests found.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            contests.map((contest) => (
              <Card
                key={contest._id}
                className="hover:shadow-md transition-shadow"
                style={{
                  backgroundColor: theme === 'dark' ? 'hsl(222.2 84% 4.9%)' : 'hsl(0 0% 100%)',
                  borderColor: theme === 'dark' ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(214.3 31.8% 91.4%)',
                  color: theme === 'dark' ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)'
                }}
              >
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">
                          {contest.title}
                        </CardTitle>
                        {getStatusBadge(contest.status)}
                      </div>

                      <CardDescription className="mb-4">
                        {contest.description}
                      </CardDescription>
                    </div>

                    <div className="mt-4 sm:mt-0 sm:ml-6">
                      <Button asChild>
                        <Link to={`/contests/${contest._id}`}>
                          View Contest
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <div>
                        <span className="font-medium">Start:</span>{' '}
                        {formatDate(contest.startTime)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <div>
                        <span className="font-medium">Duration:</span>{' '}
                        {formatDuration(contest.duration)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <div>
                        <span className="font-medium">Participants:</span>{' '}
                        {contest.totalParticipants || 0}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-muted-foreground">
                    <span className="font-medium">Created by:</span> {contest.createdByUsername}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>

            <span className="px-4 py-2 text-muted-foreground">
              Page {page} of {pagination.pages}
            </span>

            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.pages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestsPage;
