import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SEO, seoConfigs } from '@/components/SEO'
import { 
  Swords, Code, Palette, Bug, Trophy, Users, Star, ArrowRight, 
  Shield, Clock, Target, Gamepad2, Crown, Sparkles,
  Play, Eye, TrendingUp, Zap
} from 'lucide-react'

export function HomePage() {
  const { isSignedIn } = useAuth()

  const skillModes = [
    {
      icon: Code,
      title: "DSA 1v1",
      description: "Real-time algorithmic coding battles",
      color: "from-blue-500 to-cyan-500",
      bgGlow: "bg-blue-500/10"
    },
    {
      icon: Zap,
      title: "Typing Duels",
      description: "Speed typing competitions with code snippets",
      color: "from-purple-500 to-pink-500",
      bgGlow: "bg-purple-500/10"
    },
    {
      icon: Trophy,
      title: "CP Contests",
      description: "Competitive programming tournaments",
      color: "from-yellow-500 to-amber-500",
      bgGlow: "bg-yellow-500/10"
    }
  ]

  const features = [
    {
      icon: Trophy,
      title: "Ranking System",
      description: "Climb from Iron to Platinum through skill-based matches",
      stats: "5 Tiers • XP Based"
    },
    {
      icon: Clock,
      title: "Real-time Duels",
      description: "Live coding battles with instant feedback and results",
      stats: "Live Sync"
    },
    {
      icon: Users,
      title: "Global Community",
      description: "Join developers worldwide in epic code battles",
      stats: "Growing Daily"
    },
    {
      icon: TrendingUp,
      title: "Progress Tracking",
      description: "Detailed analytics on your coding journey and improvements",
      stats: "Stats • Insights"
    }
  ]

  return (
    <>
      <SEO {...seoConfigs.home} />
      <div className="overflow-hidden">
        
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Gradient orbs */}
            <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 dark:from-blue-600/30 dark:to-cyan-600/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-32 right-32 w-[500px] h-[500px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 dark:from-purple-600/30 dark:to-pink-600/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-gradient-to-r from-indigo-500/15 to-blue-500/15 dark:from-indigo-600/25 dark:to-blue-600/25 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            
            {/* Spinning gradient ring */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px]">
              <div className="absolute inset-0 bg-gradient-conic from-transparent via-purple-500/10 to-transparent dark:via-purple-600/15 rounded-full animate-spin" style={{animationDuration: '20s'}}></div>
            </div>
            
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05]"></div>
          </div>

          <div className="relative z-10 text-center space-y-8 px-4 max-w-6xl mx-auto">
            {/* Floating badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Real-Time Competitive Coding Platform
              </span>
            </div>

            {/* Main headline */}
            <div className="space-y-6">
              <h1 className="text-6xl md:text-8xl font-black tracking-tight">
                <span className="block bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x">
                  Skill
                </span>
                <span className="block bg-gradient-to-r from-pink-500 via-purple-500 to-primary bg-clip-text text-transparent animate-gradient-x">
                  Versus
                </span>
              </h1>
              
              <p className="text-xl md:text-3xl font-bold text-foreground/90 max-w-4xl mx-auto leading-tight">
                Real-Time 1v1 Coding Duels
              </p>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Challenge developers worldwide in live coding battles. Master algorithms, debug like a pro, and climb the global leaderboard in the ultimate programming arena.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
              {isSignedIn ? (
                <Button asChild size="lg" className="text-lg px-8 py-6 h-14 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 shadow-2xl hover:shadow-primary/25 transition-all duration-300 transform hover:scale-105">
                  <Link to="/dashboard" className="flex items-center gap-2 text-white dark:text-white">
                    <Play className="h-5 w-5" />
                    Start Dueling
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="text-lg px-8 py-6 h-14 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 shadow-2xl hover:shadow-primary/25 transition-all duration-300 transform hover:scale-105">
                    <Link to="/sign-up" className="flex items-center gap-2 text-white dark:text-white">
                      <Swords className="h-5 w-5" />
                      Join the Arena
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 h-14 border-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300">
                    <Link to="/sign-in">
                      Sign In
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Key highlights */}
            <div className="flex flex-wrap justify-center gap-8 mt-16 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">Real-Time</div>
                <div className="text-sm text-muted-foreground">Live Coding Battles</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">3 Modes</div>
                <div className="text-sm text-muted-foreground">Different Challenges</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">Ranked</div>
                <div className="text-sm text-muted-foreground">Competitive System</div>
              </div>
            </div>
          </div>
        </section>

        {/* Battle Modes */}
        <section className="relative py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-4 mb-16">
              <Badge variant="outline" className="mb-4 px-4 py-2">
                <Gamepad2 className="w-4 h-4 mr-2" />
                Battle Modes
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold">Choose Your Arena</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Multiple battle modes to test your coding skills
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {skillModes.map((mode, index) => {
                const Icon = mode.icon
                return (
                  <div key={index} className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 h-full transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2">
                      <div className="space-y-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${mode.color} p-0.5 group-hover:scale-110 transition-transform duration-300`}>
                          <div className="w-full h-full bg-background rounded-xl flex items-center justify-center">
                            <Icon className="h-6 w-6 text-foreground" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                            {mode.title}
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {mode.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="relative py-24 px-4 bg-gradient-to-b from-transparent to-primary/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-4 mb-16">
              <Badge variant="outline" className="mb-4 px-4 py-2">
                <Star className="w-4 h-4 mr-2" />
                Features
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold">Built for Champions</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to dominate the coding battlefield
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl"></div>
                    <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 h-full transition-all duration-300 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {feature.stats}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold">{feature.title}</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="relative py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-4 mb-16">
              <Badge variant="outline" className="mb-4 px-4 py-2">
                <Shield className="w-4 h-4 mr-2" />
                How It Works
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold">Start Dueling in Seconds</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                From challenge to victory in just four simple steps
              </p>
            </div>

            <div className="relative">
              {/* Connection lines */}
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent transform -translate-y-1/2"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { step: 1, title: "Challenge", desc: "Create or accept duels", icon: Target },
                  { step: 2, title: "Battle", desc: "Code in real-time arena", icon: Swords },
                  { step: 3, title: "Results", desc: "Instant winner declaration", icon: Crown },
                  { step: 4, title: "Rank Up", desc: "Climb the leaderboard", icon: TrendingUp }
                ].map((item, index) => {
                  const Icon = item.icon
                  return (
                    <div key={index} className="relative flex flex-col items-center text-center group">
                      <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                        <Icon className="h-8 w-8 text-primary-foreground" />
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg">
                          {item.step}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 backdrop-blur-sm border border-primary/20 rounded-3xl p-12 space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold">
                Ready to Prove Your Skills?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join developers worldwide in the ultimate coding arena. Your next victory awaits.
              </p>
              
              {!isSignedIn && (
                <Button asChild size="lg" className="text-lg px-8 py-6 h-14 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 shadow-2xl hover:shadow-primary/25 transition-all duration-300 transform hover:scale-105">
                  <Link to="/sign-up" className="flex items-center gap-2 text-white dark:text-white">
                    <Crown className="h-5 w-5" />
                    Claim Your Throne
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>

  <style>{`
        @keyframes gradient-x {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
        
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px);
          background-size: 40px 40px;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </>
  )
}