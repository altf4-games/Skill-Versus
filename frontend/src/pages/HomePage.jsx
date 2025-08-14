import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SEO, seoConfigs } from '@/components/SEO'
import { Swords, Code, Palette, Bug, Trophy, Users, Zap, Star, ArrowRight } from 'lucide-react'

export function HomePage() {
  const { isSignedIn } = useAuth()

  const skillModes = [
    {
      icon: Code,
      title: "DSA Duel",
      description: "Both players get the same Leetcode-style problem. First to solve wins.",
      color: "text-blue-500"
    },
    {
      icon: Palette,
      title: "CSS Arena",
      description: "Recreate a design under time pressure. Pixel diff decides winner.",
      color: "text-purple-500"
    },
    {
      icon: Bug,
      title: "Debug Me",
      description: "Fix broken code. First to get proper output wins.",
      color: "text-red-500"
    },
    {
      icon: Trophy,
      title: "UI Trivia",
      description: "Multiple-choice rounds on design principles and UI fails.",
      color: "text-yellow-500"
    }
  ]

  return (
    <>
      <SEO {...seoConfigs.home} />
      <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative text-center space-y-8 py-12">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 rounded-3xl"></div>
        <div className="relative space-y-6">
          <Badge variant="secondary" className="mb-4">
            🚀 Join the Ultimate Coding Arena
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
            SkillVersus
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Real-Time 1v1 Skill Duels Platform
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Challenge students in live coding battles across DSA, CSS, debugging, and more. 
            Compete for leaderboard glory and prove your skills!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          {isSignedIn ? (
            <Button asChild size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white shadow-xl">
              <Link to="/dashboard">
                <Zap className="mr-2 h-5 w-5" />
                Start Dueling
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white shadow-xl">
                <Link to="/sign-up">
                  <Swords className="mr-2 h-5 w-5" />
                  Join the Arena
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 border-2 hover:bg-muted/50">
                <Link to="/sign-in">
                  Sign In
                </Link>
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Skill Modes */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold">Battle Modes</h2>
          <p className="text-muted-foreground text-lg">Choose your arena and prove your skills</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {skillModes.map((mode, index) => {
            const Icon = mode.icon
            return (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br from-muted to-muted/50 group-hover:from-primary/10 group-hover:to-primary/5 transition-colors`}>
                      <Icon className={`h-6 w-6 ${mode.color} group-hover:scale-110 transition-transform`} />
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{mode.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-relaxed">{mode.description}</CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold">How It Works</h2>
          <p className="text-muted-foreground text-lg">Get started in 4 simple steps</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/10 to-transparent"></div>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Badge variant="default" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</Badge>
                <span>Challenge</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="leading-relaxed">
                Create or accept a 1v1 challenge. Choose skill area, set difficulty, invite friends or go public.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/10 to-transparent"></div>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Badge variant="default" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-purple-600">2</Badge>
                <span>Duel</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="leading-relaxed">
                Live duel room with split-screen editor, countdown timer, and auto-checker for solutions.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-pink-500/10 to-transparent"></div>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Badge variant="default" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-pink-600">3</Badge>
                <span>Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="leading-relaxed">
                Win/Loss reveal with XP gain, rank progression, and option to rematch or celebrate victory.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-500/10 to-transparent"></div>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Badge variant="default" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-yellow-600">4</Badge>
                <span>Glory</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="leading-relaxed">
                Climb the global leaderboard and advance through ranks from Iron to Platinum.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold">Features</h2>
          <p className="text-muted-foreground text-lg">Everything you need for competitive coding</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-600/5">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
                <span>Rank System</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="leading-relaxed">
                Progress through Iron, Bronze, Silver, Gold, and Platinum tiers. Track your skill journey and improvements.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <span>Global Community</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="leading-relaxed">
                Join a worldwide community of developers. Spectator mode for watching top duels live and learning from the best.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/5">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <span>Live Competition</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="leading-relaxed">
                Real-time duels with ghost mode to beat past solutions. Progress through ranks and become a coding champion.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
    </>
  )
}
