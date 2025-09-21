import React, { useState } from 'react'
import { X, User, Calendar, Tag, AlertCircle, FileText, Link, Paperclip } from 'lucide-react'

interface CreateIssueModalProps {
    isOpen: boolean
    onClose: () => void
    onCreate: (issue: any) => void
}

const CreateIssueModal: React.FC<CreateIssueModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [formData, setFormData] = useState({
        project: 'TFP',
        issueType: 'Story',
        summary: '',
        description: '',
        priority: 'Medium',
        assignee: '',
        reporter: '',
        labels: '',
        storyPoints: '',
        epic: '',
        sprint: '',
        dueDate: '',
        components: '',
        fixVersions: '',
        environment: ''
    })

    const [activeTab, setActiveTab] = useState('details')

    const issueTypes = [
        { value: 'Story', label: 'Story', icon: '📖', color: 'blue' },
        { value: 'Task', label: 'Task', icon: '✅', color: 'green' },
        { value: 'Bug', label: 'Bug', icon: '🐛', color: 'red' },
        { value: 'Epic', label: 'Epic', icon: '🎯', color: 'purple' },
        { value: 'Sub-task', label: 'Sub-task', icon: '📋', color: 'gray' }
    ]

    const priorities = [
        { value: 'Critical', label: 'Critical', color: 'red' },
        { value: 'High', label: 'High', color: 'orange' },
        { value: 'Medium', label: 'Medium', color: 'yellow' },
        { value: 'Low', label: 'Low', color: 'green' }
    ]

    const users = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Alice Johnson', email: 'alice@example.com' },
        { id: 3, name: 'Mike Brown', email: 'mike@example.com' },
        { id: 4, name: 'Sarah Davis', email: 'sarah@example.com' }
    ]

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const issue = {
            id: `${formData.project}-${Math.floor(Math.random() * 1000)}`,
            ...formData,
            status: 'To Do',
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        }
        onCreate(issue)
        onClose()
    }

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Create Issue</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    {['details', 'description', 'people', 'dates', 'links'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 text-sm font-medium capitalize ${activeTab === tab
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[60vh]">
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            {/* Project and Issue Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Project
                                    </label>
                                    <select
                                        value={formData.project}
                                        onChange={(e) => handleChange('project', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="TFP">TaskFlow Pro (TFP)</option>
                                        <option value="MA">Mobile App (MA)</option>
                                        <option value="API">API Development (API)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Issue Type
                                    </label>
                                    <select
                                        value={formData.issueType}
                                        onChange={(e) => handleChange('issueType', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {issueTypes.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.icon} {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Summary */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Summary <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.summary}
                                    onChange={(e) => handleChange('summary', e.target.value)}
                                    placeholder="Enter a short summary of the issue"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            {/* Priority and Story Points */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Priority
                                    </label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => handleChange('priority', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {priorities.map(priority => (
                                            <option key={priority.value} value={priority.value}>
                                                {priority.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Story Points
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.storyPoints}
                                        onChange={(e) => handleChange('storyPoints', e.target.value)}
                                        placeholder="e.g., 5"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Labels */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Labels
                                </label>
                                <input
                                    type="text"
                                    value={formData.labels}
                                    onChange={(e) => handleChange('labels', e.target.value)}
                                    placeholder="Enter labels separated by commas"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'description' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    placeholder="Describe the issue in detail..."
                                    rows={8}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Attachments */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Attachments
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <Paperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">Drag and drop files here, or click to browse</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'people' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Assignee
                                    </label>
                                    <select
                                        value={formData.assignee}
                                        onChange={(e) => handleChange('assignee', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Unassigned</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.name}>
                                                {user.name} ({user.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reporter
                                    </label>
                                    <select
                                        value={formData.reporter}
                                        onChange={(e) => handleChange('reporter', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {users.map(user => (
                                            <option key={user.id} value={user.name}>
                                                {user.name} ({user.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Epic
                                    </label>
                                    <select
                                        value={formData.epic}
                                        onChange={(e) => handleChange('epic', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">None</option>
                                        <option value="User Management">User Management</option>
                                        <option value="Payment System">Payment System</option>
                                        <option value="Mobile App">Mobile App</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sprint
                                    </label>
                                    <select
                                        value={formData.sprint}
                                        onChange={(e) => handleChange('sprint', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">None</option>
                                        <option value="Sprint 1">Sprint 1</option>
                                        <option value="Sprint 2">Sprint 2</option>
                                        <option value="Sprint 3">Sprint 3</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'dates' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => handleChange('dueDate', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Components
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.components}
                                        onChange={(e) => handleChange('components', e.target.value)}
                                        placeholder="e.g., Frontend, Backend"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Fix Versions
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.fixVersions}
                                        onChange={(e) => handleChange('fixVersions', e.target.value)}
                                        placeholder="e.g., v1.0, v1.1"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Environment
                                </label>
                                <input
                                    type="text"
                                    value={formData.environment}
                                    onChange={(e) => handleChange('environment', e.target.value)}
                                    placeholder="e.g., Production, Staging, Development"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'links' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Related Issues
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., TFP-123, TFP-456"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    External Links
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://example.com"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    )}
                    
                    {/* Footer */}
                    <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                        >
                            Create Issue
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CreateIssueModal
