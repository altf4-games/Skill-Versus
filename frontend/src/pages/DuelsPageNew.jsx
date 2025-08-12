import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useSocket } from '@/contexts/SocketContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Swords, Users, Clock, Copy, Plus, LogIn } from 'lucide-react'

export function DuelsPage() {
  const navigate = useNavigate()
  const { user } = useUser()
  const { socket, isConnected } = useSocket()
  const [joinCode, setJoinCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [timeLimit, setTimeLimit] = useState(30)

  useEffect(() => {
    if (!socket || !isConnected) return

    // Listen for duel creation success
    const handleDuelCreated = (data) => {
      const { room } = data
      console.log('Duel created:', room)
      setIsCreating(false)
      navigate(`/duel/${room.roomCode}`)
    }

    // Listen for join success
    const handleParticipantJoined = (data) => {
      const { room } = data
      console.log('Joined duel:', room)
      setIsJoining(false)
      navigate(`/duel/${room.roomCode}`)
    }

    // Listen for errors
    const handleError = (error) => {
      console.error('Socket error:', error)
      setIsCreating(false)
      setIsJoining(false)
      alert(error.message || 'An error occurred')
    }

    socket.on('duel-created', handleDuelCreated)
    socket.on('participant-joined', handleParticipantJoined)
    socket.on('error', handleError)

    return () => {
      socket.off('duel-created', handleDuelCreated)
      socket.off('participant-joined', handleParticipantJoined)
      socket.off('error', handleError)
    }
  }, [socket, isConnected, navigate])

  const handleCreateRoom = async () => {
    if (!socket || !isConnected) {
      alert('Not connected to server')
      return
    }

    try {
      setIsCreating(true)
      socket.emit('create-duel', { timeLimit })
    } catch (error) {
      console.error('Failed to create room:', error)
      setIsCreating(false)
      alert('Failed to create room. Please try again.')
    }
  }

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      alert('Please enter a room code')
      return
    }

    if (!socket || !isConnected) {
      alert('Not connected to server')
      return
    }

    try {
      setIsJoining(true)
      socket.emit('join-duel', { roomCode: joinCode.trim().toUpperCase() })
    } catch (error) {
      console.error('Failed to join room:', error)
      setIsJoining(false)
      alert('Failed to join room. Please try again.')
    }
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Connecting to server...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mb-4">
          <Swords className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold">Code Duels</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Challenge other developers to real-time coding battles. Test your skills in LeetCode-style problems.
        </p>
      </div>

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
              Start a new coding duel and invite others to join
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                  Create Duel Room
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
            <h3 className="font-semibold">Code & Win</h3>
            <p className="text-sm text-muted-foreground">
              First to submit working code wins XP and bragging rights
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
