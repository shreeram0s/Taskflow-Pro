import axios from 'axios'
import { User, Project, Task, TaskForm, ProjectForm, LoginForm, RegisterForm, AnalyticsData, DashboardAnalytics, Notification, AnalyticsEvent } from '../types'

// Create axios instance with base URL
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const access = localStorage.getItem('access')
    if (access) {
      config.headers['Authorization'] = `Bearer ${access}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle network errors
    if (!error.response) {
      console.error('Network error detected:', error.message)
      return Promise.reject({
        response: {
          data: {
            error: 'Network error. Please check your internet connection.'
          }
        }
      })
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refresh = localStorage.getItem('refresh')
        if (refresh) {
          console.log('Attempting token refresh...')
          const response = await api.post('/token/refresh/', { refresh })

          if (!response.data.access) {
            throw new Error('Invalid refresh response')
          }

          const { access } = response.data
          localStorage.setItem('access', access)
          console.log('Token refresh successful')

          // Retry the original request with new token
          originalRequest.headers['Authorization'] = `Bearer ${access}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        // Refresh failed, clear auth data and redirect to login
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
        localStorage.removeItem('user')
        console.log('Auth data cleared, redirecting to login')
        window.location.href = '/login'
      }
    }

    // Enhanced error handling with retry logic
    if (error.response?.status >= 500 && !originalRequest._retry) {
      originalRequest._retry = true
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1

      if (originalRequest._retryCount <= 3) {
        console.log(`Retrying request (${originalRequest._retryCount}/3)...`)
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, originalRequest._retryCount) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        return api(originalRequest)
      }
    }

    return Promise.reject(error)
  }
)

// Auth services
export const authService = {
  register: (userData: RegisterForm) => {
    console.log('API Service: Sending register request', { username: userData.username, email: userData.email })
    // Add debugging to see the full request payload
    console.log('Full registration payload:', JSON.stringify(userData, null, 2))
    return api.post('/users/register/', userData)
      .catch(error => {
        console.error('API Service: Registration request failed', error.response?.status, error.message)
        if (error.response?.data) {
          console.error('API Service: Registration error details:', JSON.stringify(error.response.data, null, 2))
        }
        throw error
      })
  },
  
  login: (credentials: LoginForm) => {
    console.log('API Service: Sending login request', { username: credentials.username })
    // Remove selectedRole from credentials before sending to backend
    const { selectedRole, ...loginData } = credentials
    return api.post('/users/login/', loginData)
      .catch(error => {
        console.error('API Service: Login request failed', error.response?.status, error.message)
        throw error
      })
  },
  
  refreshToken: (refresh: string) => {
    console.log('API Service: Attempting token refresh')
    return api.post('/token/refresh/', { refresh })
      .catch(error => {
        console.error('API Service: Token refresh failed', error.response?.status, error.message)
        throw error
      })
  },
  
  logout: async () => {
    console.log('API Service: Logging out user')
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')
  },
  
  getCurrentUser: (): Promise<{ data: User }> => {
    console.log('API Service: Fetching current user profile')
    return api.get('/users/profile/')
      .catch(error => {
        console.error('API Service: Get current user failed', error.response?.status, error.message)
        throw error
      })
  },
  updateProfile: (userData: Partial<User>) => {
    console.log('API Service: Updating user profile')
    return api.put('/users/profile/', userData)
      .catch(error => {
        console.error('API Service: Profile update failed', error.response?.status, error.message)
        throw error
      })
  },
  changePassword: (passwordData: { current_password: string; new_password: string }) => {
    console.log('API Service: Changing password')
    return api.post('/users/change_password/', passwordData)
      .catch(error => {
        console.error('API Service: Password change failed', error.response?.status, error.message)
        throw error
      })
  },
  passwordReset: (data: { email: string }) => {
    console.log('API Service: Requesting password reset', { email: data.email })
    return api.post('/users/password_reset/', data)
      .catch(error => {
        console.error('API Service: Password reset request failed', error.response?.status, error.message)
        throw error
      })
  },
  passwordResetConfirm: (data: { token: string; new_password: string; confirm_password: string }) => {
    console.log('API Service: Resetting password with token')
    return api.post('/users/password_reset_confirm/', data)
      .catch(error => {
        console.error('API Service: Password reset failed', error.response?.status, error.message)
        throw error
      })
  },
}

// Project services
export const projectService = {
  getAllProjects: (): Promise<{ data: Project[] }> => api.get('/projects/'),
  getProject: (id: number): Promise<{ data: Project }> => api.get(`/projects/${id}/`),
  createProject: (projectData: ProjectForm): Promise<{ data: Project }> => api.post('/projects/', projectData),
  updateProject: (id: number, projectData: Partial<ProjectForm>): Promise<{ data: Project }> =>
    api.put(`/projects/${id}/`, projectData),
  deleteProject: (id: number) => api.delete(`/projects/${id}/`),
  addMember: (projectId: number, userId: number) =>
    api.post(`/projects/${projectId}/members/`, { user_id: userId }),
  removeMember: (projectId: number, userId: number) =>
    api.delete(`/projects/${projectId}/members/${userId}/`),
  getAssignableUsers: (projectId: number): Promise<{ data: User[] }> =>
    api.get(`/projects/${projectId}/assignable_users/`),
}

