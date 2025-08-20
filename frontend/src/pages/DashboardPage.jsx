import { useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useUserContext } from '@/contexts/UserContext'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Link } from 'react-router-dom'
import { Trophy, Zap, Users, Target, Clock, Star, TrendingUp, Medal, Flame, User, Code } from 'lucide-react'
import { RecentDuels } from '@/components/RecentDuels'

export function DashboardPage() {
  const { user: clerkUser } = useUser()
  const { user, syncUser } = useUserContext()
  const navigate = useNavigate()

  // Refresh user data when component mounts to ensure latest stats
  useEffect(() => {
    if (user) {
      syncUser()
    }
  }, [])

  // Calculate win rate
  const winRate = user?.stats?.totalDuels > 0
    ? ((user.stats.wins / user.stats.totalDuels) * 100).toFixed(1)
    : 0

  const stats = [
    { label: "Total Duels", value: user?.stats?.totalDuels || 0, icon: Zap, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { label: "Wins", value: user?.stats?.wins || 0, icon: Trophy, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
    { label: "Win Rate", value: `${winRate}%`, icon: TrendingUp, color: "text-green-500", bgColor: "bg-green-500/10" },
    { label: "Current Rank", value: user?.stats?.rank || "Iron", icon: Star, color: "text-gray-500", bgColor: "bg-gray-500/10" },
    { label: "XP Points", value: user?.stats?.xp?.toLocaleString() || "0", icon: Target, color: "text-purple-500", bgColor: "bg-purple-500/10" }
  ]

  // Calculate rank progress
  const calculateRankProgress = () => {
    const currentXP = user?.stats?.xp || 0
    const currentRank = user?.stats?.rank || "Iron"

    const rankThresholds = {
      "Iron": { next: "Bronze", threshold: 500 },
      "Bronze": { next: "Silver", threshold: 2000 },
      "Silver": { next: "Gold", threshold: 5000 },
      "Gold": { next: "Platinum", threshold: 10000 },
      "Platinum": { next: null, threshold: null }
    }

    const rankInfo = rankThresholds[currentRank]
    if (!rankInfo || !rankInfo.next) {
      return { progress: 100, nextRank: null, xpNeeded: 0 }
    }

    const previousThreshold = currentRank === "Iron" ? 0 :
                             currentRank === "Bronze" ? 500 :
                             currentRank === "Silver" ? 2000 :
                             currentRank === "Gold" ? 5000 : 0

    const xpInCurrentRank = currentXP - previousThreshold
    const xpNeededForNext = rankInfo.threshold - previousThreshold
    const progress = Math.min((xpInCurrentRank / xpNeededForNext) * 100, 100)
    const xpNeeded = Math.max(rankInfo.threshold - currentXP, 0)

    return {
      progress: Math.round(progress),
      nextRank: rankInfo.next,
      xpNeeded
    }
  }

  const rankProgress = calculateRankProgress()

  // Quick action handlers
  const handleQuickDuel = () => {
    navigate('/duels')
  }

  const handleChallengeFriend = () => {
    // For now, navigate to duels page where they can create a room
    navigate('/duels')
  }

  const handlePracticeMode = () => {
    navigate('/practice')
  }



  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 rounded-xl border">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarImage src={clerkUser?.imageUrl} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-xl font-bold">
              {(user?.firstName?.[0] || clerkUser?.firstName?.[0] || 'D').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.firstName || clerkUser?.firstName || 'Duelist'}!</h1>
            <div className="text-muted-foreground flex items-center space-x-2">
              <span>Ready for your next challenge?</span>
              <Badge variant="secondary" className="ml-2">
                <Flame className="h-3 w-3 mr-1" />
                {user?.stats?.streak || 0} day streak
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            size="lg"
            onClick={handleQuickDuel}
            className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0 shadow-lg"
          >
            <Zap className="mr-2 h-5 w-5" />
            Quick Duel
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleChallengeFriend}
            className="border-2 hover:bg-muted/50"
          >
            <Users className="mr-2 h-5 w-5" />
            Challenge Friend
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor} group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                {stat.label === "Win Rate" && user?.stats?.totalDuels > 0 && (
                  <div className="flex items-center space-x-1 mt-2">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-muted-foreground">
                      {user.stats.wins} wins out of {user.stats.totalDuels} duels
                    </span>
                  </div>
                )}
                {stat.label === "XP Points" && (
                  <div className="flex items-center space-x-1 mt-2">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-muted-foreground">
                      Rank: {user?.stats?.rank || "Iron"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Duels */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Medal className="h-5 w-5 text-primary" />
              <span>Recent Duels</span>
            </CardTitle>
            <CardDescription>Your latest battles in the arena</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentDuels />
          </CardContent>
        </Card>

        {/* Quick Actions & Progress */}
        <div className="space-y-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-primary" />
                <span>Quick Actions</span>
              </CardTitle>
              <CardDescription>Jump into action</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-4">
              <Button
                onClick={handleQuickDuel}
                className="w-full justify-start bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0 shadow-lg h-10 px-3"
              >
                <Zap className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">Quick Duel</span>
              </Button>
              <Button
                onClick={handleChallengeFriend}
                className="w-full justify-start border-2 hover:bg-muted/50 h-10 px-3"
                variant="outline"
              >
                <Users className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">Challenge Friend</span>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start h-10 px-3">
                <Link
                  to="/leaderboard"
                  className="w-full h-full flex items-center no-underline"
                >
                  <Trophy className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Leaderboard</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start h-10 px-3">
                <Link
                  to="/profile"
                  className="w-full h-full flex items-center no-underline"
                >
                  <User className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Edit Profile</span>
                </Link>
              </Button>
              <Button
                onClick={handlePracticeMode}
                className="w-full justify-start border-2 hover:bg-muted/50 h-10 px-3"
                variant="outline"
              >
                <Code className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">Practice Mode</span>
              </Button>
            </CardContent>
          </Card>

          {/* Rank Progress */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span>Rank Progress</span>
              </CardTitle>
              <CardDescription>Path to the next tier</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rankProgress.nextRank ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {user?.stats?.rank || "Iron"} → {rankProgress.nextRank}
                    </span>
                    <span className="text-sm text-muted-foreground">{rankProgress.progress}%</span>
                  </div>
                  <Progress value={rankProgress.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Earn {rankProgress.xpNeeded} more XP to advance to {rankProgress.nextRank} tier
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Platinum Rank</span>
                    <span className="text-sm text-muted-foreground">MAX</span>
                  </div>
                  <Progress value={100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Congratulations! You've reached the highest rank.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  )
}
