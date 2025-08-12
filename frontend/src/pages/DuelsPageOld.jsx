import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Zap, Clock, Trophy, Users, Plus, ArrowRight } from 'lucide-react'
import { apiClient } from '@/lib/api'

export function DuelsPage() {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [isCreating, setIsCreating] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  const handleCreateRoom = async () => {
    setIsCreating(true)
    try {
      const token = await getToken()
      const response = await apiClient.createDuelRoom(token, {
        timeLimit: 30, // 30 minutes default
      })
      
      if (response.room) {
        navigate(`/duel/${response.room.roomCode}`)
      }
    } catch (error) {
      console.error('Failed to create room:', error)
      alert('Failed to create room. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinRoom = async (e) => {
    e.preventDefault()
    if (!joinCode.trim()) return

    setIsJoining(true)
    try {
      const token = await getToken()
      const response = await apiClient.joinDuelRoom(token, joinCode.trim().toUpperCase())
      
      if (response.room) {
        navigate(`/duel/${response.room.roomCode}`)
      }
    } catch (error) {
      console.error('Failed to join room:', error)
      alert(error.message || 'Failed to join room. Please check the room code.')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Code Duels Arena</h1>
        <p className="text-muted-foreground">Challenge others in real-time coding battles</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-green-500" />
              <span>Create Duel Room</span>
            </CardTitle>
            <CardDescription>Start a new coding duel and invite someone to join</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleCreateRoom} 
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? 'Creating...' : 'Create Room'}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ArrowRight className="h-5 w-5 text-blue-500" />
              <span>Join Duel Room</span>
            </CardTitle>
            <CardDescription>Enter a room code to join an existing duel</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinRoom} className="space-y-3">
              <Input
                placeholder="Enter room code (e.g., ABC123)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="uppercase"
              />
              <Button 
                type="submit" 
                disabled={isJoining || !joinCode.trim()}
                className="w-full"
              >
                {isJoining ? 'Joining...' : 'Join Room'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Game Modes */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center">Game Modes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-blue-500" />
                <span>Quick Match</span>
              </CardTitle>
              <CardDescription>Get matched instantly with a player of similar skill</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>Coming Soon</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span>Ranked Match</span>
              </CardTitle>
              <CardDescription>Compete in ranked duels to climb the leaderboard</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>Coming Soon</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-red-500" />
                <span>Tournament</span>
              </CardTitle>
              <CardDescription>Join scheduled tournaments with multiple rounds</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>Coming Soon</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">How Code Duels Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <p className="text-sm font-medium">Create or Join Room</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 font-bold">2</span>
            </div>
            <p className="text-sm font-medium">Wait for Opponent</p>
          </div>
          <div className="text-center">
            <div className="bg-yellow-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
              <span className="text-yellow-600 font-bold">3</span>
            </div>
            <p className="text-sm font-medium">Solve the Problem</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
              <span className="text-purple-600 font-bold">4</span>
            </div>
            <p className="text-sm font-medium">First Correct Wins!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
