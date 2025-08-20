import { useAuth } from '@clerk/clerk-react'
import { Navigate, useLocation } from 'react-router-dom'
import { useUserContext } from '@/contexts/UserContext'

export function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth()
  const { user, loading, needsProfileSetup } = useUserContext()
  const location = useLocation()

  // Debug logging
  console.log('ProtectedRoute state:', {
    isLoaded,
    isSignedIn,
    loading,
    needsProfileSetup,
    pathname: location.pathname,
    user: user ? { username: user.username, firstName: user.firstName, lastName: user.lastName } : null
  })

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  // Redirect to profile setup if needed (except if already on profile setup page)
  if (needsProfileSetup && location.pathname !== '/profile-setup') {
    console.log('Redirecting to profile setup from:', location.pathname)
    return <Navigate to="/profile-setup" replace />
  }

  // Don't allow access to profile setup if not needed
  if (!needsProfileSetup && location.pathname === '/profile-setup') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
