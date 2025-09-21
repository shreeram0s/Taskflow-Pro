import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { User } from '../types'
import {
    Plus,
    Search,
    Filter,
    Grid3X3,
    List,
    Settings,
    Users,
    Calendar,
    BarChart3,
    Star,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2
} from 'lucide-react'

interface JiraProjectsProps {
    user: User
}

const JiraProjects: React.FC<JiraProjectsProps> = ({ user }) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [searchQuery, setSearchQuery] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    const projects = [
        {
            id: 1,
            key: 'TFP',
            name: 'TaskFlow Pro',
            description: 'A comprehensive task management and project tracking application',
            avatar: 'TFP',
            color: 'blue',
            lead: { name: 'John Doe', avatar: null },
            category: 'Software',
            issueCount: 24,
            lastActivity: '2 hours ago',
            isFavorite: true,
            status: 'Active',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            team: [
                { name: 'John Doe', role: 'Project Lead' },
                { name: 'Alice Johnson', role: 'Developer' },
                { name: 'Mike Brown', role: 'Designer' }
            ]
        },
        {
            id: 2,
            key: 'MA',
            name: 'Mobile App',
            description: 'Cross-platform mobile application for task management',
            avatar: 'MA',
            color: 'green',
            lead: { name: 'Alice Johnson', avatar: null },
            category: 'Mobile',
            issueCount: 18,
            lastActivity: '1 day ago',
            isFavorite: false,
            status: 'Active',
            startDate: '2024-02-01',
            endDate: '2024-11-30',
            team: [
                { name: 'Alice Johnson', role: 'Project Lead' },
                { name: 'Sarah Davis', role: 'Developer' },
                { name: 'Bob Wilson', role: 'QA' }
            ]
        },
        {
            id: 3,
            key: 'API',
            name: 'API Development',
            description: 'RESTful API development and documentation',
            avatar: 'API',
            color: 'purple',
            lead: { name: 'Mike Brown', avatar: null },
            category: 'Backend',
            issueCount: 12,
            lastActivity: '3 days ago',
            isFavorite: true,
            status: 'Planning',
            startDate: '2024-03-01',
            endDate: '2024-10-31',
            team: [
                { name: 'Mike Brown', role: 'Project Lead' },
                { name: 'John Doe', role: 'Developer' },
                { name: 'Alice Johnson', role: 'DevOps' }
            ]
        },
        {
            id: 4,
            key: 'DOC',
            name: 'Documentation',
            description: 'Technical documentation and user guides',
            avatar: 'DOC',
            color: 'orange',
            lead: { name: 'Sarah Davis', avatar: null },
            category: 'Documentation',
            issueCount: 8,
            lastActivity: '1 week ago',
            isFavorite: false,
            status: 'On Hold',
            startDate: '2024-01-15',
            endDate: '2024-09-30',
            team: [
                { name: 'Sarah Davis', role: 'Project Lead' },
                { name: 'Bob Wilson', role: 'Technical Writer' }
            ]
        }
    ]

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'text-green-600 bg-green-100'
            case 'Planning': return 'text-blue-600 bg-blue-100'
            case 'On Hold': return 'text-yellow-600 bg-yellow-100'
            case 'Completed': return 'text-gray-600 bg-gray-100'
            default: return 'text-gray-600 bg-gray-100'
        }
    }

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Software': return 'bg-blue-100 text-blue-800'
            case 'Mobile': return 'bg-green-100 text-green-800'
            case 'Backend': return 'bg-purple-100 text-purple-800'
            case 'Documentation': return 'bg-orange-100 text-orange-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                            <p className="text-gray-600">Manage and track your projects</p>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search projects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* View Mode Toggle */}
                            <div className="flex bg-gray-100 rounded-md p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                                >
                                    <List className="w-4 h-4" />
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

                            {/* Create Project */}
                            <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                                <Plus className="w-4 h-4" />
                                <span className="text-sm">Create Project</span>
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
                                <option>Active</option>
                                <option>Planning</option>
                                <option>On Hold</option>
                                <option>Completed</option>
                            </select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium text-gray-700">Category:</label>
                            <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                                <option>All</option>
                                <option>Software</option>
                                <option>Mobile</option>
                                <option>Backend</option>
                                <option>Documentation</option>
                            </select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium text-gray-700">Lead:</label>
                            <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                                <option>All</option>
                                <option>John Doe</option>
                                <option>Alice Johnson</option>
                                <option>Mike Brown</option>
                                <option>Sarah Davis</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="p-6">
                {viewMode === 'grid' ? (
                    /* Grid View */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map(project => (
                            <div key={project.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                                <div className="p-6">
                                    {/* Project Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-12 h-12 bg-${project.color}-500 rounded-lg flex items-center justify-center text-white font-bold`}>
                                                {project.avatar}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                                                <p className="text-sm text-gray-500">{project.key}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <button className="p-1 text-gray-400 hover:text-yellow-500">
                                                <Star className={`w-4 h-4 ${project.isFavorite ? 'fill-current text-yellow-500' : ''}`} />
                                            </button>
                                            <button className="p-1 text-gray-400 hover:text-gray-600">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Project Description */}
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>

                                    {/* Project Meta */}
                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Status</span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                                                {project.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Category</span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(project.category)}`}>
                                                {project.category}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Issues</span>
                                            <span className="text-sm font-medium text-gray-900">{project.issueCount}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Lead</span>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                                    <span className="text-xs font-medium">
                                                        {project.lead.name.split(' ').map(n => n[0]).join('')}
                                                    </span>
                                                </div>
                                                <span className="text-sm text-gray-900">{project.lead.name}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Team */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">Team</span>
                                            <span className="text-sm text-gray-500">{project.team.length} members</span>
                                        </div>
                                        <div className="flex -space-x-2">
                                            {project.team.slice(0, 3).map((member, index) => (
                                                <div key={index} className="w-8 h-8 bg-gray-300 rounded-full border-2 border-white flex items-center justify-center">
                                                    <span className="text-xs font-medium">
                                                        {member.name.split(' ').map(n => n[0]).join('')}
                                                    </span>
                                                </div>
                                            ))}
                                            {project.team.length > 3 && (
                                                <div className="w-8 h-8 bg-gray-100 rounded-full border-2 border-white flex items-center justify-center">
                                                    <span className="text-xs font-medium text-gray-600">+{project.team.length - 3}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                        <span className="text-xs text-gray-500">Last activity: {project.lastActivity}</span>
                                        <div className="flex items-center space-x-2">
                                            <button className="p-2 text-gray-400 hover:text-gray-600">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-gray-600">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-red-600">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* List View */
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Project
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Lead
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Issues
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Team
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Last Activity
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredProjects.map(project => (
                                        <tr key={project.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-10 h-10 bg-${project.color}-500 rounded-lg flex items-center justify-center text-white font-bold`}>
                                                        {project.avatar}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{project.name}</div>
                                                        <div className="text-sm text-gray-500">{project.key}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                                        <span className="text-xs font-medium">
                                                            {project.lead.name.split(' ').map(n => n[0]).join('')}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm text-gray-900">{project.lead.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                                                    {project.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {project.issueCount}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex -space-x-2">
                                                    {project.team.slice(0, 3).map((member, index) => (
                                                        <div key={index} className="w-6 h-6 bg-gray-300 rounded-full border-2 border-white flex items-center justify-center">
                                                            <span className="text-xs font-medium">
                                                                {member.name.split(' ').map(n => n[0]).join('')}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {project.team.length > 3 && (
                                                        <div className="w-6 h-6 bg-gray-100 rounded-full border-2 border-white flex items-center justify-center">
                                                            <span className="text-xs font-medium text-gray-600">+{project.team.length - 3}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {project.lastActivity}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <button className="text-blue-600 hover:text-blue-900">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button className="text-gray-600 hover:text-gray-900">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button className="text-red-600 hover:text-red-900">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default JiraProjects
