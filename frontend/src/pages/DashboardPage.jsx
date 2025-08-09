import { useUser } from '@clerk/clerk-react'
import { useUserContext } from '@/contexts/UserContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Link } from 'react-router-dom'
import { Trophy, Zap, Users, Target, Clock, Star, TrendingUp, Medal, Flame, User } from 'lucide-react'

export function DashboardPage() {
  const { user: clerkUser } = useUser()
  const { user } = useUserContext()

  const stats = [
    { label: "Total Duels", value: user?.stats?.totalDuels || 0, icon: Zap, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { label: "Wins", value: user?.stats?.wins || 0, icon: Trophy, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
    { label: "Current Rank", value: user?.stats?.rank || "Iron", icon: Star, color: "text-gray-500", bgColor: "bg-gray-500/10" },
    { label: "XP Points", value: user?.stats?.xp?.toLocaleString() || "0", icon: Target, color: "text-purple-500", bgColor: "bg-purple-500/10" }
  ]

  const recentDuels = [
    { opponent: "CodeMaster99", skill: "DSA", result: "Win", time: "2 hours ago" },
    { opponent: "CSSNinja", skill: "CSS", result: "Loss", time: "1 day ago" },
    { opponent: "DebugPro", skill: "Debug", result: "Win", time: "2 days ago" }
  ]

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
            <p className="text-muted-foreground flex items-center space-x-2">
              <span>Ready for your next challenge?</span>
              <Badge variant="secondary" className="ml-2">
                <Flame className="h-3 w-3 mr-1" />
                {user?.stats?.streak || 0} day streak
              </Badge>
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0 shadow-lg">
            <Zap className="mr-2 h-5 w-5" />
            Quick Duel
          </Button>
          <Button variant="outline" size="lg" className="border-2 hover:bg-muted/50">
            <Users className="mr-2 h-5 w-5" />
            Find Friends
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <div className="flex items-center space-x-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+12% from last week</span>
                </div>
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
          <CardContent className="space-y-4">
            {recentDuels.map((duel, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{duel.opponent[0]}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="font-medium">vs {duel.opponent}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">{duel.skill}</Badge>
                      <span className="text-sm text-muted-foreground">{duel.time}</span>
                    </div>
                  </div>
                </div>
                <Badge variant={duel.result === 'Win' ? 'default' : 'destructive'}>
                  {duel.result}
                </Badge>
              </div>
            ))}
            <Separator />
            <Button variant="ghost" className="w-full">
              View All Duels
            </Button>
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
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0 shadow-lg">
                <Zap className="mr-2 h-4 w-4" />
                Start Random Duel
              </Button>
              <Button className="w-full justify-start border-2 hover:bg-muted/50" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Challenge Friend
              </Button>
              <Button asChild className="w-full justify-start border-2 hover:bg-muted/50" variant="outline">
                <Link to="/leaderboard">
                  <Trophy className="mr-2 h-4 w-4" />
                  View Leaderboard
                </Link>
              </Button>
              <Button asChild className="w-full justify-start border-2 hover:bg-muted/50" variant="outline">
                <Link to="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
              <Button className="w-full justify-start border-2 hover:bg-muted/50" variant="outline">
                <Clock className="mr-2 h-4 w-4" />
                Practice Mode
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
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Iron → Bronze</span>
                <span className="text-sm text-muted-foreground">75%</span>
              </div>
              <Progress value={75} className="h-2" />
              <p className="text-xs text-muted-foreground">Win 5 more duels to advance to Bronze tier</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