// Task services
export const taskService = {
  getAllTasks: async (projectId?: number, params?: any): Promise<{ data: Task[] }> => {
    try {
      const response = projectId
        ? await api.get(`/projects/${projectId}/tasks/`, { params })
        : await api.get('/tasks/', { params })
      return response
    } catch (error: any) {
      console.error('Get Tasks API Error:', error)
      return { data: [] }
    }
  },
  getTask: async (taskId: number): Promise<{ data: Task }> => {
    try {
      const response = await api.get(`/tasks/${taskId}/`)
      return response
    } catch (error: any) {
      console.error('Get Task API Error:', error)
      throw error
    }
  },
  createTask: async (projectId: number, taskData: TaskForm): Promise<{ data: Task }> => {
    try {
      const response = await api.post(`/projects/${projectId}/tasks/`, taskData)
      return response
    } catch (error: any) {
      console.error('Create Task API Error:', error)
      throw error
    }
  },
  updateTask: async (taskId: number, taskData: Partial<TaskForm>): Promise<{ data: Task }> => {
    try {
      const response = await api.patch(`/tasks/${taskId}/`, taskData)
      return response
    } catch (error: any) {
      console.error('Update Task API Error:', error)
      throw error
    }
  },
  deleteTask: async (taskId: number) => {
    try {
      return await api.delete(`/tasks/${taskId}/`)
    } catch (error: any) {
      console.error('Delete Task API Error:', error)
      throw error
    }
  },
  addComment: async (taskId: number, comment: string) => {
    try {
      return await api.post(`/tasks/${taskId}/comments/`, { content: comment })
    } catch (error: any) {
      console.error('Add Comment API Error:', error)
      throw error
    }
  },
  assign: async (taskId: number, userId: number) => {
    try {
      return await api.post(`/tasks/${taskId}/assign/`, { user_id: userId })
    } catch (error: any) {
      console.error('Assign Task API Error:', error)
      throw error
    }
  },
  unassign: async (taskId: number) => {
    try {
      return await api.post(`/tasks/${taskId}/unassign/`)
    } catch (error: any) {
      console.error('Unassign Task API Error:', error)
      throw error
    }
  },
  changeStatus: async (taskId: number, status: Task['status']) => {
    try {
      return await api.post(`/tasks/${taskId}/change_status/`, { status })
    } catch (error: any) {
      console.error('Change Status API Error:', error)
      throw error
    }
  },
  changePriority: async (taskId: number, priority: Task['priority']) => {
    try {
      return await api.post(`/tasks/${taskId}/change_priority/`, { priority })
    } catch (error: any) {
      console.error('Change Priority API Error:', error)
      throw error
    }
  },
  uploadAttachment: async (taskId: number, file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      return await api.post(`/tasks/${taskId}/attachments/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    } catch (error: any) {
      console.error('Upload Attachment API Error:', error)
      throw error
    }
  },
}

// Analytics services
export const analyticsService = {
  getDashboardAnalytics: async (): Promise<{ data: DashboardAnalytics }> => {
    try {
      const response = await api.get('/events/dashboard/')
      return response
    } catch (error: any) {
      console.error('Analytics API Error:', error)
      // Return fallback data structure
      return {
        data: {
          task_stats: { total: 0, completed: 0, in_progress: 0, todo: 0, review: 0 },
          completion_percentage: 0,
          recent_activities: [],
          productivity: { tasks_completed_recently: 0, days_analyzed: 7 },
          project_progress: []
        }
      }
    }
  },
  getTaskCompletionAnalytics: async (): Promise<{ data: any }> => {
    try {
      const response = await api.get('/events/task-analytics/')
      return response
    } catch (error: any) {
      console.error('Task Analytics API Error:', error)
      return { data: { status_changes: [], completion_by_priority: {}, avg_completion_time: 0 } }
    }
  },
  getTaskAnalytics: async (days?: number): Promise<{ data: any }> => {
    try {
      const response = await api.get('/events/task-analytics/', { params: { days } })
      return response
    } catch (error: any) {
      console.error('Task Analytics API Error:', error)
      return { data: { status_changes: [], completion_by_priority: {}, avg_completion_time: 0 } }
    }
  },
  logUserBehavior: (data: any) => api.post('/events/', data),
}

// Events services
export const eventsService = {
  createEvent: (eventData: Partial<AnalyticsEvent>) => api.post('/events/', eventData),
  getEvents: (params?: { event_type?: string; entity_type?: string; days?: number }) =>
    api.get('/events/list/', { params }),
  getDashboardAnalytics: (days?: number) =>
    api.get('/events/dashboard/', { params: { days } }),
  getTaskAnalytics: (days?: number) =>
    api.get('/events/task-analytics/', { params: { days } }),
}

// User services
export const userService = {
  searchUsers: (query: string): Promise<{ data: User[] }> =>
    api.get(`/users/search/?q=${query}`),
  getUserActivityLogs: (): Promise<{ data: any[] }> => api.get('/users/activity/'),
  getNotifications: (): Promise<{ data: Notification[] }> => api.get('/users/notifications/'),
  markNotificationAsRead: (notificationId: number) =>
    api.post(`/users/mark_notification_read/`, { notification_id: notificationId }),
  markAllNotificationsAsRead: () => api.post('/users/mark_all_read/'),
}

export { api }
