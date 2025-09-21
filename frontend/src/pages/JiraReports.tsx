import React, { useState } from 'react'
import { User } from '../types'
import {
    BarChart3,
    TrendingUp,
    Users,
    Clock,
    CheckCircle,
    AlertCircle,
    Calendar,
    Filter,
    Download,
    RefreshCw
} from 'lucide-react'

interface JiraReportsProps {
    user: User
}

const JiraReports: React.FC<JiraReportsProps> = ({ user }) => {
    const [selectedProject, setSelectedProject] = useState('all')
    const [dateRange, setDateRange] = useState('30d')
    const [reportType, setReportType] = useState('overview')

    const projects = [
        { id: 'all', name: 'All Projects' },
        { id: 'TFP', name: 'TaskFlow Pro' },
        { id: 'MA', name: 'Mobile App' },
        { id: 'API', name: 'API Development' }
    ]

    const dateRanges = [
        { value: '7d', label: 'Last 7 days' },
        { value: '30d', label: 'Last 30 days' },
        { value: '90d', label: 'Last 90 days' },
        { value: '1y', label: 'Last year' }
    ]

    const reportTypes = [
        { value: 'overview', label: 'Overview', icon: BarChart3 },
        { value: 'velocity', label: 'Velocity', icon: TrendingUp },
        { value: 'burndown', label: 'Burndown', icon: Clock },
        { value: 'team', label: 'Team Performance', icon: Users }
    ]

    // Mock data for charts and metrics
    const overviewData = {
        totalIssues: 156,
        completedIssues: 89,
        inProgressIssues: 34,
        blockedIssues: 8,
        overdueIssues: 12,
        averageResolutionTime: '3.2 days',
        teamVelocity: 42,
        sprintCompletion: 87
    }

    const velocityData = [
        { sprint: 'Sprint 1', completed: 38, planned: 40 },
        { sprint: 'Sprint 2', completed: 42, planned: 45 },
        { sprint: 'Sprint 3', completed: 35, planned: 40 },
        { sprint: 'Sprint 4', completed: 48, planned: 50 },
        { sprint: 'Sprint 5', completed: 41, planned: 45 }
    ]

    const issueTypesData = [
        { type: 'Story', count: 45, percentage: 35 },
        { type: 'Task', count: 38, percentage: 29 },
        { type: 'Bug', count: 28, percentage: 22 },
        { type: 'Epic', count: 12, percentage: 9 },
        { type: 'Sub-task', count: 5, percentage: 4 }
    ]

    const teamPerformanceData = [
        { name: 'John Doe', completed: 23, inProgress: 5, blocked: 1, efficiency: 92 },
        { name: 'Alice Johnson', completed: 19, inProgress: 3, blocked: 0, efficiency: 88 },
        { name: 'Mike Brown', completed: 17, inProgress: 4, blocked: 2, efficiency: 85 },
        { name: 'Sarah Davis', completed: 15, inProgress: 2, blocked: 1, efficiency: 90 },
        { name: 'Bob Wilson', completed: 12, inProgress: 6, blocked: 3, efficiency: 78 }
    ]

    const priorityDistribution = [
        { priority: 'Critical', count: 8, color: 'bg-red-500' },
        { priority: 'High', count: 24, color: 'bg-orange-500' },
        { priority: 'Medium', count: 67, color: 'bg-yellow-500' },
        { priority: 'Low', count: 57, color: 'bg-green-500' }
    ]

    const getEfficiencyColor = (efficiency: number) => {
        if (efficiency >= 90) return 'text-green-600'
        if (efficiency >= 80) return 'text-yellow-600'
        return 'text-red-600'
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                            <p className="text-gray-600">Track project progress and team performance</p>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Project Filter */}
                            <select
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {projects.map(project => (
                                    <option key={project.id} value={project.id}>{project.name}</option>
                                ))}
                            </select>

                            {/* Date Range */}
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {dateRanges.map(range => (
                                    <option key={range.value} value={range.value}>{range.label}</option>
                                ))}
                            </select>

                            {/* Actions */}
                            <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                                <RefreshCw className="w-4 h-4" />
                                <span className="text-sm">Refresh</span>
                            </button>
                            <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                <Download className="w-4 h-4" />
                                <span className="text-sm">Export</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Type Tabs */}
            <div className="bg-white border-b border-gray-200">
                <div className="px-6">
                    <div className="flex space-x-8">
                        {reportTypes.map(type => (
                            <button
                                key={type.value}
                                onClick={() => setReportType(type.value)}
                                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${reportType === type.value
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <type.icon className="w-4 h-4" />
                                <span>{type.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-6">
                {reportType === 'overview' && (
                    <div className="space-y-6">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Issues</p>
                                        <p className="text-3xl font-bold text-gray-900">{overviewData.totalIssues}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <BarChart3 className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Completed</p>
                                        <p className="text-3xl font-bold text-green-600">{overviewData.completedIssues}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">In Progress</p>
                                        <p className="text-3xl font-bold text-blue-600">{overviewData.inProgressIssues}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Overdue</p>
                                        <p className="text-3xl font-bold text-red-600">{overviewData.overdueIssues}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                        <AlertCircle className="w-6 h-6 text-red-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Issue Types Distribution */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Issue Types Distribution</h3>
                                <div className="space-y-3">
                                    {issueTypesData.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                <span className="text-sm font-medium text-gray-700">{item.type}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm text-gray-600">{item.count}</span>
                                                <span className="text-sm text-gray-500">({item.percentage}%)</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Priority Distribution */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Distribution</h3>
                                <div className="space-y-3">
                                    {priorityDistribution.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-3 h-3 ${item.color} rounded-full`}></div>
                                                <span className="text-sm font-medium text-gray-700">{item.priority}</span>
                                            </div>
                                            <span className="text-sm text-gray-600">{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Resolution Time</h3>
                                <p className="text-3xl font-bold text-blue-600">{overviewData.averageResolutionTime}</p>
                                <p className="text-sm text-gray-500 mt-2">Down 12% from last month</p>
                            </div>

                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Velocity</h3>
                                <p className="text-3xl font-bold text-green-600">{overviewData.teamVelocity}</p>
                                <p className="text-sm text-gray-500 mt-2">Story points per sprint</p>
                            </div>

                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sprint Completion</h3>
                                <p className="text-3xl font-bold text-purple-600">{overviewData.sprintCompletion}%</p>
                                <p className="text-sm text-gray-500 mt-2">Average completion rate</p>
                            </div>
                        </div>
                    </div>
                )}

                {reportType === 'velocity' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Sprint Velocity</h3>
                            <div className="space-y-4">
                                {velocityData.map((sprint, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-4">
                                            <span className="font-medium text-gray-900">{sprint.sprint}</span>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-500 h-2 rounded-full"
                                                        style={{ width: `${(sprint.completed / sprint.planned) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm text-gray-600">
                                                    {sprint.completed}/{sprint.planned}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {Math.round((sprint.completed / sprint.planned) * 100)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {reportType === 'team' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Team Performance</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Team Member
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Completed
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                In Progress
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Blocked
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Efficiency
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {teamPerformanceData.map((member, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                                            <span className="text-xs font-medium">
                                                                {member.name.split(' ').map(n => n[0]).join('')}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900">{member.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {member.completed}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {member.inProgress}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {member.blocked}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`text-sm font-medium ${getEfficiencyColor(member.efficiency)}`}>
                                                        {member.efficiency}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {reportType === 'burndown' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Sprint Burndown Chart</h3>
                            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                                <p className="text-gray-500">Burndown chart visualization would go here</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default JiraReports
