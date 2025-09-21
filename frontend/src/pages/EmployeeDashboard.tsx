import React, { useState, useEffect } from 'react'
import { User, Task, Project } from '../types'
import { taskService, projectService } from '../services/api'
import NotificationSystem from '../components/NotificationSystem'
import KanbanBoard from '../components/KanbanBoard'
import { useRealTimeSync } from '../hooks/useRealTimeSync'
import {
    CheckSquare,
    Calendar,
    Clock,
    AlertCircle,
    Search,
    BarChart3,
    Target,
    Activity,
    Eye,
    PlayCircle,
    CheckCircle,
    List,
    Kanban
} from 'lucide-react'

interface EmployeeDashboardProps {
    user: User
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ user }) => {
    const [tasks, setTasks] = useState<Task[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'review' | 'done'>('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [viewMode, setViewMode] = useState<'dashboard' | 'kanban' | 'list'>('dashboard')
    const [selectedProject, setSelectedProject] = useState<number | null>(null)
    const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all')
    const [sortBy, setSortBy] = useState<'created' | 'due_date' | 'priority' | 'status'>('due_date')

    useEffect(() => {
        fetchData()
    }, [])

    // Real-time sync
    useRealTimeSync({
        userId: user.id,
        userRole: user.role as 'employee' | 'scrum_master',
        onTaskUpdate: (updatedTasks) => {
            setTasks(updatedTasks)
        },
        onProjectUpdate: (updatedProjects) => {
            setProjects(updatedProjects)
        }
    })

    const fetchData = async () => {
        try {
            setLoading(true)
            setError('')

            const [tasksResponse, projectsResponse] = await Promise.all([
                taskService.getAllTasks(selectedProject || undefined),
                projectService.getAllProjects()
            ])

            setTasks(tasksResponse.data)
            setProjects(projectsResponse.data)
        } catch (err: any) {
            console.error('Error fetching data:', err)
            setError('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    // Get user's assigned tasks
    const getUserTasks = () => {
        return tasks.filter(task => task.assignee && task.assignee.id === user.id)
    }

    // Get filtered and sorted tasks
    const getFilteredTasks = () => {
        let filtered = getUserTasks()

        // Filter by status
        if (filter !== 'all') {
            filtered = filtered.filter(t => t.status === filter)
        }

        // Filter by priority
        if (priorityFilter !== 'all') {
            filtered = filtered.filter(t => t.priority === priorityFilter)
        }

        // Filter by project
        if (selectedProject) {
            filtered = filtered.filter(t => t.project === selectedProject)
        }

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.description.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Sort tasks
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'due_date':
                    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
                case 'priority':
                    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
                    return priorityOrder[b.priority] - priorityOrder[a.priority]
                case 'status':
                    const statusOrder = { todo: 1, 'in-progress': 2, review: 3, done: 4 }
                    return statusOrder[a.status] - statusOrder[b.status]
                default:
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            }
        })

        return filtered
    }

    // Get dashboard statistics
    const getDashboardStats = () => {
        const userTasks = getUserTasks()
        const totalTasks = userTasks.length
        const completedTasks = userTasks.filter(t => t.status === 'done').length
        const inProgressTasks = userTasks.filter(t => t.status === 'in-progress').length
        const overdueTasks = userTasks.filter(t =>
            t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
        ).length
        const urgentTasks = userTasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length

        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
        const productivityScore = totalTasks > 0 ?
            Math.round((completedTasks * 0.4 + inProgressTasks * 0.3 + (totalTasks - overdueTasks) * 0.3) / totalTasks * 100) : 0

        return {
            totalTasks,
            completedTasks,
            inProgressTasks,
            overdueTasks,
            urgentTasks,
            completionRate: Math.round(completionRate),
            productivityScore
        }
    }

    const getStatusColor = (status: Task['status']) => {
        switch (status) {
            case 'done':
                return 'bg-green-100 text-green-800'
            case 'in-progress':
                return 'bg-blue-100 text-blue-800'
            case 'review':
                return 'bg-yellow-100 text-yellow-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getPriorityColor = (priority: Task['priority']) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-100 text-red-800'
            case 'high':
                return 'bg-orange-100 text-orange-800'
            case 'medium':
                return 'bg-yellow-100 text-yellow-800'
            default:
                return 'bg-green-100 text-green-800'
        }
    }

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return '🔴'
            case 'high':
                return '🟠'
            case 'medium':
                return '🟡'
            default:
                return '🟢'
        }
    }

    const handleTaskStatusChange = async (taskId: number, newStatus: Task['status']) => {
        try {
            await taskService.changeStatus(taskId, newStatus)
            // Real-time sync will handle the update
        } catch (err) {
            console.error('Error updating task status:', err)
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

    const stats = getDashboardStats()
    const filteredTasks = getFilteredTasks()

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Modern Header */}
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900">My Workspace</h1>
                            <p className="mt-2 text-lg text-gray-600">
                                Welcome back, {user.first_name || user.username}! Here's your task overview.
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setViewMode('dashboard')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${viewMode === 'dashboard'
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <BarChart3 className="w-5 h-5 mr-2 inline" />
                                Dashboard
                            </button>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${viewMode === 'kanban'
                                    ? 'bg-green-600 text-white shadow-lg'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <Kanban className="w-5 h-5 mr-2 inline" />
                                Kanban
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${viewMode === 'list'
                                    ? 'bg-purple-600 text-white shadow-lg'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <List className="w-5 h-5 mr-2 inline" />
                                List
                            </button>
                        </div>
                    </div>
                </div>

                {/* Kanban Board View */}
                {viewMode === 'kanban' && (
                    <KanbanBoard user={user} projectId={selectedProject || undefined} />
                )}

                {/* Dashboard and List Views */}
                {viewMode !== 'kanban' && (
                    <div className="px-4 py-6 sm:px-0">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                                <div className="flex items-center">
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <CheckSquare className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                                <div className="flex items-center">
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <Target className="h-8 w-8 text-green-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Completed</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.completedTasks}</p>
                                        <p className="text-sm text-green-600">{stats.completionRate}% completion rate</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                                <div className="flex items-center">
                                    <div className="p-3 bg-yellow-100 rounded-lg">
                                        <Activity className="h-8 w-8 text-yellow-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">In Progress</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.inProgressTasks}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                                <div className="flex items-center">
                                    <div className="p-3 bg-red-100 rounded-lg">
                                        <AlertCircle className="h-8 w-8 text-red-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Overdue</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.overdueTasks}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filters and Search */}
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex-1 min-w-64">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Search tasks..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value as any)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="all">All Status</option>
                                    <option value="todo">To Do</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="review">Review</option>
                                    <option value="done">Done</option>
                                </select>

                                <select
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value as any)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="all">All Priority</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
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

                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="due_date">Sort by Due Date</option>
                                    <option value="priority">Sort by Priority</option>
                                    <option value="status">Sort by Status</option>
                                    <option value="created">Sort by Created</option>
                                </select>
                            </div>
                        </div>

                        {/* Tasks List */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-xl font-bold text-gray-900">My Tasks ({filteredTasks.length})</h3>
                            </div>

                            {viewMode === 'dashboard' ? (
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredTasks.map((task) => (
                                            <div key={task.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex-1">
                                                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h4>
                                                        <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-2xl">{getPriorityIcon(task.priority)}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mb-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                                        {task.status}
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                        {task.priority}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                                    <div className="flex items-center">
                                                        <Calendar className="w-4 h-4 mr-1" />
                                                        {new Date(task.due_date).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Clock className="w-4 h-4 mr-1" />
                                                        {new Date(task.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>

                                                <div className="flex space-x-2">
                                                    {task.status === 'todo' && (
                                                        <button
                                                            onClick={() => handleTaskStatusChange(task.id, 'in-progress')}
                                                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                                                        >
                                                            <PlayCircle className="w-4 h-4 mr-1" />
                                                            Start
                                                        </button>
                                                    )}
                                                    {task.status === 'in-progress' && (
                                                        <button
                                                            onClick={() => handleTaskStatusChange(task.id, 'review')}
                                                            className="flex-1 bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors flex items-center justify-center"
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            Review
                                                        </button>
                                                    )}
                                                    {task.status === 'review' && (
                                                        <button
                                                            onClick={() => handleTaskStatusChange(task.id, 'done')}
                                                            className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-1" />
                                                            Complete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredTasks.map((task) => (
                                                <tr key={task.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{task.title}</div>
                                                            <div className="text-sm text-gray-500">{task.description}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                                                            {task.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <span className="text-lg mr-2">{getPriorityIcon(task.priority)}</span>
                                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                                                                {task.priority}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {new Date(task.due_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-2">
                                                            {task.status === 'todo' && (
                                                                <button
                                                                    onClick={() => handleTaskStatusChange(task.id, 'in-progress')}
                                                                    className="text-blue-600 hover:text-blue-900"
                                                                    title="Start Task"
                                                                >
                                                                    <PlayCircle className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            {task.status === 'in-progress' && (
                                                                <button
                                                                    onClick={() => handleTaskStatusChange(task.id, 'review')}
                                                                    className="text-yellow-600 hover:text-yellow-900"
                                                                    title="Mark for Review"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            {task.status === 'review' && (
                                                                <button
                                                                    onClick={() => handleTaskStatusChange(task.id, 'done')}
                                                                    className="text-green-600 hover:text-green-900"
                                                                    title="Complete Task"
                                                                >
                                                                    <CheckCircle className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {filteredTasks.length === 0 && (
                                <div className="text-center py-12">
                                    <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                                    <p className="text-gray-500">Try adjusting your filters or check back later for new assignments.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <NotificationSystem />
        </div>
    )
}

export default EmployeeDashboard