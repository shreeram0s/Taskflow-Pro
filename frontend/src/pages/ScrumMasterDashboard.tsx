import React, { useState, useEffect } from 'react'
import { User, Task, Project } from '../types'
import { taskService, projectService, userService } from '../services/api'
import NotificationSystem from '../components/NotificationSystem'
import TaskFormModal from '../components/TaskFormModal'
import CreateProjectModal from '../components/CreateProjectModal'
import { useRealTimeSync } from '../hooks/useRealTimeSync'
import {
    Users,
    CheckSquare,
    FolderOpen,
    Plus,
    Search,
    Filter,
    Calendar,
    Clock,
    AlertCircle,
    TrendingUp,
    UserPlus,
    Settings,
    BarChart3,
    Target,
    Zap,
    Star,
    Activity,
    Eye,
    Edit3,
    Trash2,
    MoreVertical,
    Bell,
    RefreshCw
} from 'lucide-react'

interface ScrumMasterDashboardProps {
    user: User
}

interface UserStats {
    totalUsers: number
    activeUsers: number
    scrumMasters: number
    employees: number
}

const ScrumMasterDashboard: React.FC<ScrumMasterDashboardProps> = ({ user }) => {
    const [users, setUsers] = useState<User[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'tasks' | 'team' | 'analytics'>('overview')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedProject, setSelectedProject] = useState<number | null>(null)
    const [showTaskModal, setShowTaskModal] = useState(false)
    const [showProjectModal, setShowProjectModal] = useState(false)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'in-progress' | 'review' | 'done'>('all')
    const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all')
    const [sortBy, setSortBy] = useState<'created' | 'due_date' | 'priority' | 'status'>('created')
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('grid')

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

            const [tasksResponse, projectsResponse, usersResponse] = await Promise.all([
                taskService.getAllTasks(selectedProject || undefined),
                projectService.getAllProjects(),
                userService.getAllUsers()
            ])

            setTasks(tasksResponse.data)
            setProjects(projectsResponse.data)
            setUsers(usersResponse.data)
        } catch (err: any) {
            console.error('Error fetching data:', err)
            setError('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    // Advanced analytics and statistics
    const getDashboardStats = () => {
        const totalTasks = tasks.length
        const completedTasks = tasks.filter(t => t.status === 'done').length
        const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length
        const overdueTasks = tasks.filter(t => 
            t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
        ).length
        const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length
        
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
        const avgTaskCompletion = tasks.length > 0 ? 
            tasks.reduce((acc, task) => {
                const daysDiff = task.due_date ? 
                    Math.ceil((new Date(task.due_date).getTime() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0
                return acc + daysDiff
            }, 0) / tasks.length : 0

        return {
            totalTasks,
            completedTasks,
            inProgressTasks,
            overdueTasks,
            urgentTasks,
            completionRate: Math.round(completionRate),
            avgTaskCompletion: Math.round(avgTaskCompletion),
            totalProjects: projects.length,
            activeProjects: projects.filter(p => p.status === 'active').length,
        totalUsers: users.length,
            activeUsers: users.filter(u => u.is_active).length
        }
    }

    const getTaskDistribution = () => {
        return {
            todo: tasks.filter(t => t.status === 'todo').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
            review: tasks.filter(t => t.status === 'review').length,
            done: tasks.filter(t => t.status === 'done').length
        }
    }

    const getPriorityDistribution = () => {
        return {
            low: tasks.filter(t => t.priority === 'low').length,
            medium: tasks.filter(t => t.priority === 'medium').length,
            high: tasks.filter(t => t.priority === 'high').length,
            urgent: tasks.filter(t => t.priority === 'urgent').length
        }
    }

    const getFilteredTasks = () => {
        let filtered = tasks

        // Filter by project
        if (selectedProject) {
            filtered = filtered.filter(t => t.project === selectedProject)
        }

        // Filter by status
        if (filterStatus !== 'all') {
            filtered = filtered.filter(t => t.status === filterStatus)
        }

        // Filter by priority
        if (filterPriority !== 'all') {
            filtered = filtered.filter(t => t.priority === filterPriority)
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
    const taskDistribution = getTaskDistribution()
    const priorityDistribution = getPriorityDistribution()
    const filteredTasks = getFilteredTasks()

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Modern Header */}
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900">Project Command Center</h1>
                            <p className="mt-2 text-lg text-gray-600">
                                Welcome back, {user.first_name || user.username}! Here's your project overview.
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowProjectModal(true)}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                New Project
                            </button>
                            <button
                                onClick={() => setShowTaskModal(true)}
                                className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
                            >
                                <CheckSquare className="w-5 h-5 mr-2" />
                                New Task
                            </button>
                        </div>
                    </div>
                </div>

                {/* Modern Navigation */}
                <div className="px-4 sm:px-0 mb-8">
                    <div className="bg-white rounded-xl shadow-lg p-1">
                        <nav className="flex space-x-1">
                            {[
                                { id: 'overview', name: 'Overview', icon: BarChart3, color: 'from-blue-500 to-cyan-500' },
                                { id: 'projects', name: 'Projects', icon: FolderOpen, color: 'from-purple-500 to-pink-500' },
                                { id: 'tasks', name: 'Tasks', icon: CheckSquare, color: 'from-green-500 to-emerald-500' },
                                { id: 'team', name: 'Team', icon: Users, color: 'from-orange-500 to-red-500' },
                                { id: 'analytics', name: 'Analytics', icon: TrendingUp, color: 'from-indigo-500 to-purple-500' }
                            ].map((tab) => {
                                const Icon = tab.icon
                                return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                        className={`${
                                            activeTab === tab.id
                                                ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                        } flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all duration-200`}
                                    >
                                        <Icon className="w-5 h-5 mr-2" />
                                    {tab.name}
                                </button>
                                )
                            })}
                        </nav>
                    </div>
                </div>

                {/* Content */}
                <div className="px-4 py-6 sm:px-0">
                {activeTab === 'overview' && (
                        <div className="space-y-8">
                            {/* Key Metrics Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                            {/* Task Distribution Chart */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6">Task Status Distribution</h3>
                                    <div className="space-y-4">
                                        {Object.entries(taskDistribution).map(([status, count]) => (
                                            <div key={status} className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className={`w-4 h-4 rounded-full mr-3 ${
                                                        status === 'todo' ? 'bg-gray-400' :
                                                        status === 'inProgress' ? 'bg-blue-400' :
                                                        status === 'review' ? 'bg-yellow-400' : 'bg-green-400'
                                                    }`} />
                                                    <span className="font-medium text-gray-700 capitalize">
                                                        {status === 'inProgress' ? 'In Progress' : status}
                                                    </span>
                                                </div>
                                                <span className="text-2xl font-bold text-gray-900">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6">Priority Distribution</h3>
                                    <div className="space-y-4">
                                        {Object.entries(priorityDistribution).map(([priority, count]) => (
                                            <div key={priority} className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className={`w-4 h-4 rounded-full mr-3 ${
                                                        priority === 'urgent' ? 'bg-red-400' :
                                                        priority === 'high' ? 'bg-orange-400' :
                                                        priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                                                    }`} />
                                                    <span className="font-medium text-gray-700 capitalize">{priority}</span>
                                                </div>
                                                <span className="text-2xl font-bold text-gray-900">{count}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>

                            {/* Recent Tasks */}
                            <div className="bg-white rounded-xl shadow-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold text-gray-900">Recent Tasks</h3>
                                        <button
                                            onClick={() => setActiveTab('tasks')}
                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            View All
                                        </button>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        {filteredTasks.slice(0, 5).map((task) => (
                                            <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center">
                                                    <div className="p-2 bg-white rounded-lg mr-4">
                                                        <CheckSquare className="h-5 w-5 text-gray-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">{task.title}</h4>
                                                        <p className="text-sm text-gray-600">{task.description}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                                        {task.status}
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                        {task.priority}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                    {activeTab === 'projects' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-3xl font-bold text-gray-900">Projects</h2>
                                <button
                                    onClick={() => setShowProjectModal(true)}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    New Project
                                    </button>
                                </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {projects.map((project) => (
                                    <div key={project.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center">
                                                <div className="p-3 bg-purple-100 rounded-lg mr-4">
                                                    <FolderOpen className="h-8 w-8 text-purple-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900">{project.name}</h3>
                                                    <p className="text-gray-600">{project.description}</p>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                project.status === 'active' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {project.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm text-gray-500">
                                            <span>Tasks: {tasks.filter(t => t.project === project.id).length}</span>
                                            <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-3xl font-bold text-gray-900">Task Management</h2>
                                <div className="flex space-x-3">
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value as any)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="todo">To Do</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="review">Review</option>
                                        <option value="done">Done</option>
                                    </select>
                                    <select
                                        value={filterPriority}
                                        onChange={(e) => setFilterPriority(e.target.value as any)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="all">All Priority</option>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                    <button
                                        onClick={() => setShowTaskModal(true)}
                                        className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        New Task
                                    </button>
                                    </div>
                                </div>

                            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
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
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                                                            {task.priority}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {task.assignee ? `${task.assignee.first_name} ${task.assignee.last_name}` : 'Unassigned'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {new Date(task.due_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button
                                                            onClick={() => setSelectedTask(task)}
                                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button className="text-green-600 hover:text-green-900 mr-3">
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button className="text-red-600 hover:text-red-900">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                            </div>
                        </div>
                    </div>
                )}

                    {activeTab === 'team' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-3xl font-bold text-gray-900">Team Members</h2>
                                <button className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center">
                                    <UserPlus className="w-5 h-5 mr-2" />
                                    Add Member
                                        </button>
                                </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {users.map((user) => (
                                    <div key={user.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                                        <div className="flex items-center">
                                            <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                                {user.first_name?.[0] || user.username[0]}
                                    </div>
                                            <div className="ml-4 flex-1">
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    {user.first_name && user.last_name
                                                        ? `${user.first_name} ${user.last_name}`
                                                        : user.username
                                                    }
                                                </h3>
                                                <p className="text-gray-600">{user.email}</p>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    user.role === 'scrum_master' 
                                                        ? 'bg-purple-100 text-purple-800' 
                                                        : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {user.role === 'scrum_master' ? 'Scrum Master' : 'Employee'}
                                                        </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                        </div>
                    </div>
                )}

                    {activeTab === 'analytics' && (
                        <div className="space-y-6">
                            <h2 className="text-3xl font-bold text-gray-900">Analytics & Reports</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6">Performance Metrics</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Completion Rate</span>
                                            <span className="text-2xl font-bold text-green-600">{stats.completionRate}%</span>
                                </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Average Task Duration</span>
                                            <span className="text-2xl font-bold text-blue-600">{stats.avgTaskCompletion} days</span>
                                            </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Active Projects</span>
                                            <span className="text-2xl font-bold text-purple-600">{stats.activeProjects}</span>
                                                </div>
                                                </div>
                                            </div>

                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6">Team Performance</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Total Team Members</span>
                                            <span className="text-2xl font-bold text-indigo-600">{stats.totalUsers}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Active Members</span>
                                            <span className="text-2xl font-bold text-green-600">{stats.activeUsers}</span>
                                            </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Urgent Tasks</span>
                                            <span className="text-2xl font-bold text-red-600">{stats.urgentTasks}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    </div>
            </div>

            {/* Modals */}
            {showTaskModal && (
                <TaskFormModal
                    projectId={selectedProject || undefined}
                    onClose={() => setShowTaskModal(false)}
                    onSuccess={() => {
                        setShowTaskModal(false)
                        fetchData()
                    }}
                    user={user}
                />
            )}

            {showProjectModal && (
                <CreateProjectModal
                    onClose={() => setShowProjectModal(false)}
                    onSuccess={() => {
                        setShowProjectModal(false)
                        fetchData()
                    }}
                />
            )}

            <NotificationSystem />
        </div>
    )
}

export default ScrumMasterDashboard