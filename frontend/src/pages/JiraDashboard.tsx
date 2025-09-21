import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User } from '../types'
import JiraNavbar from '../components/JiraNavbar'
import {
    Search,
    Filter,
    Plus,
    Bell,
    Settings,
    User as UserIcon,
    BarChart3,
    Grid3X3,
    List,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle,
    Circle,
    Pause,
    Play
} from 'lucide-react'

interface JiraDashboardProps {
    user: User
    onIssueClick: (issue: any) => void
    onCreateIssue: () => void
}

const JiraDashboard: React.FC<JiraDashboardProps> = ({ user, onIssueClick, onCreateIssue }) => {
    const [viewMode, setViewMode] = useState<'board' | 'list' | 'timeline'>('board')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedProject, setSelectedProject] = useState('all')
    const [showFilters, setShowFilters] = useState(false)

    // Mock data for demonstration
    const projects = [
        { id: 1, name: 'TaskFlow Pro', key: 'TFP', color: 'blue' },
        { id: 2, name: 'Mobile App', key: 'MA', color: 'green' },
        { id: 3, name: 'API Development', key: 'API', color: 'purple' }
    ]

    const issues = [
        {
            id: 'TFP-1',
            title: 'Implement user authentication system',
            type: 'Story',
            priority: 'High',
            status: 'In Progress',
            assignee: { name: 'John Doe', avatar: null },
            reporter: { name: 'Jane Smith', avatar: null },
            created: '2024-01-15',
            updated: '2024-01-20',
            labels: ['backend', 'security'],
            storyPoints: 8
        },
        {
            id: 'TFP-2',
            title: 'Design responsive dashboard layout',
            type: 'Task',
            priority: 'Medium',
            status: 'To Do',
            assignee: { name: 'Alice Johnson', avatar: null },
            reporter: { name: 'Bob Wilson', avatar: null },
            created: '2024-01-16',
            updated: '2024-01-18',
            labels: ['frontend', 'ui'],
            storyPoints: 5
        },
        {
            id: 'TFP-3',
            title: 'Fix critical bug in payment processing',
            type: 'Bug',
            priority: 'Critical',
            status: 'Done',
            assignee: { name: 'Mike Brown', avatar: null },
            reporter: { name: 'Sarah Davis', avatar: null },
            created: '2024-01-10',
            updated: '2024-01-19',
            labels: ['bug', 'payment'],
            storyPoints: 3
        }
    ]

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Critical': return 'text-red-600 bg-red-100'
            case 'High': return 'text-orange-600 bg-orange-100'
            case 'Medium': return 'text-yellow-600 bg-yellow-100'
            case 'Low': return 'text-green-600 bg-green-100'
            default: return 'text-gray-600 bg-gray-100'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'To Do': return <Circle className="w-4 h-4 text-gray-400" />
            case 'In Progress': return <Play className="w-4 h-4 text-blue-500" />
            case 'Done': return <CheckCircle className="w-4 h-4 text-green-500" />
            case 'Blocked': return <Pause className="w-4 h-4 text-red-500" />
            default: return <Circle className="w-4 h-4 text-gray-400" />
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Story': return 'bg-blue-100 text-blue-800'
            case 'Task': return 'bg-green-100 text-green-800'
            case 'Bug': return 'bg-red-100 text-red-800'
            case 'Epic': return 'bg-purple-100 text-purple-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <JiraNavbar user={user} />

            {/* Project Selector and Controls */}
            <div className="bg-white border-b border-gray-200">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Project Selector */}
                        <div className="flex items-center space-x-4">
                            <select
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Projects</option>
                                {projects.map(project => (
                                    <option key={project.id} value={project.key}>
                                        {project.name} ({project.key})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* View Controls */}
                        <div className="flex items-center space-x-4">
                            {/* View Mode Toggle */}
                            <div className="flex bg-gray-100 rounded-md p-1">
                                <button
                                    onClick={() => setViewMode('board')}
                                    className={`p-2 rounded ${viewMode === 'board' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('timeline')}
                                    className={`p-2 rounded ${viewMode === 'timeline' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                                >
                                    <Calendar className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Filter Button */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                <Filter className="w-4 h-4" />
                                <span className="text-sm">Filters</span>
                            </button>

                            {/* Create Issue */}
                            <button
                                onClick={onCreateIssue}
                                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="text-sm">Create</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium text-gray-700">Status:</label>
                            <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                                <option>All</option>
                                <option>To Do</option>
                                <option>In Progress</option>
                                <option>Done</option>
                            </select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium text-gray-700">Priority:</label>
                            <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                                <option>All</option>
                                <option>Critical</option>
                                <option>High</option>
                                <option>Medium</option>
                                <option>Low</option>
                            </select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium text-gray-700">Assignee:</label>
                            <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                                <option>All</option>
                                <option>Unassigned</option>
                                <option>John Doe</option>
                                <option>Alice Johnson</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="p-6">
                {viewMode === 'board' ? (
                    /* Kanban Board View */
                    <div className="grid grid-cols-4 gap-6">
                        {['To Do', 'In Progress', 'Review', 'Done'].map(status => (
                            <div key={status} className="bg-white rounded-lg border border-gray-200">
                                <div className="p-4 border-b border-gray-200">
                                    <h3 className="font-semibold text-gray-900">{status}</h3>
                                    <span className="text-sm text-gray-500">
                                        {issues.filter(issue => issue.status === status).length} issues
                                    </span>
                                </div>
                                <div className="p-4 space-y-3">
                                    {issues
                                        .filter(issue => issue.status === status)
                                        .map(issue => (
                                            <div
                                                key={issue.id}
                                                onClick={() => onIssueClick(issue)}
                                                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(issue.type)}`}>
                                                            {issue.type}
                                                        </span>
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                                                            {issue.priority}
                                                        </span>
                                                    </div>
                                                    {getStatusIcon(issue.status)}
                                                </div>
                                                <h4 className="font-medium text-gray-900 mb-2">{issue.title}</h4>
                                                <div className="flex items-center justify-between text-sm text-gray-500">
                                                    <span>{issue.id}</span>
                                                    {issue.storyPoints && (
                                                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                                            {issue.storyPoints} pts
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between mt-3">
                                                    <div className="flex items-center space-x-1">
                                                        {issue.labels.map(label => (
                                                            <span key={label} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                                                {label}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                                        <span className="text-xs font-medium">
                                                            {issue.assignee.name.split(' ').map(n => n[0]).join('')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : viewMode === 'list' ? (
                    /* List View */
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Issues</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Issue
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Priority
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Assignee
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {issues.map(issue => (
                                        <tr key={issue.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onIssueClick(issue)}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{issue.id}</div>
                                                    <div className="text-sm text-gray-500">{issue.title}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(issue.type)}`}>
                                                    {issue.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                                                    {issue.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    {getStatusIcon(issue.status)}
                                                    <span className="text-sm text-gray-900">{issue.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                                        <span className="text-xs font-medium">
                                                            {issue.assignee.name.split(' ').map(n => n[0]).join('')}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm text-gray-900">{issue.assignee.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {issue.created}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* Timeline View */
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline View</h3>
                        <p className="text-gray-500">Timeline view coming soon...</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default JiraDashboard
