import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Star, Crown, Target, Medal, Zap, Calendar, Swords, Code } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

export function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('contests');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');

      let endpoint = '';
      let params = new URLSearchParams({ limit: '50', page: '1' });

      switch (activeTab) {
        case 'contests':
          endpoint = API_ENDPOINTS.globalContestLeaderboard;
          break;
        case 'xp':
          endpoint = API_ENDPOINTS.globalLeaderboard;
          params.append('type', 'xp');
          break;
        case 'duels':
          endpoint = API_ENDPOINTS.duelLeaderboard;
          params.append('timeframe', '30d');
          break;
        case 'weekly':
          endpoint = API_ENDPOINTS.weeklyLeaderboard;
          break;
        default:
          endpoint = API_ENDPOINTS.globalContestLeaderboard;
      }

      const response = await fetch(`${endpoint}?${params}`);
      const data = await response.json();

      if (response.ok) {
        setLeaderboardData(data.leaderboard || []);
        setPagination(data.pagination || {});
      } else {
        setError(data.error || 'Failed to fetch leaderboard');
      }
    } catch (err) {
      setError('Failed to fetch leaderboard');
      console.error('Fetch leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return Crown;
    if (rank === 2) return Trophy;
    if (rank === 3) return Medal;
    return Star;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-500';
    return 'text-muted-foreground';
  };

  const getRankBadgeColor = (rank) => {
    if (rank <= 3) {
      return 'bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20 dark:from-primary/10 dark:to-purple-500/10 dark:border-primary/30';
    }
    return 'hover:bg-muted/50';
  };

  const formatScore = (player) => {
    switch (activeTab) {
      case 'contests':
        return `${player.rating || 0} Rating`;
      case 'xp':
        return `${player.score?.toLocaleString() || 0} XP`;
      case 'duels':
        return `${player.wins || 0} Wins`;
      case 'weekly':
        return `${player.weeklyScore || 0} Points`;
      default:
        return `${player.score?.toLocaleString() || 0} Points`;
    }
  };

  const getSubInfo = (player) => {
    switch (activeTab) {
      case 'contests':
        return `${player.contestRank || 'Newbie'} • ${player.contestsParticipated || 0} contests`;
      case 'duels':
        return `${player.duelRank || 'Iron'} • ${player.totalDuels || 0} duels • ${player.winRate || 0}% win rate`;
      case 'weekly':
        return `${player.weeklyWins || 0} wins this week`;
      case 'xp':
      default:
        return `Level ${Math.floor((player.score || 0) / 1000) + 1}`;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full mb-4">
          <Trophy className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold">Leaderboard</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          See who rules the arena across all competitions
        </p>
      </div>

      {/* Leaderboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contests" className="flex items-center space-x-2">
            <Code className="h-4 w-4" />
            <span>Contests</span>
          </TabsTrigger>
          <TabsTrigger value="xp" className="flex items-center space-x-2">
            <Star className="h-4 w-4" />
            <span>XP</span>
          </TabsTrigger>
          <TabsTrigger value="duels" className="flex items-center space-x-2">
            <Swords className="h-4 w-4" />
            <span>Duels</span>
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Weekly</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {activeTab === 'contests' && <><Code className="h-5 w-5" /><span>Contest Rankings</span></>}
                {activeTab === 'duels' && <><Swords className="h-5 w-5" /><span>Duel Rankings</span></>}
                {activeTab === 'xp' && <><Star className="h-5 w-5" /><span>XP Rankings</span></>}
                {activeTab === 'weekly' && <><Calendar className="h-5 w-5" /><span>Weekly Rankings</span></>}
              </CardTitle>
              <CardDescription>
                {activeTab === 'contests' && 'Competitive programming contest ratings'}
                {activeTab === 'duels' && 'Real-time duel battle statistics (last 30 days)'}
                {activeTab === 'xp' && 'Total experience points from all activities'}
                {activeTab === 'weekly' && 'Top performers this week'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-destructive mb-2">{error}</div>
                  <Button onClick={fetchLeaderboard} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : leaderboardData.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-muted-foreground">No data available</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboardData.map((player, index) => {
                    const RankIcon = getRankIcon(player.rank);
                    return (
                      <div
                        key={player.id || index}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${getRankBadgeColor(player.rank)}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            player.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' :
                            player.rank === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-600 text-white' :
                            player.rank === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {player.rank}
                          </div>

                          {player.profileImage && (
                            <img
                              src={player.profileImage}
                              alt={player.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          )}

                          <div>
                            <div className="font-medium text-foreground">
                              {player.username || 'Unknown User'}
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <RankIcon className={`h-4 w-4 ${getRankColor(player.rank)}`} />
                              <span>{getSubInfo(player)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-foreground">
                            {formatScore(player)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
