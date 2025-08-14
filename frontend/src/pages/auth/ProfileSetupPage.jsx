import { useState } from 'react'
import { useUser, useAuth } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useUserContext } from '@/contexts/UserContext'
import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'

export function ProfileSetupPage() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const { updateUser } = useUserContext()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formData, setFormData] = useState({
    username: user?.username || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setFieldErrors({})

    // Basic validation
    const errors = {}
    if (!formData.username.trim()) {
      errors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters'
    } else if (formData.username.length > 30) {
      errors.username = 'Username must be less than 30 characters'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores'
    }

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setIsLoading(false)
      return
    }

    try {
      // Update profile with user context (this will also sync and update needsProfileSetup)
      await updateUser(formData)

      // Redirect to dashboard
      navigate('/dashboard')
    } catch (error) {
      console.error('Profile setup failed:', error)

      // Handle specific error types
      const errorMessage = error.message || error.toString()

      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        // Network error
        setError('Network error. Please check your connection and try again.')
      } else if (errorMessage.includes('Username taken') || errorMessage.includes('already in use') || errorMessage.includes('already taken')) {
        setFieldErrors({ username: 'This username is already taken. Please choose a different one.' })
      } else if (error.status === 400 || errorMessage.includes('400')) {
        // Check if it's a username validation error
        if (errorMessage.toLowerCase().includes('username')) {
          setFieldErrors({ username: 'Invalid username. Please choose a different one.' })
        } else {
          setError('Invalid input. Please check your information and try again.')
        }
      } else if (error.status === 500 || errorMessage.includes('500')) {
        setError('Server error. Please try again later.')
      } else if (error.status === 401 || errorMessage.includes('401')) {
        setError('Authentication error. Please sign in again.')
      } else {
        setError('Failed to complete profile setup. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }

    // Clear general error when user makes changes
    if (error) {
      setError('')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Tell us a bit more about yourself to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-1">
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
                className={fieldErrors.username ? 'border-red-500' : ''}
              />
              {fieldErrors.username && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.username}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium mb-1">
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
                  className={fieldErrors.firstName ? 'border-red-500' : ''}
                />
                {fieldErrors.firstName && (
                  <p className="text-sm text-red-500 mt-1">{fieldErrors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium mb-1">
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
                  className={fieldErrors.lastName ? 'border-red-500' : ''}
                />
                {fieldErrors.lastName && (
                  <p className="text-sm text-red-500 mt-1">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="bio" className="block text-sm font-medium mb-1">
                Bio (Optional)
              </label>
              <Input
                id="bio"
                name="bio"
                type="text"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                maxLength={200}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Setting up...' : 'Complete Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
