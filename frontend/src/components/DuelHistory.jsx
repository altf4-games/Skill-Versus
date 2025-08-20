import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Trophy, 
  Clock, 
  Code, 
  Keyboard, 
  Target, 
  TrendingUp, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  User,
  Zap
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function DuelHistory() {
  const { getToken } = useAuth()
  const [duelHistory, setDuelHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

  const fetchDuelHistory = async (page = 1, duelType = null) => {
    try {
      setLoading(true)
      const token = await getToken()
      const response = await apiClient.getDuelHistory(token, page, 10, duelType)
      
      if (response.success) {
        setDuelHistory(response.data.duelHistory)
        setPagination(response.data.pagination)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('Error fetching duel history:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const duelType = activeTab === 'all' ? null : activeTab
    fetchDuelHistory(1, duelType)
  }, [activeTab])

  const handlePageChange = (newPage) => {
    const duelType = activeTab === 'all' ? null : activeTab
    fetchDuelHistory(newPage, duelType)
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'hard': return 'bg-red-500/10 text-red-500 border-red-500/20'
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const renderDuelCard = (duel) => {
    const isWinner = duel.isWinner
    const isDraw = duel.completionReason === 'best-score' && !isWinner

    return (
      <Card key={duel._id} className={`transition-all duration-200 hover:shadow-md ${
        isWinner ? 'border-green-500/30 bg-green-500/5' : 
        isDraw ? 'border-yellow-500/30 bg-yellow-500/5' : 
        'border-red-500/30 bg-red-500/5'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                duel.duelType === 'coding' ? 'bg-blue-500/10' : 'bg-purple-500/10'
              }`}>
                {duel.duelType === 'coding' ? (
                  <Code className={`h-4 w-4 ${
                    duel.duelType === 'coding' ? 'text-blue-500' : 'text-purple-500'
                  }`} />
                ) : (
                  <Keyboard className="h-4 w-4 text-purple-500" />
                )}
              </div>
              <div>
                <CardTitle className="text-sm font-medium">
                  {duel.duelType === 'coding' ? 'Coding Duel' : 'Typing Duel'}
                </CardTitle>
                <CardDescription className="text-xs">
                  Room: {duel.roomCode}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={isWinner ? 'default' : 'secondary'} className={
                isWinner ? 'bg-green-500 hover:bg-green-600' : 
                isDraw ? 'bg-yellow-500 hover:bg-yellow-600' : 
                'bg-red-500 hover:bg-red-600'
              }>
                {isWinner ? (
                  <>
                    <Trophy className="h-3 w-3 mr-1" />
                    Won
                  </>
                ) : isDraw ? (
                  <>
                    <Target className="h-3 w-3 mr-1" />
                    Draw
                  </>
                ) : (
                  <>
                    <User className="h-3 w-3 mr-1" />
                    Lost
                  </>
                )}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {formatDuration(duel.duration)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Opponent Info */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={duel.opponent.profileImage} />
                  <AvatarFallback className="text-xs">
                    {duel.opponent.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{duel.opponent.username}</p>
                  <p className="text-xs text-muted-foreground">Opponent</p>
                </div>
              </div>
            </div>

            {/* Duel Details */}
            {duel.duelType === 'coding' && duel.problem && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{duel.problem.title}</p>
                  <Badge variant="outline" className={getDifficultyColor(duel.problem.difficulty)}>
                    {duel.problem.difficulty}
                  </Badge>
                </div>
                {duel.userStats.submissionResult && (
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Your Score</p>
                      <p className="font-medium">
                        {duel.userStats.submissionResult.passedCount}/{duel.userStats.submissionResult.totalCount} tests
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Opponent Score</p>
                      <p className="font-medium">
                        {duel.opponentStats.submissionResult?.passedCount || 0}/{duel.opponentStats.submissionResult?.totalCount || 0} tests
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {duel.duelType === 'typing' && duel.typingContent && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{duel.typingContent.category}</p>
                  <Badge variant="outline" className={getDifficultyColor(duel.typingContent.difficulty)}>
                    {duel.typingContent.difficulty}
                  </Badge>
                </div>
                {duel.userStats.typingStats && (
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Your WPM</p>
                      <p className="font-medium flex items-center">
                        <Zap className="h-3 w-3 mr-1" />
                        {duel.userStats.typingStats.wpm} WPM
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Your Accuracy</p>
                      <p className="font-medium flex items-center">
                        <Target className="h-3 w-3 mr-1" />
                        {duel.userStats.typingStats.accuracy}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Completion Reason */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {duel.completionReason === 'correct-submission' && 'First correct solution'}
                {duel.completionReason === 'best-score' && 'Best score after time limit'}
                {duel.completionReason === 'completion' && 'First to complete'}
                {duel.completionReason === 'anti-cheat' && 'Anti-cheat violation'}
              </span>
              <span className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDistanceToNow(new Date(duel.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading && duelHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Duel History</CardTitle>
          <CardDescription>Loading your recent duels...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Duel History</CardTitle>
        <CardDescription>Your recent 1v1 duel results</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Duels</TabsTrigger>
            <TabsTrigger value="coding">Coding</TabsTrigger>
            <TabsTrigger value="typing">Typing</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {duelHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No duels found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start dueling to see your history here!
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {duelHistory.map(renderDuelCard)}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Page {pagination.currentPage} of {pagination.totalPages} 
                      ({pagination.totalCount} total duels)
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!pagination.hasPrevPage || loading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!pagination.hasNextPage || loading}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
