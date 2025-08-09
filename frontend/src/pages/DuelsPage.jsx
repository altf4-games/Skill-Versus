import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Zap, Clock, Trophy, Users } from 'lucide-react'

export function DuelsPage() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Duels Arena</h1>
        <p className="text-muted-foreground">Choose your battle and prove your skills</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <span>Quick Match</span>
            </CardTitle>
            <CardDescription>Get matched instantly with a player of similar skill</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Start Quick Duel</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-500" />
              <span>Challenge Friend</span>
            </CardTitle>
            <CardDescription>Send a duel invitation to a specific player</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Challenge Friend</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span>Ranked Match</span>
            </CardTitle>
            <CardDescription>Compete in ranked duels to climb the leaderboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Ranked Duel</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Duels</CardTitle>
          <CardDescription>Join ongoing matches as a spectator</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active duels at the moment</p>
            <p className="text-sm">Start a new duel to get the action going!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
