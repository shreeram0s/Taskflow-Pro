import React, { useMemo, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { User } from '../types'
import KanbanBoard from '../components/KanbanBoard'
import TaskFormModal from '../components/TaskFormModal'
import {
  CheckSquare,
  Plus,
  Grid3X3,
  List
} from 'lucide-react'

interface TasksProps {
  user: User
}

const Tasks: React.FC<TasksProps> = ({ user }) => {
  const { projectId } = useParams<{ projectId?: string }>()
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in-progress' | 'review' | 'done'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all')
  const [search, setSearch] = useState('')

  const projectIdNumber = projectId ? parseInt(projectId) : undefined

  // Debug logging
  console.log('Tasks component - projectId from URL:', projectId)
  console.log('Tasks component - projectIdNumber:', projectIdNumber)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
              <p className="mt-2 text-gray-600">
                {projectId ? `Project tasks (ID: ${projectId})` : 'Please select a project from the Projects page to view tasks'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`flex items-center px-3 py-1 rounded-md text-sm font-medium ${viewMode === 'kanban'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  Kanban
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center px-3 py-1 rounded-md text-sm font-medium ${viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <List className="w-4 h-4 mr-2" />
                  List
                </button>
              </div>

              {user.role === 'scrum_master' && (
                <button
                  className={`btn ${projectIdNumber ? 'btn-primary' : 'btn-disabled'}`}
                  onClick={() => setShowTaskModal(true)}
                  disabled={!projectIdNumber}
                  title={!projectIdNumber ? 'Please select a project first' : 'Create new task'}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tasks Content */}
        {viewMode === 'kanban' ? (
          <KanbanBoard user={user} projectId={projectIdNumber} />
        ) : (
          <TasksList currentUser={user} projectId={projectIdNumber} status={statusFilter} priority={priorityFilter} search={search} />
        )}

        {/* Task Form Modal */}
        {showTaskModal && (
          <TaskFormModal
            projectId={projectIdNumber}
            user={user}
            onClose={() => setShowTaskModal(false)}
            onSuccess={() => {
              setShowTaskModal(false)
              // Refresh the task list
              if (viewMode === 'kanban') {
                // The KanbanBoard component will handle its own refresh
              }
            }}
          />
        )}
      </div>
    </div>
  )
}

export default Tasks

// Tasks List Component
import { useTasks } from '../hooks/useTasks'

const TasksList: React.FC<{ currentUser: User; projectId?: number; status: 'all' | 'todo' | 'in-progress' | 'review' | 'done'; priority: 'all' | 'low' | 'medium' | 'high' | 'urgent'; search: string }> = ({ currentUser, projectId, status, priority, search }) => {
  const { tasks, loading, error, fetchTasks, setFilters } = useTasks(projectId)

  useEffect(() => {
    setFilters({
      status: status === 'all' ? undefined : status,
      priority: priority === 'all' ? undefined : priority,
      search: search || undefined,
    })
  }, [status, priority, search, setFilters])

  const filtered = useMemo(() => {
    const base = currentUser.role === 'employee' ? tasks.filter(t => t.assignee && t.assignee.id === currentUser.id) : tasks
    return base.filter(t => (status === 'all' || t.status === status) && (priority === 'all' || t.priority === priority))
  }, [tasks, status, priority, currentUser])

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>
  }
  if (error) {
    return <div className="flex items-center justify-center h-64 text-red-600">{error}</div>
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b flex items-center space-x-3">
        <input className="px-3 py-2 border rounded-md flex-1" placeholder="Search tasks..." value={search} onChange={() => { }} />
        <select className="px-2 py-1 border rounded-md" value={status} onChange={() => { }}>
          <option value="all">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
        <select className="px-2 py-1 border rounded-md" value={priority} onChange={() => { }}>
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <button className="ml-auto text-sm text-gray-600 hover:text-gray-900" onClick={fetchTasks}>Refresh</button>
      </div>
      <div className="divide-y">
        {filtered.map((t) => (
          <div key={t.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{t.title}</div>
                <div className="text-sm text-gray-600 line-clamp-2">{t.description}</div>
              </div>
              <div className="text-xs text-gray-500">{t.status.toUpperCase()}</div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="p-6 text-center text-sm text-gray-500">No tasks.</div>}
      </div>
    </div>
  )
}
