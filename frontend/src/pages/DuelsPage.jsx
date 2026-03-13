import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Swords, Users, Clock, Copy, Plus, LogIn, Code, Keyboard } from 'lucide-react'

export default function DuelsPage() {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [joinCode, setJoinCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [timeLimit, setTimeLimit] = useState(30)
  const [duelType, setDuelType] = useState('coding') // 'coding' or 'typing'
  const [error, setError] = useState(null)

  const handleCreateRoom = async () => {
    try {
      setIsCreating(true)
      setError(null)

      const token = await getToken();
      const endpoint = duelType === 'typing' ? '/api/duels/create-typing' : '/api/duels/create'
      const data = await apiClient.request(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ timeLimit }),
      })

      if (data?.room?.roomCode) {
        navigate(`/duel/${data.room.roomCode}`)
      } else {
        console.error('Create API Response:', data)
        throw new Error('Invalid response from server')
      }
    } catch (err) {
      console.error('Failed to create room:', err)
      setError(err.message || 'Failed to create room. Please try again.')
      setIsCreating(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      setError('Please enter a room code')
      return
    }

    try {
      setIsJoining(true)
      setError(null)

      const token = await getToken();
      const data = await apiClient.request(`/api/duels/join/${joinCode.trim().toUpperCase()}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      })

      if (data?.room?.roomCode) {
        navigate(`/duel/${data.room.roomCode}`)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (err) {
      console.error('Failed to join room:', err)
      setError(err.message || 'Failed to join room. Please try again.')
      setIsJoining(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mb-4">
          <Swords className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold">Skill Duels</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Challenge other players to real-time skill battles. Test your coding prowess or typing speed in competitive duels.
        </p>
      </div>

      {error && (
        <div className="max-w-4xl mx-auto p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-center">
          {error}
        </div>
      )}

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Create Room Card */}
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4 mx-auto">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Create Duel</CardTitle>
            <CardDescription>
              Start a new {duelType} duel and invite others to join
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Duel Type</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={duelType === 'coding' ? 'default' : 'outline'}
                  onClick={() => setDuelType('coding')}
                  className="flex items-center justify-center space-x-2"
                >
                  <Code className="h-4 w-4" />
                  <span>Coding</span>
                </Button>
                <Button
                  variant={duelType === 'typing' ? 'default' : 'outline'}
                  onClick={() => setDuelType('typing')}
                  className="flex items-center justify-center space-x-2"
                >
                  <Keyboard className="h-4 w-4" />
                  <span>Typing</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {duelType === 'coding'
                  ? 'Solve coding problems faster than your opponent'
                  : 'Type text accurately and quickly (100% accuracy required)'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Time Limit (minutes)</label>
              <Input
                type="number"
                min="5"
                max="60"
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value) || 30)}
                className="text-center"
              />
            </div>
            
            <Button
              onClick={handleCreateRoom}
              className="w-full text-lg py-6"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-5 w-5" />
                  Create {duelType === 'coding' ? 'Code' : 'Typing'} Duel
                </>
              )}
            </Button>

            <div className="text-center space-y-2">
              <Badge variant="secondary" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                1v1 Battle
              </Badge>
              <Badge variant="outline" className="text-xs ml-2">
                <Clock className="h-3 w-3 mr-1" />
                {timeLimit} min limit
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Join Room Card */}
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-full mb-4 mx-auto">
              <LogIn className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Join Duel</CardTitle>
            <CardDescription>
              Enter a room code to join an existing duel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Room Code</label>
              <Input
                placeholder="Enter 6-character code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                className="text-center text-lg font-mono tracking-wider"
                maxLength={6}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
            </div>
            
            <Button
              onClick={handleJoinRoom}
              variant="outline"
              className="w-full text-lg py-6"
              disabled={!joinCode.trim() || isJoining}
            >
              {isJoining ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Joining...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Join Duel Room
                </>
              )}
            </Button>

            <div className="text-center">
              <Badge variant="secondary" className="text-xs">
                <Copy className="h-3 w-3 mr-1" />
                Share code with friends
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* How it works */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-center mb-6">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-500/10 rounded-full mb-3">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <h3 className="font-semibold">Create or Join</h3>
            <p className="text-sm text-muted-foreground">
              Start a new duel room or join with a friend's code
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-orange-500/10 rounded-full mb-3">
              <span className="text-orange-600 font-bold">2</span>
            </div>
            <h3 className="font-semibold">Get Ready</h3>
            <p className="text-sm text-muted-foreground">
              Both players mark ready to start the coding challenge
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-green-500/10 rounded-full mb-3">
              <span className="text-green-600 font-bold">3</span>
            </div>
            <h3 className="font-semibold">Code &amp; Win</h3>
            <p className="text-sm text-muted-foreground">
              First to submit working code wins XP and bragging rights
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
