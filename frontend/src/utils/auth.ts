// Auth utility functions
export const setAuth = (access: string, refresh: string, user: any) => {
  try {
    localStorage.setItem('access', access)
    localStorage.setItem('refresh', refresh)
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    }
    console.log('Auth data saved successfully')
  } catch (error) {
    console.error('Error saving auth data to localStorage:', error)
    // Handle localStorage errors (e.g., quota exceeded)
    alert('Error saving authentication data. Please ensure cookies and local storage are enabled.')
  }
}

export const clearAuth = () => {
  try {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')
    console.log('Auth data cleared successfully')
  } catch (error) {
    console.error('Error clearing auth data:', error)
  }
}

export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error)
    // If we can't parse the user data, clear it to prevent future errors
    localStorage.removeItem('user')
    return null
  }
}

export const getAccessToken = () => {
  return localStorage.getItem('access')
}

export const getRefreshToken = () => {
  return localStorage.getItem('refresh')
}

export const isAuthenticated = () => {
  const token = getAccessToken()
  if (!token) return false
  
  // Additional check: if we have a token but no user data, something is wrong
  const user = getCurrentUser()
  if (!user) {
    console.warn('Access token exists but no user data found')
    // We could clear auth here, but that might be too aggressive
    // Instead, we'll let the token refresh mechanism try to recover
  }
  
  return !!token
}

export const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low':
      return 'text-green-600 bg-green-100'
    case 'medium':
      return 'text-yellow-600 bg-yellow-100'
    case 'high':
      return 'text-orange-600 bg-orange-100'
    case 'urgent':
      return 'text-red-600 bg-red-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'todo':
      return 'text-gray-600 bg-gray-100'
    case 'in-progress':
      return 'text-blue-600 bg-blue-100'
    case 'review':
      return 'text-yellow-600 bg-yellow-100'
    case 'done':
      return 'text-green-600 bg-green-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export const getProjectStatusColor = (status: string) => {
  switch (status) {
    case 'planning':
      return 'text-blue-600 bg-blue-100'
    case 'in-progress':
      return 'text-green-600 bg-green-100'
    case 'review':
      return 'text-yellow-600 bg-yellow-100'
    case 'completed':
      return 'text-purple-600 bg-purple-100'
    case 'on-hold':
      return 'text-orange-600 bg-orange-100'
    case 'cancelled':
      return 'text-red-600 bg-red-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}
