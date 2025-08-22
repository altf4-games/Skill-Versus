import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { UserProvider } from '@/contexts/UserContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { SocketProvider } from '@/contexts/SocketContext'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Pages
import { HomePage } from '@/pages/HomePage'
import { SignInPage } from '@/pages/auth/SignInPage'
import { SignUpPage } from '@/pages/auth/SignUpPage'
import { ProfileSetupPage } from '@/pages/auth/ProfileSetupPage'
import { DashboardPage } from '@/pages/DashboardPage'
import DuelsPage from '@/pages/DuelsPage'
import { LeaderboardPage } from '@/pages/LeaderboardPage'
import { ProfilePage } from '@/pages/ProfilePage'
import DuelRoom from '@/pages/DuelRoom'
import { PracticePage } from '@/pages/PracticePage'
import ContestsPage from '@/pages/ContestsPage'
import ContestRoom from '@/pages/ContestRoom'
import CreateContestPage from '@/pages/CreateContestPage'


const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_Y29tcGV0ZW50LXNxdWlycmVsLTI0LmNsZXJrLmFjY291bnRzLmRldiQ'

function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <ThemeProvider>
        <UserProvider>
          <SocketProvider>
            <Router>
              <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/sign-in" element={<SignInPage />} />
                <Route path="/sign-up" element={<SignUpPage />} />
                <Route 
                  path="/profile-setup" 
                  element={
                    <ProtectedRoute>
                      <ProfileSetupPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } 
                />
              <Route 
                path="/duels" 
                element={
                  <ProtectedRoute>
                    <DuelsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/duel/:roomCode" 
                element={
                  <ProtectedRoute>
                    <DuelRoom />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/leaderboard" 
                element={
                  <ProtectedRoute>
                    <LeaderboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/practice"
                element={
                  <ProtectedRoute>
                    <PracticePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contests"
                element={
                  <ProtectedRoute>
                    <ContestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contests/create"
                element={
                  <ProtectedRoute>
                    <CreateContestPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contests/:contestId"
                element={
                  <ProtectedRoute>
                    <ContestRoom />
                  </ProtectedRoute>
                }
              />

            </Routes>
          </Layout>
        </Router>
        </SocketProvider>
        </UserProvider>
        </ThemeProvider>
    </ClerkProvider>
  )
}

export default App
