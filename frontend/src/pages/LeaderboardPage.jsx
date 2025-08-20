import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Star, Crown, Target } from 'lucide-react'

export function LeaderboardPage() {
  const topPlayers = [
    { rank: 1, name: "CodeKing", points: 2450, badge: "Platinum", icon: Crown, color: "text-purple-500" },
    { rank: 2, name: "AlgoMaster", points: 2320, badge: "Gold", icon: Trophy, color: "text-yellow-500" },
    { rank: 3, name: "DebugQueen", points: 2180, badge: "Gold", icon: Star, color: "text-yellow-500" },
    { rank: 4, name: "CSSNinja", points: 1950, badge: "Silver", icon: Target, color: "text-gray-500" },
    { rank: 5, name: "ReactGuru", points: 1820, badge: "Silver", icon: Target, color: "text-gray-500" }
  ]

  return (
    <div className="space-y-8">
      {/* <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">See who rules the arena</p>
      </div> */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Button variant="outline" className="p-6 h-auto border-2 hover:bg-muted/50 hover:border-primary/50 transition-colors bg-primary/5 border-primary/20">
          <div className="text-center">
            <Trophy className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="font-medium">Global XP</div>
            <div className="text-sm text-muted-foreground">All players by experience</div>
          </div>
        </Button>
        <Button variant="outline" className="p-6 h-auto border-2 hover:bg-muted/50 hover:border-primary/50 transition-colors">
          <div className="text-center">
            <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="font-medium">Weekly</div>
            <div className="text-sm text-muted-foreground">This week's best</div>
          </div>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Players</CardTitle>
          <CardDescription>The best duelists in the arena</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPlayers.map((player, index) => {
              const Icon = player.icon
              return (
                <div key={index} className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  index < 3 ? 'bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20 dark:from-primary/10 dark:to-purple-500/10 dark:border-primary/30' : 'hover:bg-muted/50'
                }`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600 text-white' :
                      index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {player.rank}
                    </div>
                    <div>
                      <div className="font-medium">{player.name}</div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Icon className={`h-4 w-4 ${player.color}`} />
                        <span>{player.badge}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{player.points.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">XP</div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
