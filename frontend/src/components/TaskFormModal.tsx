import React, { useState, useEffect } from 'react'
import { TaskForm, User, Project } from '../types'
import { taskService, projectService } from '../services/api'
import { Loader2, X, Calendar, User as UserIcon, AlertCircle, FileText, Tag, Clock, Star, Zap, Target, Plus } from 'lucide-react'

interface TaskFormModalProps {
  projectId?: number
  onClose: () => void
  onSuccess: () => void
  user: User
  task?: TaskForm // For editing existing tasks
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({ projectId, onClose, onSuccess, user, task }) => {
  const [formData, setFormData] = useState<TaskForm>({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assignee_id: user.id
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [projectMembers, setProjectMembers] = useState<User[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<number | null>(projectId || null)

  // Initialize form data
  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        due_date: task.due_date || tomorrow.toISOString().split('T')[0],
        assignee_id: task.assignee_id || user.id
      })
    } else {
      setFormData(prev => ({
        ...prev,
        due_date: tomorrow.toISOString().split('T')[0]
      }))
    }

    // Fetch projects and project members
    fetchProjects()
    if (projectId) {
      fetchProjectMembers(projectId)
    }
  }, [projectId, task])

  const fetchProjects = async () => {
    try {
      const response = await projectService.getAllProjects()
      setProjects(response.data)
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    }
  }

  const fetchProjectMembers = async (projId: number) => {
    setLoadingMembers(true)
    try {
      const response = await projectService.getAssignableUsers(projId)
      setProjectMembers(response.data)
    } catch (err) {
      console.error('Failed to fetch project members:', err)
      setProjectMembers([])
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleProjectChange = (projId: number) => {
    setSelectedProject(projId)
    fetchProjectMembers(projId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    if (!formData.description.trim()) {
      setError('Description is required')
      return
    }

    if (!formData.due_date) {
      setError('Due date is required')
      return
    }

    if (!selectedProject) {
      setError('Please select a project')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (task && task.id) {
        // Update existing task
        await taskService.updateTask(task.id, formData)
      } else {
        // Create new task
        await taskService.createTask(selectedProject, formData)
      }
      
      onSuccess()
    } catch (err: any) {
      console.error('Error saving task:', err)
      setError(err.response?.data?.message || 'Failed to save task')
    } finally {
      setLoading(false)
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'high':
        return <Zap className="w-4 h-4 text-orange-500" />
      case 'medium':
        return <Target className="w-4 h-4 text-yellow-500" />
      default:
        return <Star className="w-4 h-4 text-green-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-200 bg-red-50 text-red-800'
      case 'high':
        return 'border-orange-200 bg-orange-50 text-orange-800'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800'
      default:
        return 'border-green-200 bg-green-50 text-green-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {task ? 'Edit Task' : 'Create New Task'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project *
            </label>
            <select
              value={selectedProject || ''}
              onChange={(e) => handleProjectChange(parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a project...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Task Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter task description..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Priority and Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <div className="space-y-2">
                {[
                  { value: 'low', label: 'Low', color: 'green' },
                  { value: 'medium', label: 'Medium', color: 'yellow' },
                  { value: 'high', label: 'High', color: 'orange' },
                  { value: 'urgent', label: 'Urgent', color: 'red' }
                ].map((priority) => (
                  <label key={priority.value} className="flex items-center">
                    <input
                      type="radio"
                      name="priority"
                      value={priority.value}
                      checked={formData.priority === priority.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="sr-only"
                    />
                    <div className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.priority === priority.value
                        ? getPriorityColor(priority.value)
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      {getPriorityIcon(priority.value)}
                      <span className="ml-2 font-medium">{priority.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Assignee Selection */}
          {selectedProject && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={formData.assignee_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignee_id: e.target.value ? parseInt(e.target.value) : undefined }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loadingMembers}
                >
                  <option value="">Select assignee...</option>
                  {projectMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.first_name && member.last_name
                        ? `${member.first_name} ${member.last_name} (${member.username})`
                        : member.username
                      } - {member.role === 'scrum_master' ? 'Scrum Master' : 'Employee'}
                    </option>
                  ))}
                </select>
              </div>
              {loadingMembers && (
                <p className="mt-2 text-sm text-gray-500 flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading team members...
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {task ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {task ? 'Update Task' : 'Create Task'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskFormModal