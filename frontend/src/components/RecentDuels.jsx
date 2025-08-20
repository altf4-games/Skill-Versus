import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { apiClient } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  Trophy, 
  Clock, 
  Code, 
  Keyboard, 
  Target, 
  User,
  Zap,
  Medal,
  ArrowRight
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'

export function RecentDuels() {
  const { getToken } = useAuth()
  const [recentDuels, setRecentDuels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentDuels()
  }, [])

  const fetchRecentDuels = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const response = await apiClient.getDuelHistory(token, 1, 3) // Get only 3 most recent
      
      if (response.success) {
        setRecentDuels(response.data.duelHistory)
      }
    } catch (error) {
      console.error('Error fetching recent duels:', error)
    } finally {
      setLoading(false)
    }
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

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg animate-pulse">
            <div className="w-8 h-8 bg-muted rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
            <div className="w-16 h-6 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (recentDuels.length === 0) {
    return (
      <div className="text-center py-8">
        <Medal className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">No duels yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Start your first duel to see your battle history here
        </p>
        <Button asChild size="sm">
          <Link to="/duels">
            <Zap className="h-4 w-4 mr-2" />
            Start Dueling
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {recentDuels.map((duel) => {
        const isWinner = duel.isWinner
        
        return (
          <div
            key={duel._id}
            className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
              isWinner 
                ? 'bg-green-500/5 border-green-500/20' 
                : 'bg-red-500/5 border-red-500/20'
            }`}
          >
            {/* Duel Type Icon */}
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

            {/* Duel Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium truncate">
                  vs {duel.opponent.username}
                </p>
                <Badge variant={isWinner ? 'default' : 'secondary'} className={`text-xs ${
                  isWinner ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                }`}>
                  {isWinner ? (
                    <>
                      <Trophy className="h-3 w-3 mr-1" />
                      Won
                    </>
                  ) : (
                    <>
                      <User className="h-3 w-3 mr-1" />
                      Lost
                    </>
                  )}
                </Badge>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {duel.duelType === 'coding' && duel.problem ? duel.problem.title : 
                   duel.duelType === 'typing' && duel.typingContent ? duel.typingContent.category : 
                   'Unknown'}
                </span>
                {duel.duelType === 'coding' && duel.problem && (
                  <Badge variant="outline" className={`text-xs ${getDifficultyColor(duel.problem.difficulty)}`}>
                    {duel.problem.difficulty}
                  </Badge>
                )}
                {duel.duelType === 'typing' && duel.typingContent && (
                  <Badge variant="outline" className={`text-xs ${getDifficultyColor(duel.typingContent.difficulty)}`}>
                    {duel.typingContent.difficulty}
                  </Badge>
                )}
              </div>
            </div>

            {/* Duration & Time */}
            <div className="text-right">
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                {formatDuration(duel.duration)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(duel.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        )
      })}

      {/* View All Link */}
      <div className="pt-2">
        <Button variant="ghost" size="sm" asChild className="w-full">
          <Link to="/profile">
            View All History
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
