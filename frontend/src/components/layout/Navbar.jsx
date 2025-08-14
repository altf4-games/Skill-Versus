import { Link, useNavigate } from 'react-router-dom'
import { useAuth, UserButton } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useTheme } from '@/contexts/ThemeContext'
import { Swords, Trophy, User, Zap, Code, Calendar } from 'lucide-react'

export function Navbar() {
  const { isSignedIn } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()

  return (
    <nav className="border-b bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Swords className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">SkillVersus</span>
            </Link>
            
            {isSignedIn && (
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <Link 
                  to="/dashboard" 
                  className="text-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/duels" 
                  className="text-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <Zap className="h-4 w-4" />
                    <span>Duels</span>
                  </div>
                </Link>
                <Link
                  to="/practice"
                  className="text-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <Code className="h-4 w-4" />
                    <span>Practice</span>
                  </div>
                </Link>
                <Link
                  to="/leaderboard"
                  className="text-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <Trophy className="h-4 w-4" />
                    <span>Leaderboard</span>
                  </div>
                </Link>
                <div className="text-muted-foreground px-3 py-2 text-sm font-medium cursor-not-allowed">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Contests (Coming Soon)</span>
                  </div>
                </div>
                <Link
                  to="/profile"
                  className="text-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </div>
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {isSignedIn ? (
              <UserButton 
                appearance={{
                  baseTheme: theme === 'dark' ? 'dark' : 'light',
                  elements: {
                    avatarBox: 'h-8 w-8'
                  }
                }}
              />
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/sign-in')}
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate('/sign-up')}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
