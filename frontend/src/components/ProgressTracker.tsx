import React, { useState, useEffect } from 'react'
import { User, Task, Project } from '../types'
import { taskService, projectService } from '../services/api'
import { CheckCircle, Clock, AlertCircle, TrendingUp, Target, Calendar } from 'lucide-react'

interface ProgressTrackerProps {
    user: User
}

interface ProgressData {
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    overdueTasks: number
    completionRate: number
    recentActivity: Array<{
        id: number
        action: string
        taskTitle: string
        timestamp: string
    }>
    projectProgress: Array<{
        id: number
        name: string
        totalTasks: number
        completedTasks: number
        progress: number
    }>
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ user }) => {
    const [progressData, setProgressData] = useState<ProgressData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedProject, setSelectedProject] = useState<number | null>(null)

    useEffect(() => {
        fetchProgressData()
    }, [selectedProject])

    const fetchProgressData = async () => {
        try {
            setLoading(true)
            setError('')

            // Fetch user's tasks
            const tasksResponse = await taskService.getAllTasks(selectedProject || undefined)
            const tasks = tasksResponse.data

            // Filter tasks assigned to this user
            const userTasks = tasks.filter(task => task.assignee?.id === user.id)

            // Calculate progress metrics
            const totalTasks = userTasks.length
            const completedTasks = userTasks.filter(task => task.status === 'done').length
            const inProgressTasks = userTasks.filter(task => task.status === 'in-progress').length
            const overdueTasks = userTasks.filter(task =>
                task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
            ).length

            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

            // Get recent activity (simplified - in real app, this would come from analytics)
            const recentActivity = userTasks
                .filter(task => task.status === 'done')
                .slice(0, 5)
                .map(task => ({
                    id: task.id,
                    action: 'completed',
                    taskTitle: task.title,
                    timestamp: task.updated_at || task.created_at
                }))

            // Get project progress
            const projectsResponse = await projectService.getAllProjects()
            const projects = projectsResponse.data

            const projectProgress = projects.map(project => {
                const projectTasks = userTasks.filter(task => task.project?.id === project.id)
                const projectCompletedTasks = projectTasks.filter(task => task.status === 'done').length

                return {
                    id: project.id,
                    name: project.name,
                    totalTasks: projectTasks.length,
                    completedTasks: projectCompletedTasks,
                    progress: projectTasks.length > 0 ? Math.round((projectCompletedTasks / projectTasks.length) * 100) : 0
                }
            }).filter(project => project.totalTasks > 0)

            setProgressData({
                totalTasks,
                completedTasks,
                inProgressTasks,
                overdueTasks,
                completionRate,
                recentActivity,
                projectProgress
            })
        } catch (err: any) {
            console.error('Error fetching progress data:', err)
            setError('Failed to load progress data')
        } finally {
            setLoading(false)
        }
    }

    const updateTaskProgress = async (taskId: number, newStatus: Task['status']) => {
        try {
            await taskService.changeStatus(taskId, newStatus)
            await fetchProgressData() // Refresh data
        } catch (err) {
            console.error('Error updating task status:', err)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{error}</p>
                <button
                    onClick={fetchProgressData}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                    Try Again
                </button>
            </div>
        )
    }

    if (!progressData) return null

    return (
        <div className="space-y-6">
            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Target className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                            <p className="text-2xl font-bold text-gray-900">{progressData.totalTasks}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Completed</p>
                            <p className="text-2xl font-bold text-gray-900">{progressData.completedTasks}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Clock className="h-8 w-8 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">In Progress</p>
                            <p className="text-2xl font-bold text-gray-900">{progressData.inProgressTasks}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <TrendingUp className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                            <p className="text-2xl font-bold text-gray-900">{progressData.completionRate}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Progress */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Project Progress</h3>
                <div className="space-y-4">
                    {progressData.projectProgress.map((project) => (
                        <div key={project.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium text-gray-900">{project.name}</h4>
                                <span className="text-sm text-gray-500">
                                    {project.completedTasks}/{project.totalTasks} tasks
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${project.progress}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-sm text-gray-500">
                                    {project.progress}% complete
                                </span>
                                <button
                                    onClick={() => setSelectedProject(project.id)}
                                    className="text-sm text-primary hover:text-primary/80"
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                    {progressData.projectProgress.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No project assignments yet</p>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                    {progressData.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900">
                                    Completed task: <span className="font-medium">{activity.taskTitle}</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                    {new Date(activity.timestamp).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))}
                    {progressData.recentActivity.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                    )}
                </div>
            </div>

            {/* Overdue Tasks Alert */}
            {progressData.overdueTasks > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                        <div>
                            <h4 className="text-sm font-medium text-red-800">
                                {progressData.overdueTasks} overdue task{progressData.overdueTasks > 1 ? 's' : ''}
                            </h4>
                            <p className="text-sm text-red-600">
                                Please review and update your overdue tasks.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProgressTracker
