import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus, Crown, Target } from 'lucide-react'

export function TeamsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">College Teams</h1>
          <p className="text-muted-foreground">Join your college crew and compete together</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              <span>MIT Coders</span>
            </CardTitle>
            <CardDescription>Massachusetts Institute of Technology</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Members</span>
                <span>24/30</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Team Rating</span>
                <span className="font-medium text-yellow-600">Gold</span>
              </div>
              <Button className="w-full mt-4" variant="outline">View Team</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <span>Stanford Hackers</span>
            </CardTitle>
            <CardDescription>Stanford University</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Members</span>
                <span>18/25</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Team Rating</span>
                <span className="font-medium text-gray-600">Silver</span>
              </div>
              <Button className="w-full mt-4" variant="outline">View Team</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-500" />
              <span>Berkeley Bears</span>
            </CardTitle>
            <CardDescription>UC Berkeley</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Members</span>
                <span>15/20</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Team Rating</span>
                <span className="font-medium text-orange-600">Bronze</span>
              </div>
              <Button className="w-full mt-4" variant="outline">View Team</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Team</CardTitle>
          <CardDescription>You haven't joined a team yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Join a college team to compete in inter-campus tournaments</p>
            <div className="space-x-4">
              <Button>Find My College</Button>
              <Button variant="outline">Create New Team</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
