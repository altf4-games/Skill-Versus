import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { apiClient } from '@/lib/api'

const UserContext = createContext()

export function UserProvider({ children }) {
  const { getToken, isSignedIn } = useAuth()
  const { user: clerkUser } = useUser()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false)

  const syncUser = async () => {
    if (!isSignedIn || !clerkUser) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const token = await getToken()
      
      const response = await apiClient.syncUser(token)
      
      if (response.success) {
        setUser(response.user)
        
        // Check if user needs to complete profile setup
        const needsSetup = !response.user.username || 
                          !response.user.firstName || 
                          !response.user.lastName
        setNeedsProfileSetup(needsSetup)
      }
    } catch (error) {
      console.error('Failed to sync user:', error)
      // If sync fails, might be a new user that needs setup
      setNeedsProfileSetup(true)
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    if (!isSignedIn || !clerkUser) {
      return
    }

    try {
      const token = await getToken()
      const response = await apiClient.syncUser(token)
      
      if (response.success) {
        setUser(response.user)
        
        // Check if user needs to complete profile setup
        const needsSetup = !response.user.username || 
                          !response.user.firstName || 
                          !response.user.lastName
        setNeedsProfileSetup(needsSetup)
        
        return response.user
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  const updateUser = async (userData) => {
    if (!isSignedIn) return

    try {
      const token = await getToken()
      const response = await apiClient.updateUserProfile(token, userData)

      if (response.success) {
        setUser(response.user)
        setNeedsProfileSetup(false)
        return response.user
      } else {
        // If response is not successful but no error was thrown
        throw new Error(response.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Failed to update user:', error)
      // Re-throw the error with better context
      const enhancedError = new Error(error.message || 'Failed to update profile')
      enhancedError.status = error.status
      throw enhancedError
    }
  }

  useEffect(() => {
    syncUser()
  }, [isSignedIn, clerkUser])

  const value = {
    user,
    loading,
    needsProfileSetup,
    syncUser,
    updateUser,
    setNeedsProfileSetup
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUserContext() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider')
  }
  return context
}
