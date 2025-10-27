import { useState, useEffect } from 'react'
import { useUser, useAuth } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { useUserContext } from '@/contexts/UserContext'
import { Link } from 'react-router-dom'
import { User, Edit3, Save, X, Trophy, Target, Zap, Star, TrendingUp, Sword, Award, Medal, Users, UserPlus, UserMinus, Flame } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { DuelHistory } from '@/components/DuelHistory'

export function ProfilePage() {
  const { user: clerkUser } = useUser()
  const { user, updateUser } = useUserContext()
  const { getToken } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    bio: ''
  })

  // Friends state
  const [friends, setFriends] = useState([])
  const [friendRequests, setFriendRequests] = useState({ received: [], sent: [] })
  const [newFriendUsername, setNewFriendUsername] = useState('')
  const [isAddingFriend, setIsAddingFriend] = useState(false)
  const [friendsLoading, setFriendsLoading] = useState(false)

  // Contest ranking state
  const [contestRanking, setContestRanking] = useState(null)
  const [contestRankingLoading, setContestRankingLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || ''
      })
      loadFriendsData()
      loadContestRanking()
    }
  }, [user])

  const loadFriendsData = async () => {
    setFriendsLoading(true)
    try {
      const token = await getToken()

      // Load friends and friend requests
      const [friendsResponse, requestsResponse] = await Promise.all([
        apiClient.request('/api/users/friends', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        apiClient.request('/api/users/friends/requests', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (friendsResponse.success) {
        setFriends(friendsResponse.friends)
      }

      if (requestsResponse.success) {
        setFriendRequests(requestsResponse)
      }
    } catch (error) {
      console.error('Failed to load friends data:', error)
    } finally {
      setFriendsLoading(false)
    }
  }

  const loadContestRanking = async () => {
    setContestRankingLoading(true)
    try {
      const token = await getToken()
      const response = await apiClient.request('/api/contest-rankings/me', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ranking) {
        setContestRanking(response.ranking)
      }
    } catch (error) {
      console.error('Failed to load contest ranking:', error)
    } finally {
      setContestRankingLoading(false)
    }
  }

  const sendFriendRequest = async () => {
    if (!newFriendUsername.trim()) return

    setIsAddingFriend(true)
    try {
      const token = await getToken()
      const response = await apiClient.request('/api/users/friends/request', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: newFriendUsername.trim() })
      })

      if (response.success) {
        setNewFriendUsername('')
        loadFriendsData() // Reload to show updated requests
        alert(response.message || 'Friend request sent!')
      }
    } catch (error) {
      console.error('Failed to send friend request:', error)
      alert(error.message || 'Failed to send friend request')
    } finally {
      setIsAddingFriend(false)
    }
  }

  const acceptFriendRequest = async (requestId) => {
    try {
      const token = await getToken()
      const response = await apiClient.request('/api/users/friends/accept', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requestId })
      })

      if (response.success) {
        loadFriendsData() // Reload to show updated friends and requests
        alert(response.message || 'Friend request accepted!')
      }
    } catch (error) {
      console.error('Failed to accept friend request:', error)
      alert(error.message || 'Failed to accept friend request')
    }
  }

  const rejectFriendRequest = async (requestId) => {
    try {
      const token = await getToken()
      const response = await apiClient.request('/api/users/friends/reject', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requestId })
      })

      if (response.success) {
        loadFriendsData() // Reload to show updated requests
        alert(response.message || 'Friend request rejected')
      }
    } catch (error) {
      console.error('Failed to reject friend request:', error)
      alert(error.message || 'Failed to reject friend request')
    }
  }

  const removeFriend = async (friendId) => {
    if (!confirm('Are you sure you want to remove this friend?')) return

    try {
      const token = await getToken()
      const response = await apiClient.request(`/api/users/friends/${friendId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.success) {
        loadFriendsData() // Reload to show updated friends
        alert(response.message || 'Friend removed')
      }
    } catch (error) {
      console.error('Failed to remove friend:', error)
      alert(error.message || 'Failed to remove friend')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await updateUser(formData)
      setIsEditing(false)
    } catch (error) {
      console.error('Profile update failed:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      bio: user?.bio || ''
    })
    setIsEditing(false)
  }

  const getRankProgress = () => {
    const xp = user?.stats?.xp || 0
    const currentRank = user?.stats?.rank || 'Iron'
    
    const rankThresholds = {
      Iron: { min: 0, max: 500 },
      Bronze: { min: 500, max: 2000 },
      Silver: { min: 2000, max: 5000 },
      Gold: { min: 5000, max: 10000 },
      Platinum: { min: 10000, max: Infinity }
    }

    const current = rankThresholds[currentRank]
    if (currentRank === 'Platinum') {
      return { progress: 100, nextRank: null, remaining: 0 }
    }

    const progress = ((xp - current.min) / (current.max - current.min)) * 100
    const nextRanks = ['Bronze', 'Silver', 'Gold', 'Platinum']
    const nextRank = nextRanks[nextRanks.indexOf(currentRank) + 1] || null
    const remaining = current.max - xp

    return { progress: Math.min(progress, 100), nextRank, remaining }
  }

  const rankInfo = getRankProgress()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      {/* <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Profile</h1>
        <p className="text-muted-foreground text-lg">Manage your account and view your progress</p>
      </div> */}

      {/* Profile Header Section */}
      <Card className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 border-primary/20">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              <AvatarImage
                src={user.profileImage || clerkUser?.imageUrl}
                key={user.profileImage || clerkUser?.imageUrl}
              />
              <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-3xl font-bold">
                {(user.firstName?.[0] || clerkUser?.firstName?.[0] || 'U').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-3xl font-bold">{user.firstName} {user.lastName}</h2>
              <p className="text-xl text-muted-foreground">@{user.username}</p>
              <p className="text-muted-foreground">{user.email}</p>
              {user.bio && (
                <p className="mt-3 text-muted-foreground max-w-2xl">{user.bio}</p>
              )}
            </div>
            <div className="flex flex-col items-center gap-4">
              <Badge variant="secondary" className="text-lg px-4 py-2 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10">
                <Star className="h-4 w-4 mr-2 text-yellow-500" />
                {user.stats?.rank || 'Iron'}
              </Badge>
              <p className="text-2xl font-bold">{(user.stats?.xp || 0).toLocaleString()} XP</p>
              {!isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)} className="border-2">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-6">
          {/* Edit Form / Profile Details */}
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Edit3 className="h-5 w-5" />
                  <span>Edit Profile</span>
                </CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                        First Name
                      </label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="First name"
                        className="h-12"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                        Last Name
                      </label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Last name"
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-sm font-medium mb-2">
                      Username
                    </label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Choose a unique username"
                      className="h-12"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium mb-2">
                      Bio
                    </label>
                    <Input
                      id="bio"
                      name="bio"
                      type="text"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell us about yourself..."
                      maxLength={200}
                      className="h-12"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {formData.bio.length}/200 characters
                    </p>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white">
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel} className="border-2">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Rank Progress */}
              {rankInfo.nextRank && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span>Rank Progress</span>
                    </CardTitle>
                    <CardDescription>Your journey to {rankInfo.nextRank}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium">{user.stats?.rank || 'Iron'} → {rankInfo.nextRank}</span>
                      <span className="text-lg font-bold">{Math.round(rankInfo.progress)}%</span>
                    </div>
                    <Progress value={rankInfo.progress} className="h-3" />
                    <p className="text-sm text-muted-foreground text-center">
                      {rankInfo.remaining.toLocaleString()} XP remaining to advance
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Battle Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6 text-center">
                    <Zap className="h-12 w-12 mx-auto mb-4 text-blue-500 group-hover:scale-110 transition-transform" />
                    <p className="text-3xl font-bold">{user.stats?.totalDuels || 0}</p>
                    <p className="text-muted-foreground">Total Duels</p>
                  </CardContent>
                </Card>
                
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6 text-center">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-500 group-hover:scale-110 transition-transform" />
                    <p className="text-3xl font-bold">{user.stats?.wins || 0}</p>
                    <p className="text-muted-foreground">Victories</p>
                  </CardContent>
                </Card>
                
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6 text-center">
                    <Target className="h-12 w-12 mx-auto mb-4 text-green-500 group-hover:scale-110 transition-transform" />
                    <p className="text-3xl font-bold">{user.winRate || 0}%</p>
                    <p className="text-muted-foreground">Win Rate</p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Duel History Section */}
          <DuelHistory />
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-2 space-y-6">
          {/* Current Rank */}
          <Card className="bg-gradient-to-br from-primary/5 to-purple-600/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span>Current Rank</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <Badge variant="secondary" className="text-lg px-6 py-2 mb-3">
                  {user.stats?.rank || 'Iron'}
                </Badge>
                <p className="text-3xl font-bold text-primary">{(user.stats?.xp || 0).toLocaleString()} XP</p>
              </div>
            </CardContent>
          </Card>

          {/* Daily Streak */}
          <Card className="bg-gradient-to-br from-orange-500/5 to-red-600/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <span>Daily Streak</span>
              </CardTitle>
              <CardDescription>Keep playing to maintain your streak!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <Flame className="h-10 w-10 text-orange-500" />
                  <p className="text-4xl font-bold text-orange-500">{user.stats?.streak || 0}</p>
                </div>
                <p className="text-muted-foreground mb-4">
                  {user.stats?.streak === 0 ? "Complete a duel to start your streak!" : 
                   user.stats?.streak === 1 ? "Current Streak - 1 Day" : 
                   `Current Streak - ${user.stats?.streak} Days`}
                </p>
                <Separator className="my-3" />
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-muted-foreground">Longest Streak</span>
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Trophy className="h-3 w-3 text-yellow-500" />
                    <span>{user.stats?.longestStreak || 0} days</span>
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contest Ranking */}
          <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-600/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-blue-500" />
                <span>Contest Ranking</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contestRankingLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : contestRanking ? (
                <div className="text-center">
                  <Badge variant="secondary" className="text-lg px-6 py-2 mb-3 bg-gradient-to-r from-blue-500/10 to-cyan-600/10">
                    {contestRanking.rank}
                  </Badge>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {contestRanking.rating} Rating
                  </p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Max Rating: {contestRanking.maxRating}</p>
                    <p>Contests: {contestRanking.contestsParticipated}</p>
                    <p>Wins: {contestRanking.contestsWon}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Participate in contests to get ranked!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Achievement Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-primary" />
                <span>Recent Milestones</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user.stats?.totalDuels >= 10 && (
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <Medal className="h-8 w-8 text-orange-500" />
                    <div>
                      <p className="font-medium">Veteran Duelist</p>
                      <p className="text-sm text-muted-foreground">Completed 10+ duels</p>
                    </div>
                  </div>
                )}
                {user.stats?.wins >= 5 && (
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <Trophy className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="font-medium">Victory Streak</p>
                      <p className="text-sm text-muted-foreground">Won 5+ duels</p>
                    </div>
                  </div>
                )}
                {(user.stats?.xp || 0) >= 1000 && (
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <Star className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">XP Collector</p>
                      <p className="text-sm text-muted-foreground">Earned 1000+ XP</p>
                    </div>
                  </div>
                )}
                {!user.stats?.totalDuels && (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Complete your first duel to start earning achievements!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Friends Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Friends</span>
              </CardTitle>
              <CardDescription>Manage your friends and friend requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Friend */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Add Friend</label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter username"
                    value={newFriendUsername}
                    onChange={(e) => setNewFriendUsername(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendFriendRequest()}
                  />
                  <Button
                    onClick={sendFriendRequest}
                    disabled={isAddingFriend || !newFriendUsername.trim()}
                    size="sm"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Friend Requests */}
              {friendRequests.received.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Friend Requests</label>
                  <div className="space-y-2">
                    {friendRequests.received.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={request.from.profileImage} />
                            <AvatarFallback className="text-xs">
                              {request.from.firstName?.[0]}{request.from.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{request.from.username}</span>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acceptFriendRequest(request.id)}
                            className="h-6 px-2 text-xs"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectFriendRequest(request.id)}
                            className="h-6 px-2 text-xs"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator />
                </div>
              )}

              {/* Friends List */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Friends ({friends.length})
                </label>
                {friendsLoading ? (
                  <div className="text-center py-4">
                    <div className="text-sm text-muted-foreground">Loading friends...</div>
                  </div>
                ) : friends.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {friends.map((friend) => (
                      <div key={friend.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={friend.profileImage} />
                            <AvatarFallback className="text-xs">
                              {friend.firstName?.[0]}{friend.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{friend.username}</span>
                            <div className="flex items-center space-x-1">
                              <div className={`h-2 w-2 rounded-full ${friend.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                              <span className="text-xs text-muted-foreground">
                                {friend.isOnline ? 'Online' : 'Offline'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFriend(friend.id)}
                          className="h-6 px-2 text-xs hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <UserMinus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No friends yet</p>
                    <p className="text-xs text-muted-foreground">Add friends by their username</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
