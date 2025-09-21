import React, { useState, useEffect } from 'react'
import { User, Task, Project } from '../types'
import { taskService, projectService, analyticsService } from '../services/api'
import { useRealTimeSync } from '../hooks/useRealTimeSync'
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Target,
  Activity,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  PieChart,
  LineChart,
  Zap,
  Star,
  Award
} from 'lucide-react'

interface AnalyticsProps {
  user: User
}

interface AnalyticsData {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  overdueTasks: number
  urgentTasks: number
  completionRate: number
  averageCompletionTime: number
  productivityScore: number
  teamPerformance: {
    totalUsers: number
    activeUsers: number
    topPerformers: Array<{
      id: number
      name: string
      completedTasks: number
      productivityScore: number
    }>
  }
  projectStats: Array<{
    id: number
    name: string
    totalTasks: number
    completedTasks: number
    completionRate: number
  }>
  taskDistribution: {
    todo: number
    inProgress: number
    review: number
    done: number
  }
  priorityDistribution: {
    low: number
    medium: number
    high: number
    urgent: number
  }
  weeklyTrends: Array<{
    date: string
    completed: number
    created: number
  }>
}

const Analytics: React.FC<AnalyticsProps> = ({ user }) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    fetchData()
  }, [selectedProject, timeRange])

  // Update analytics when tasks or projects change
  useEffect(() => {
    if (tasks.length > 0 || projects.length > 0) {
      console.log('Tasks or projects updated, recalculating analytics...')
    }
  }, [tasks, projects])

  // Real-time sync
  useRealTimeSync({
    userId: user.id,
    userRole: user.role as 'employee' | 'scrum_master',
    onTaskUpdate: (updatedTasks) => {
      console.log('Analytics: Tasks updated via real-time sync', updatedTasks.length)
      setTasks(updatedTasks)
      setLastUpdated(new Date())
    },
    onProjectUpdate: (updatedProjects) => {
      console.log('Analytics: Projects updated via real-time sync', updatedProjects.length)
      setProjects(updatedProjects)
      setLastUpdated(new Date())
    }
  })

  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError('')

      console.log('Fetching analytics data...', { selectedProject, timeRange, forceRefresh })

      const [tasksResponse, projectsResponse, analyticsResponse] = await Promise.all([
        taskService.getAllTasks(selectedProject || undefined),
        projectService.getAllProjects(),
        analyticsService.getDashboardAnalytics()
      ])

      setTasks(tasksResponse.data)
      setProjects(projectsResponse.data)
      setLastUpdated(new Date())

      // Store analytics data for use in calculations
      console.log('Analytics data loaded:', analyticsResponse.data)
      console.log('Tasks loaded:', tasksResponse.data.length)
      console.log('Projects loaded:', projectsResponse.data.length)
      console.log('Analytics last updated:', new Date().toLocaleTimeString())
    } catch (err: any) {
      console.error('Error fetching analytics data:', err)
      setError('Failed to load analytics data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForceRefresh = () => {
    console.log('Force refreshing analytics data...')
    fetchData(true)
  }

  const getAnalyticsData = (): AnalyticsData => {
    try {
      const filteredTasks = selectedProject
        ? tasks.filter(t => t.project === selectedProject)
        : tasks

      const totalTasks = filteredTasks.length
      const completedTasks = filteredTasks.filter(t => t.status === 'done').length
      const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress').length
      const overdueTasks = filteredTasks.filter(t => {
        if (!t.due_date || t.status === 'done') return false
        const dueDate = new Date(t.due_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Reset time to start of day
        return dueDate < today
      }).length
      const urgentTasks = filteredTasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length

      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      // Calculate average completion time
      const completedTasksWithTime = filteredTasks.filter(t => t.status === 'done')
      const averageCompletionTime = completedTasksWithTime.length > 0
        ? completedTasksWithTime.reduce((acc, task) => {
          const created = new Date(task.created_at)
          const completed = new Date(task.updated_at) // Assuming updated_at is when completed
          const days = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
          return acc + days
        }, 0) / completedTasksWithTime.length
        : 0

      // Calculate productivity score
      const productivityScore = totalTasks > 0
        ? Math.round((completedTasks * 0.4 + inProgressTasks * 0.3 + (totalTasks - overdueTasks) * 0.3) / totalTasks * 100)
        : 0

      // Task distribution
      const taskDistribution = {
        todo: filteredTasks.filter(t => t.status === 'todo').length,
        inProgress: filteredTasks.filter(t => t.status === 'in-progress').length,
        review: filteredTasks.filter(t => t.status === 'review').length,
        done: filteredTasks.filter(t => t.status === 'done').length
      }

      // Priority distribution
      const priorityDistribution = {
        low: filteredTasks.filter(t => t.priority === 'low').length,
        medium: filteredTasks.filter(t => t.priority === 'medium').length,
        high: filteredTasks.filter(t => t.priority === 'high').length,
        urgent: filteredTasks.filter(t => t.priority === 'urgent').length
      }

      // Project stats
      const projectStats = projects.map(project => {
        const projectTasks = filteredTasks.filter(t => t.project === project.id)
        const projectCompleted = projectTasks.filter(t => t.status === 'done').length
        return {
          id: project.id,
          name: project.name,
          totalTasks: projectTasks.length,
          completedTasks: projectCompleted,
          completionRate: projectTasks.length > 0 ? (projectCompleted / projectTasks.length) * 100 : 0
        }
      })

      // Weekly trends (mock data for demonstration)
      const weeklyTrends = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        return {
          date: date.toISOString().split('T')[0],
          completed: Math.floor(Math.random() * 10) + 1,
          created: Math.floor(Math.random() * 8) + 1
        }
      })

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        urgentTasks,
        completionRate: Math.round(completionRate),
        averageCompletionTime: Math.round(averageCompletionTime),
        productivityScore,
        teamPerformance: {
          totalUsers: projects.reduce((acc, p) => acc + (p.members?.length || 0), 0),
          activeUsers: projects.reduce((acc, p) => acc + (p.members?.length || 0), 0), // Simplified
          topPerformers: [] // Would be calculated from actual data
        },
        projectStats,
        taskDistribution,
        priorityDistribution,
        weeklyTrends
      }
    } catch (error) {
      console.error('Error calculating analytics data:', error)
      // Return default values on error
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
        urgentTasks: 0,
        completionRate: 0,
        averageCompletionTime: 0,
        productivityScore: 0,
        teamPerformance: {
          totalUsers: 0,
          activeUsers: 0,
          topPerformers: []
        },
        projectStats: [],
        taskDistribution: { todo: 0, inProgress: 0, review: 0, done: 0 },
        priorityDistribution: { low: 0, medium: 0, high: 0, urgent: 0 },
        weeklyTrends: []
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const analytics = getAnalyticsData()

  // Validate analytics data
  const isValidAnalytics = analytics &&
    typeof analytics.totalTasks === 'number' &&
    analytics.totalTasks >= 0

  // Debug information
  const debugInfo = {
    tasksCount: tasks.length,
    projectsCount: projects.length,
    selectedProject,
    timeRange,
    lastUpdated: lastUpdated.toISOString(),
    analyticsValid: isValidAnalytics,
    analyticsTotalTasks: analytics?.totalTasks || 0
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Analytics & Reports</h1>
              <p className="mt-2 text-lg text-gray-600">
                Comprehensive insights into your project performance
              </p>
            </div>
            <div className="flex space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <select
                value={selectedProject || ''}
                onChange={(e) => setSelectedProject(e.target.value ? parseInt(e.target.value) : null)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
              >
                {showDebug ? 'Hide Debug' : 'Show Debug'}
              </button>
              <button
                onClick={handleForceRefresh}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Data Summary */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Data Summary</h3>
                <p className="text-sm text-gray-600">
                  {tasks.length} tasks • {projects.length} projects • {selectedProject ? 'Filtered by project' : 'All projects'}
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  <div>Tasks by status: {JSON.stringify({
                    todo: tasks.filter(t => t.status === 'todo').length,
                    inProgress: tasks.filter(t => t.status === 'in-progress').length,
                    review: tasks.filter(t => t.status === 'review').length,
                    done: tasks.filter(t => t.status === 'done').length
                  })}</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Debug Panel */}
          {showDebug && (
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-800 mb-2">Debug Information</h4>
              <pre className="text-xs text-gray-600 overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}

          {!isValidAnalytics ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">No Analytics Data Available</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    {tasks.length === 0
                      ? "No tasks found. Create some tasks to see analytics."
                      : "Unable to load analytics data. Please try refreshing."
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.totalTasks}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Target className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.completionRate}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. Completion</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.averageCompletionTime}d</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Productivity</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.productivityScore}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts and Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Task Status Distribution */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Task Status Distribution</h3>
              <div className="space-y-4">
                {Object.entries(analytics.taskDistribution).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full mr-3 ${status === 'todo' ? 'bg-gray-400' :
                        status === 'inProgress' ? 'bg-blue-400' :
                          status === 'review' ? 'bg-yellow-400' : 'bg-green-400'
                        }`} />
                      <span className="font-medium text-gray-700 capitalize">
                        {status === 'inProgress' ? 'In Progress' : status}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-gray-900 mr-4">{count}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${status === 'todo' ? 'bg-gray-400' :
                            status === 'inProgress' ? 'bg-blue-400' :
                              status === 'review' ? 'bg-yellow-400' : 'bg-green-400'
                            }`}
                          style={{
                            width: `${analytics.totalTasks > 0 ? (count / analytics.totalTasks) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Priority Distribution</h3>
              <div className="space-y-4">
                {Object.entries(analytics.priorityDistribution).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full mr-3 ${priority === 'urgent' ? 'bg-red-400' :
                        priority === 'high' ? 'bg-orange-400' :
                          priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                        }`} />
                      <span className="font-medium text-gray-700 capitalize">{priority}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-gray-900 mr-4">{count}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${priority === 'urgent' ? 'bg-red-400' :
                            priority === 'high' ? 'bg-orange-400' :
                              priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                            }`}
                          style={{
                            width: `${analytics.totalTasks > 0 ? (count / analytics.totalTasks) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Project Performance */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Project Performance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tasks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.projectStats.map((project) => (
                    <tr key={project.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {project.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {project.totalTasks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {project.completedTasks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Math.round(project.completionRate)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${project.completionRate}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weekly Trends */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Weekly Trends</h3>
            <div className="grid grid-cols-7 gap-4">
              {analytics.weeklyTrends.map((day, index) => (
                <div key={index} className="text-center">
                  <div className="text-sm text-gray-600 mb-2">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </div>
                  <div className="space-y-2">
                    <div className="bg-green-100 rounded-lg p-2">
                      <div className="text-lg font-bold text-green-800">{day.completed}</div>
                      <div className="text-xs text-green-600">Completed</div>
                    </div>
                    <div className="bg-blue-100 rounded-lg p-2">
                      <div className="text-lg font-bold text-blue-800">{day.created}</div>
                      <div className="text-xs text-blue-600">Created</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics