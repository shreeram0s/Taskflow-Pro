import React, { useState } from 'react'
import {
    X,
    User,
    Calendar,
    Tag,
    AlertCircle,
    FileText,
    Link,
    Paperclip,
    MessageSquare,
    Clock,
    Edit,
    MoreHorizontal,
    CheckCircle,
    Play,
    Pause,
    Circle
} from 'lucide-react'

interface IssueDetailModalProps {
    issue: any
    isOpen: boolean
    onClose: () => void
    onUpdate: (issue: any) => void
}

const IssueDetailModal: React.FC<IssueDetailModalProps> = ({ issue, isOpen, onClose, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [activeTab, setActiveTab] = useState('details')
    const [newComment, setNewComment] = useState('')
    const [comments, setComments] = useState([
        {
            id: 1,
            author: 'John Doe',
            content: 'This looks good to me. Ready for review.',
            created: '2024-01-20T10:30:00Z',
            avatar: null
        },
        {
            id: 2,
            author: 'Alice Johnson',
            content: 'I have some concerns about the implementation. Can we discuss this?',
            created: '2024-01-20T14:15:00Z',
            avatar: null
        }
    ])

    const [editedIssue, setEditedIssue] = useState(issue)

    const statusOptions = [
        { value: 'To Do', label: 'To Do', icon: Circle, color: 'gray' },
        { value: 'In Progress', label: 'In Progress', icon: Play, color: 'blue' },
        { value: 'Review', label: 'Review', icon: Clock, color: 'yellow' },
        { value: 'Done', label: 'Done', icon: CheckCircle, color: 'green' },
        { value: 'Blocked', label: 'Blocked', icon: Pause, color: 'red' }
    ]

    const priorityOptions = [
        { value: 'Critical', label: 'Critical', color: 'red' },
        { value: 'High', label: 'High', color: 'orange' },
        { value: 'Medium', label: 'Medium', color: 'yellow' },
        { value: 'Low', label: 'Low', color: 'green' }
    ]

    const getPriorityColor = (priority: string) => {
        const option = priorityOptions.find(p => p.value === priority)
        return option ? `text-${option.color}-600 bg-${option.color}-100` : 'text-gray-600 bg-gray-100'
    }

    const getStatusColor = (status: string) => {
        const option = statusOptions.find(s => s.value === status)
        return option ? `text-${option.color}-600 bg-${option.color}-100` : 'text-gray-600 bg-gray-100'
    }

    const handleStatusChange = (newStatus: string) => {
        const updatedIssue = { ...editedIssue, status: newStatus }
        setEditedIssue(updatedIssue)
        onUpdate(updatedIssue)
    }

    const handlePriorityChange = (newPriority: string) => {
        const updatedIssue = { ...editedIssue, priority: newPriority }
        setEditedIssue(updatedIssue)
        onUpdate(updatedIssue)
    }

    const handleAddComment = () => {
        if (newComment.trim()) {
            const comment = {
                id: comments.length + 1,
                author: 'Current User',
                content: newComment,
                created: new Date().toISOString(),
                avatar: null
            }
            setComments([...comments, comment])
            setNewComment('')
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-xl font-semibold text-gray-900">{editedIssue.id}</h2>
                        <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(editedIssue.priority)}`}>
                                {editedIssue.priority}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(editedIssue.status)}`}>
                                {editedIssue.status}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="p-2 text-gray-400 hover:text-gray-600"
                        >
                            <Edit className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    {['details', 'activity', 'comments', 'attachments', 'links'].map(tab => (
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

                {/* Content */}
                <div className="flex h-[60vh]">
                    {/* Main Content */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {activeTab === 'details' && (
                            <div className="space-y-6">
                                {/* Summary */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedIssue.title}
                                            onChange={(e) => setEditedIssue({ ...editedIssue, title: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <p className="text-gray-900">{editedIssue.title}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                                    {isEditing ? (
                                        <textarea
                                            value={editedIssue.description}
                                            onChange={(e) => setEditedIssue({ ...editedIssue, description: e.target.value })}
                                            rows={6}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <div className="prose max-w-none">
                                            <p className="text-gray-700">{editedIssue.description || 'No description provided.'}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Labels */}
                                {editedIssue.labels && editedIssue.labels.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Labels</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {editedIssue.labels.map((label: string, index: number) => (
                                                <span
                                                    key={index}
                                                    className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded"
                                                >
                                                    {label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-medium">JD</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium text-gray-900">John Doe</span>
                                                <span className="text-sm text-gray-500">changed status to</span>
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">In Progress</span>
                                                <span className="text-sm text-gray-500">2 hours ago</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-medium">AJ</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium text-gray-900">Alice Johnson</span>
                                                <span className="text-sm text-gray-500">assigned to</span>
                                                <span className="font-medium text-gray-900">Mike Brown</span>
                                                <span className="text-sm text-gray-500">1 day ago</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-medium">SD</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium text-gray-900">Sarah Davis</span>
                                                <span className="text-sm text-gray-500">created this issue</span>
                                                <span className="text-sm text-gray-500">3 days ago</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'comments' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">Comments</h3>

                                {/* Comments List */}
                                <div className="space-y-4">
                                    {comments.map(comment => (
                                        <div key={comment.id} className="flex items-start space-x-3">
                                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                                <span className="text-xs font-medium">
                                                    {comment.author.split(' ').map(n => n[0]).join('')}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <span className="font-medium text-gray-900">{comment.author}</span>
                                                        <span className="text-sm text-gray-500">{formatDate(comment.created)}</span>
                                                    </div>
                                                    <p className="text-gray-700">{comment.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Comment */}
                                <div className="border-t border-gray-200 pt-6">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-medium text-white">CU</span>
                                        </div>
                                        <div className="flex-1">
                                            <textarea
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="Add a comment..."
                                                rows={3}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <div className="flex justify-end mt-2">
                                                <button
                                                    onClick={handleAddComment}
                                                    disabled={!newComment.trim()}
                                                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Add Comment
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'attachments' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Attachments</h3>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                    <Paperclip className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">No attachments yet</p>
                                    <button className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                                        Add attachment
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'links' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Links</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg">
                                        <Link className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-600">No links added yet</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="w-80 border-l border-gray-200 p-6 bg-gray-50 overflow-y-auto">
                        <div className="space-y-6">
                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                {isEditing ? (
                                    <select
                                        value={editedIssue.status}
                                        onChange={(e) => handleStatusChange(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {statusOptions.map(status => (
                                            <option key={status.value} value={status.value}>
                                                {status.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(editedIssue.status)}`}>
                                            {editedIssue.status}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                                {isEditing ? (
                                    <select
                                        value={editedIssue.priority}
                                        onChange={(e) => handlePriorityChange(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {priorityOptions.map(priority => (
                                            <option key={priority.value} value={priority.value}>
                                                {priority.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(editedIssue.priority)}`}>
                                            {editedIssue.priority}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Assignee */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                        <span className="text-xs font-medium">
                                            {editedIssue.assignee?.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                                        </span>
                                    </div>
                                    <span className="text-sm text-gray-900">
                                        {editedIssue.assignee?.name || 'Unassigned'}
                                    </span>
                                </div>
                            </div>

                            {/* Reporter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Reporter</label>
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                        <span className="text-xs font-medium">
                                            {editedIssue.reporter?.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                                        </span>
                                    </div>
                                    <span className="text-sm text-gray-900">
                                        {editedIssue.reporter?.name || 'Unknown'}
                                    </span>
                                </div>
                            </div>

                            {/* Created */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Created</label>
                                <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-900">{formatDate(editedIssue.created)}</span>
                                </div>
                            </div>

                            {/* Updated */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Updated</label>
                                <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-900">{formatDate(editedIssue.updated)}</span>
                                </div>
                            </div>

                            {/* Story Points */}
                            {editedIssue.storyPoints && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Story Points</label>
                                    <span className="text-sm text-gray-900">{editedIssue.storyPoints} points</span>
                                </div>
                            )}

                            {/* Labels */}
                            {editedIssue.labels && editedIssue.labels.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Labels</label>
                                    <div className="flex flex-wrap gap-1">
                                        {editedIssue.labels.map((label: string, index: number) => (
                                            <span
                                                key={index}
                                                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                                            >
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default IssueDetailModal
