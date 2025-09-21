import React, { createContext, useState, useEffect, useContext } from 'react'
import { authService } from '../services/api'
import { setAuth, clearAuth, getCurrentUser, isAuthenticated } from '../utils/auth'
import { User, LoginForm, RegisterForm, AuthContextType } from '../types'

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // Function to refresh user data
  const refreshUserData = async () => {
    try {
      if (isAuthenticated()) {
        console.log('Auto-refreshing user data...')
        const response = await authService.getCurrentUser()
        console.log('Auto-refresh user data response:', response.data)
        
        // Update user in state and localStorage
        setUser(response.data)
        setAuth(localStorage.getItem('access')!, localStorage.getItem('refresh')!, response.data)
        return true
      }
      return false
    } catch (err) {
      console.error('Error during auto-refresh of user data:', err)
      return false
    }
  }

  // Initialize auth state from local storage
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('Initializing auth...')
        const isAuth = isAuthenticated()
        console.log('Is authenticated:', isAuth)

        if (isAuth) {
          // Get user from local storage initially
          const storedUser = getCurrentUser()
          console.log('Stored user:', storedUser)
          setUser(storedUser)

          // Then fetch fresh user data from API
          try {
            console.log('Fetching current user from API...')
            const response = await authService.getCurrentUser()
            console.log('API user response:', response.data)
            setUser(response.data)
            
            // Setup auto-refresh interval (every 30 seconds)
            const interval = setInterval(refreshUserData, 30000)
            setRefreshInterval(interval)
          } catch (err) {
            // If API call fails, keep using stored user data
            console.error('Error fetching current user:', err)
            console.log('Using stored user data instead')
          }
        } else {
          console.log('Not authenticated, clearing user')
          setUser(null)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        setError('Failed to initialize authentication')
      } finally {
        console.log('Auth initialization complete, setting loading to false')
        setLoading(false)
      }
    }

    initAuth()
    
    // Cleanup interval on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [])

  // Login function
  const login = async (credentials: LoginForm): Promise<User> => {
    try {
      console.log('Starting login process...')
      setLoading(true)
      setError(null)

      // Clear any existing refresh interval
      if (refreshInterval) {
        clearInterval(refreshInterval)
        setRefreshInterval(null)
      }

      try {
        console.log('Attempting API login...')
        const response = await authService.login(credentials)
        console.log('API login response:', response.data)
        
        // Check if we received the expected tokens
        if (!response.data.access || !response.data.refresh) {
          throw new Error('Invalid response from server: missing authentication tokens')
        }
        
        const { access, refresh } = response.data

        // Save tokens immediately so subsequent requests include Authorization header
        setAuth(access, refresh, null)

        // Fetch current user profile after login
        try {
          console.log('Fetching user profile...')
          const me = await authService.getCurrentUser()
          console.log('User profile:', me.data)
          
          if (!me.data) {
            throw new Error('Failed to retrieve user profile')
          }
          
          // Store role information for role-based access control
          const userData = {
            ...me.data,
            isEmployee: me.data.role === 'employee',
            isScrumMaster: me.data.role === 'scrum_master'
          };
          
          console.log('User role information:', {
            role: me.data.role,
            isEmployee: userData.isEmployee,
            isScrumMaster: userData.isScrumMaster
          });
          
          setAuth(access, refresh, userData)
          setUser(userData)
          
          // Setup auto-refresh interval (every 30 seconds)
          const interval = setInterval(refreshUserData, 30000)
          setRefreshInterval(interval)
          
          console.log('Login successful, user set:', userData)
          return userData
        } catch (e) {
          console.error('Error fetching user profile:', e)
          // Keep tokens but show error
          throw new Error('Authentication successful but failed to load user profile. Please try again.')
        }
      } catch (apiError: any) {
        console.error('API login error:', apiError)
        // Clear any partial auth data on failure
        clearAuth()
        // Surface real API error with better error handling
        const message = apiError?.response?.data?.detail || 
                        apiError?.response?.data?.error || 
                        apiError?.message || 
                        'Login failed. Please check your credentials and try again.'
        throw new Error(message)
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Register function
  const register = async (userData: RegisterForm): Promise<User> => {
    try {
      console.log('Starting registration process...', { username: userData.username, email: userData.email })
      setLoading(true)
      setError(null)
      
      try {
        // Ensure role is properly formatted for backend
        const formattedUserData = {
          ...userData,
          role: userData.role || 'employee', // Default to employee if not specified
          confirm_password: userData.password // Ensure confirm_password is sent to backend
        }
        
        console.log('Sending registration request to API...', { role: formattedUserData.role })
        const registerResponse = await authService.register(formattedUserData)
        console.log('Registration API response:', registerResponse)
        
        // After successful registration, attempt to login with role information
        console.log('Registration successful, attempting login...')
        try {
          return await login({ 
            username: userData.username, 
            password: userData.password,
            role: formattedUserData.role // Pass role information for login
          })
        } catch (loginErr: any) {
          console.error('Error during post-registration login:', loginErr)
          throw new Error('Registration successful but login failed. Please try logging in manually.')
        }
      } catch (apiError: any) {
        console.error('API registration error:', apiError)
        
        // Handle validation errors from the server
        if (apiError.response && apiError.response.data) {
          console.log('Server returned validation errors:', apiError.response.data)
          // Pass through the detailed error response for field-level validation
          throw apiError
        }
        
        // Generic error handling
        const errorMessage = apiError.response?.data?.detail || 
                            apiError.response?.data?.error || 
                            apiError.message || 
                            'Registration failed. Please try again.'
        throw new Error(errorMessage)
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed'
      setError(errorMessage)
      throw err // Preserve the original error to maintain response data for field validation
    } finally {
      setLoading(false)
    }
  }

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      setLoading(true)
      await authService.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      clearAuth()
      setUser(null)
      setLoading(false)
    }
  }

  // Update profile function
  const updateProfile = async (userData: Partial<User>): Promise<User> => {
    try {
      setLoading(true)
      setError(null)
      const response = await authService.updateProfile(userData)
      const updatedUser = response.data
      setAuth(localStorage.getItem('access')!, localStorage.getItem('refresh')!, updatedUser)
      setUser(updatedUser)
      return updatedUser
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Profile update failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Change password function
  const changePassword = async (passwordData: { current_password: string; new_password: string }): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      await authService.changePassword(passwordData)
      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Password change failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Context value
  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
