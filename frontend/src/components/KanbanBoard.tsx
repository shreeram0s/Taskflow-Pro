import React, { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { User, Task } from '../types'
import { taskService, projectService } from '../services/api'
import { formatDate, getPriorityColor, getInitials } from '../utils/auth'
import { useRealTimeSync } from '../hooks/useRealTimeSync'
import {
  Calendar,
  User as UserIcon,
  AlertCircle,
  Loader2,
  MoreVertical,
  MessageSquare,
  UserPlus,
  Clock,
  CheckCircle,
  PlayCircle,
  Eye,
  GripVertical
} from 'lucide-react'

interface KanbanBoardProps {
  user: User
  projectId?: number
}

interface Column {
  id: string
  title: string
  status: Task['status']
  tasks: Task[]
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId, user }) => {
  const [columns, setColumns] = useState<Column[]>([
    { id: 'todo', title: 'To Do', status: 'todo', tasks: [] },
    { id: 'in-progress', title: 'In Progress', status: 'in-progress', tasks: [] },
    { id: 'review', title: 'Review', status: 'review', tasks: [] },
    { id: 'done', title: 'Done', status: 'done', tasks: [] }
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [projectMembers, setProjectMembers] = useState<User[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [assigningTask, setAssigningTask] = useState<Task | null>(null)
  const [assignLoading, setAssignLoading] = useState(false)

  // Real-time sync
  useRealTimeSync({
    userId: user.id,
    userRole: user.role as 'employee' | 'scrum_master',
    onTaskUpdate: (updatedTasks) => {
      console.log('KanbanBoard: Tasks updated via real-time sync', updatedTasks.length)
      console.log('Real-time sync tasks:', updatedTasks)

      // Update columns with new tasks
      const visibleTasks = user && user.role === 'employee'
        ? updatedTasks.filter(t => {
          console.log('Real-time filtering task:', t.title, 'assignee:', t.assignee)
          return t.assignee && t.assignee.id === user.id
        })
        : updatedTasks

      console.log('Real-time visible tasks:', visibleTasks)

      const updatedColumns = columns.map(column => {
        const columnTasks = visibleTasks.filter(task => task.status === column.status)
        console.log(`Real-time column ${column.title} (${column.status}): ${columnTasks.length} tasks`)
        return {
          ...column,
          tasks: columnTasks
        }
      })

      setColumns(updatedColumns)
    }
  })

  useEffect(() => {
    fetchTasks()
    if (projectId) {
      fetchProjectMembers()
      // Create a sample task if none exist
      createSampleTaskIfNeeded()
    } else if (user.role === 'employee') {
      // For employees without a specific project, create a sample task in the first available project
      createSampleTaskForEmployee()
    }
  }, [projectId])

  const createSampleTaskForEmployee = async () => {
    try {
      // Get all projects to find one to create a sample task in
      const projectsResponse = await projectService.getAllProjects()
      const projects = projectsResponse.data

      if (projects.length > 0) {
        const firstProject = projects[0]
        console.log('Creating sample task for employee in project:', firstProject.id)

        await taskService.createTask(firstProject.id, {
          title: 'Your First Task',
          description: 'This task has been assigned to you. Drag it to different columns to update its status.',
          priority: 'medium',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          assignee_id: user.id
        })

        // Refresh tasks after creating sample
        fetchTasks()
      }
    } catch (err) {
      console.error('Error creating sample task for employee:', err)
    }
  }

  const createSampleTaskIfNeeded = async () => {
    if (!projectId) return

    try {
      const response = await taskService.getAllTasks(projectId)

      if (response.data.length === 0) {
        console.log('Creating sample task for project:', projectId)

        // For scrum master, create an unassigned sample task
        if (user.role === 'scrum_master') {
          await taskService.createTask(projectId, {
            title: 'Sample Task',
            description: 'This is a sample task to demonstrate the Kanban board functionality',
            priority: 'medium',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          })
        }

        // For employee, create a task assigned to them
        if (user.role === 'employee') {
          console.log('Creating sample task assigned to employee:', user.id)
          await taskService.createTask(projectId, {
            title: 'Your First Task',
            description: 'This task has been assigned to you. Drag it to different columns to update its status.',
            priority: 'medium',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            assignee_id: user.id
          })
        }

        // Refresh tasks after creating sample
        fetchTasks()
      } else if (user.role === 'employee') {
        // If there are tasks but none assigned to this employee, create one
        const employeeTasks = response.data.filter(t => t.assignee && t.assignee.id === user.id)
        if (employeeTasks.length === 0) {
          console.log('Creating sample task assigned to employee:', user.id)
          await taskService.createTask(projectId, {
            title: 'Your First Task',
            description: 'This task has been assigned to you. Drag it to different columns to update its status.',
            priority: 'medium',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            assignee_id: user.id
          })
          // Refresh tasks after creating sample
          fetchTasks()
        }
      }
    } catch (err) {
      console.error('Error checking or creating sample task:', err)
    }
  }

  const fetchProjectMembers = async () => {
    if (!projectId) return

    setLoadingMembers(true)
    try {
      const response = await projectService.getAssignableUsers(projectId)
      setProjectMembers(response.data)
    } catch (err) {
      console.error('Failed to fetch project members:', err)
      setProjectMembers([])
    } finally {
      setLoadingMembers(false)
    }
  }

  const fetchTasks = async () => {
    try {
      setLoading(true)

      // Debug logging
      console.log('KanbanBoard - Fetching tasks with projectId:', projectId)

      let response
      if (projectId) {
        // Fetch tasks for specific project
        response = await taskService.getAllTasks(projectId)
      } else {
        // Fetch all tasks (for employees, this will be filtered to their assigned tasks)
        response = await taskService.getAllTasks()
      }

      console.log('Tasks API response:', response)
      const tasks = response.data || response.results || []

      console.log('All tasks from API:', tasks)
      console.log('User ID for filtering:', user.id)
      console.log('User role:', user.role)

      const visibleTasks = user && user.role === 'employee'
        ? tasks.filter(t => {
          console.log('Checking task:', t.title, 'assignee:', t.assignee)
          return t.assignee && t.assignee.id === user.id
        })
        : tasks

      console.log('Filtered tasks for display:', visibleTasks)
      console.log('Number of visible tasks:', visibleTasks.length)

      // Group tasks by status
      const updatedColumns = columns.map(column => {
        const columnTasks = visibleTasks.filter(task => task.status === column.status)
        console.log(`Column ${column.title} (${column.status}): ${columnTasks.length} tasks`)
        return {
          ...column,
          tasks: columnTasks
        }
      })

      console.log('Updated columns:', updatedColumns)
      setColumns(updatedColumns)
    } catch (err: any) {
      setError('Failed to load tasks')
      console.error('Error fetching tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (start: any) => {
    const taskId = start.draggableId
    const task = columns
      .flatMap(col => col.tasks)
      .find(t => t.id.toString() === taskId)
    setDraggedTask(task || null)
    setIsDragging(true)
  }

  const handleDragUpdate = (update: any) => {
    const { destination } = update
    setDragOverColumn(destination ? destination.droppableId : null)
  }

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    // Reset dragged task
    setDraggedTask(null)
    setDragOverColumn(null)
    setIsDragging(false)

    if (!destination) {
      console.log('No destination, drag cancelled')
      return
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      console.log('Same position, no change needed')
      return
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId)
    const destColumn = columns.find(col => col.id === destination.droppableId)

    if (!sourceColumn || !destColumn) {
      console.error('Source or destination column not found')
      return
    }

    const task = sourceColumn.tasks.find(t => t.id.toString() === draggableId)
    if (!task) {
      console.error('Task not found in source column')
      return
    }

    console.log(`Moving task ${task.id} from ${sourceColumn.status} to ${destColumn.status}`)

    // Check if user is employee and trying to move someone else's task
    if (user.role === 'employee' && task.assignee && task.assignee.id !== user.id) {
      alert('You can only move tasks assigned to you')
      return
    }

    // Check if task is already in the destination status
    if (task.status === destColumn.status) {
      console.log('Task already in destination status')
      return
    }

    // Store original columns for potential revert
    const originalColumns = columns

    // Optimistic update with smooth animation
    const newColumns = columns.map(column => {
      if (column.id === source.droppableId) {
        return {
          ...column,
          tasks: column.tasks.filter(t => t.id.toString() !== draggableId)
        }
      }
      if (column.id === destination.droppableId) {
        const newTask = { ...task, status: destColumn.status }
        const newTasks = Array.from(column.tasks)
        newTasks.splice(destination.index, 0, newTask)
        return {
          ...column,
          tasks: newTasks
        }
      }
      return column
    })

    setColumns(newColumns)

    // Update task status on backend
    try {
      console.log(`Updating task ${task.id} status to ${destColumn.status}`)

      // Use the dedicated changeStatus method for better tracking
      const response = await taskService.changeStatus(task.id, destColumn.status)
      console.log('Status change response:', response)

      // Show success feedback
      console.log(`✅ Task "${task.title}" moved to ${destColumn.title}`)

      // Show visual feedback
      const successMessage = `Task "${task.title}" moved to ${destColumn.title}`
      console.log(successMessage)

      // You could add a toast notification here
      // toast.success(successMessage)

      // Refresh tasks after status change to ensure dashboard is updated
      setTimeout(() => {
        fetchTasks()
      }, 500)
    } catch (err) {
      // Revert on error
      console.error('Error updating task status:', err)
      setColumns(originalColumns)
      alert('Failed to update task status. Please try again.')
    }
  }

  // Alternative status change function using buttons
  const handleStatusChange = async (task: Task, newStatus: Task['status']) => {
    // Check if user is employee and trying to move someone else's task
    if (user.role === 'employee' && task.assignee && task.assignee.id !== user.id) {
      alert('You can only change status of tasks assigned to you')
      return
    }

    // Check if task is already in the destination status
    if (task.status === newStatus) {
      console.log('Task already in destination status')
      return
    }

    console.log(`Changing task ${task.id} status from ${task.status} to ${newStatus}`)

    // Store original columns for potential revert
    const originalColumns = columns

    // Optimistic update
    const newColumns = columns.map(column => {
      if (column.id === task.status) {
        // Remove from current column
        return {
          ...column,
          tasks: column.tasks.filter(t => t.id !== task.id)
        }
      }
      if (column.id === newStatus) {
        // Add to new column
        const newTask = { ...task, status: newStatus }
        return {
          ...column,
          tasks: [...column.tasks, newTask]
        }
      }
      return column
    })

    setColumns(newColumns)

    // Update task status on backend
    try {
      console.log(`Updating task ${task.id} status to ${newStatus}`)

      const response = await taskService.changeStatus(task.id, newStatus)
      console.log('Status change response:', response)

      // Show success feedback
      const statusLabels = {
        'todo': 'To Do',
        'in-progress': 'In Progress',
        'review': 'Review',
        'done': 'Done'
      }

      console.log(`✅ Task "${task.title}" moved to ${statusLabels[newStatus]}`)

      // Refresh tasks after status change to ensure dashboard is updated
      setTimeout(() => {
        fetchTasks()
      }, 500)
    } catch (err) {
      // Revert on error
      console.error('Error updating task status:', err)
      setColumns(originalColumns)
      alert('Failed to update task status. Please try again.')
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
      case 'low':
        return '🟢'
      default:
        return '⚪'
    }
  }

  if (!projectId) {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-gray-100 rounded-lg p-8 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Project Selected</h3>
        <p className="text-gray-600 mb-4">Please select a project from the Projects page to view and manage tasks.</p>
        <a href="/projects" className="btn btn-primary">Go to Projects</a>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchTasks}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const getColumnIcon = (status: string) => {
    switch (status) {
      case 'todo':
        return <Clock className="w-4 h-4" />
      case 'in-progress':
        return <PlayCircle className="w-4 h-4" />
      case 'review':
        return <Eye className="w-4 h-4" />
      case 'done':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getColumnColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'border-gray-200 bg-gray-50'
      case 'in-progress':
        return 'border-blue-200 bg-blue-50'
      case 'review':
        return 'border-yellow-200 bg-yellow-50'
      case 'done':
        return 'border-green-200 bg-green-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="kanban-board min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Board</h1>
          <p className="text-gray-600">Drag and drop tasks or use quick action buttons to update their status</p>
        </div>

        <DragDropContext onDragStart={handleDragStart} onDragUpdate={handleDragUpdate} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {columns.map((column) => (
              <div key={column.id} className={`kanban-column rounded-xl border-2 ${getColumnColor(column.status)} shadow-lg transition-all duration-300 hover:shadow-xl`}>
                <div className="kanban-header p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-lg ${getColumnColor(column.status)}`}>
                        {getColumnIcon(column.status)}
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg">{column.title}</h3>
                    </div>
                    <span className="bg-white text-gray-700 text-sm font-semibold px-3 py-1 rounded-full shadow-sm">
                      {column.tasks.length}
                    </span>
                  </div>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`kanban-content min-h-[400px] p-4 transition-all duration-300 ${snapshot.isDraggingOver
                        ? 'bg-blue-100 border-2 border-dashed border-blue-400 scale-105 shadow-lg'
                        : isDragging && draggedTask && draggedTask.status !== column.status
                          ? 'bg-gray-50 border-2 border-dashed border-gray-300 scale-102'
                          : 'bg-white'
                        }`}
                    >
                      {column.tasks.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                          <div className="text-4xl mb-2">📋</div>
                          <p className="text-sm">
                            {snapshot.isDraggingOver ? 'Drop task here' : 'No tasks yet'}
                          </p>
                        </div>
                      )}

                      {/* Drag Preview Overlay */}
                      {isDragging && draggedTask && draggedTask.status !== column.status && (
                        <div className="absolute inset-0 bg-blue-50 bg-opacity-50 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center pointer-events-none">
                          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">
                            Drop to move to {column.title}
                          </div>
                        </div>
                      )}

                      {column.tasks.map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`task-card bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm transition-all duration-200 hover:shadow-md cursor-grab active:cursor-grabbing ${snapshot.isDragging
                                ? 'shadow-2xl transform rotate-3 scale-105 border-blue-400 bg-blue-50 z-50'
                                : 'hover:border-gray-300 hover:scale-102'
                                }`}
                              onClick={() => setSelectedTask(task)}
                            >
                              {/* Drag Handle */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <GripVertical className="w-4 h-4 text-gray-400" />
                                  <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
                                    {task.title}
                                  </h4>
                                </div>
                                <button className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </div>

                              <p className="text-xs text-gray-600 mb-4 line-clamp-3">
                                {task.description}
                              </p>

                              {/* Priority and Due Date */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">
                                    {getPriorityIcon(task.priority)}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                                    {task.priority.toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {formatDate(task.due_date)}
                                </div>
                              </div>

                              {/* Status Change Buttons */}
                              <div className="mb-4">
                                <div className="text-xs text-gray-500 mb-2 font-medium">Quick Actions:</div>
                                <div className="flex flex-wrap gap-1">
                                  {task.status !== 'todo' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleStatusChange(task, 'todo')
                                      }}
                                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                      title="Move to To Do"
                                    >
                                      📋 To Do
                                    </button>
                                  )}
                                  {task.status !== 'in-progress' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleStatusChange(task, 'in-progress')
                                      }}
                                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                      title="Move to In Progress"
                                    >
                                      ▶️ In Progress
                                    </button>
                                  )}
                                  {task.status !== 'review' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleStatusChange(task, 'review')
                                      }}
                                      className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                                      title="Move to Review"
                                    >
                                      👁️ Review
                                    </button>
                                  )}
                                  {task.status !== 'done' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleStatusChange(task, 'done')
                                      }}
                                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                      title="Mark as Done"
                                    >
                                      ✅ Done
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Assignee and Comments */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  {task.assignee ? (
                                    <div className="flex items-center">
                                      <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-xs font-semibold shadow-sm">
                                        {getInitials(task.assignee.first_name, task.assignee.last_name)}
                                      </div>
                                      <span className="ml-2 text-xs text-gray-600 font-medium">
                                        {task.assignee.first_name}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center text-xs text-gray-400">
                                      <UserIcon className="w-3 h-3 mr-1" />
                                      <span>Unassigned</span>
                                      {user.role === 'scrum_master' && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setAssigningTask(task)
                                            setShowAssignModal(true)
                                          }}
                                          className="ml-2 p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-100"
                                          title="Assign task"
                                        >
                                          <UserPlus className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center space-x-2">
                                  {task.comment_count > 0 && (
                                    <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                      <MessageSquare className="w-3 h-3 mr-1" />
                                      {task.comment_count}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          currentUser={user}
          onClose={() => setSelectedTask(null)}
          onUpdate={fetchTasks}
        />
      )}
    </div>
  )
}

// Task Detail Modal Component
interface TaskDetailModalProps {
  task: Task
  currentUser: User
  onClose: () => void
  onUpdate: () => void
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, currentUser, onClose, onUpdate }) => {
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusValue, setStatusValue] = useState<Task['status']>(task.status)
  const [priorityValue, setPriorityValue] = useState<Task['priority']>(task.priority)

  useEffect(() => {
    // Load task details with comments
    loadTaskDetails()
  }, [task.id])

  const loadTaskDetails = async () => {
    try {
      const response = await taskService.getTask(task.id)
      setComments(response.data.comments || [])
    } catch (err) {
      console.error('Error loading task details:', err)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      setLoading(true)
      await taskService.addComment(task.id, newComment)
      setNewComment('')
      await loadTaskDetails()
      onUpdate()
    } catch (err) {
      console.error('Error adding comment:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveStatus = async () => {
    try {
      setLoading(true)
      await taskService.changeStatus(task.id, statusValue)
      await loadTaskDetails()
      onUpdate()
    } catch (err) {
      console.error('Error changing status:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePriority = async () => {
    try {
      setLoading(true)
      await taskService.changePriority(task.id, priorityValue)
      await loadTaskDetails()
      onUpdate()
    } catch (err) {
      console.error('Error changing priority:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUnassign = async () => {
    try {
      setLoading(true)
      await taskService.unassign(task.id)
      await loadTaskDetails()
      onUpdate()
    } catch (err) {
      console.error('Error unassigning:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async (userId: number) => {
    if (!assigningTask) return

    try {
      setAssignLoading(true)
      await taskService.assign(assigningTask.id, userId)
      await fetchTasks()
      setShowAssignModal(false)
      setAssigningTask(null)
    } catch (err) {
      console.error('Error assigning task:', err)
    } finally {
      setAssignLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">{task.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Status</h3>
                <div className="flex items-center space-x-2">
                  <select
                    className="px-2 py-1 border rounded-md text-sm"
                    value={statusValue}
                    onChange={(e) => setStatusValue(e.target.value as Task['status'])}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                  <button onClick={handleSaveStatus} disabled={loading} className="btn btn-primary btn-sm">Save</button>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Priority</h3>
                <div className="flex items-center space-x-2">
                  <select
                    className="px-2 py-1 border rounded-md text-sm"
                    value={priorityValue}
                    onChange={(e) => setPriorityValue(e.target.value as Task['priority'])}
                    disabled={currentUser.role !== 'scrum_master'}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  {currentUser.role === 'scrum_master' && (
                    <button onClick={handleSavePriority} disabled={loading} className="btn btn-primary btn-sm">Save</button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Due Date</h3>
              <p className="text-gray-600">{formatDate(task.due_date)}</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Assignee</h3>
              {task.assignee ? (
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm">
                    {getInitials(task.assignee.first_name, task.assignee.last_name)}
                  </div>
                  <span className="ml-3 text-gray-600">
                    {task.assignee.first_name} {task.assignee.last_name}
                  </span>
                  {currentUser.role === 'scrum_master' && (
                    <button onClick={handleUnassign} disabled={loading} className="ml-auto btn btn-secondary btn-sm">Unassign</button>
                  )}
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="text-gray-400">Unassigned</span>
                  {currentUser.role === 'scrum_master' && (
                    <button
                      onClick={() => setShowAssignModal(true)}
                      disabled={loading}
                      className="ml-auto btn btn-primary btn-sm"
                    >
                      Assign
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-4">Comments</h3>
              <div className="space-y-3 mb-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                        {getInitials(comment.user.first_name || 'U', comment.user.last_name || 'U')}
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {comment.user.username}
                      </span>
                      <span className="ml-auto text-xs text-gray-500">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{comment.content}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={3}
                />
                <button
                  type="submit"
                  disabled={loading || !newComment.trim()}
                  className="btn btn-primary btn-sm"
                >
                  {loading ? 'Adding...' : 'Add Comment'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && assigningTask && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Assign Task</h2>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Task: {assigningTask.title}</h3>
                <p className="text-sm text-gray-600">{assigningTask.description}</p>
              </div>

              <div className="mb-6">
                <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to
                </label>
                <select
                  id="assignee"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  disabled={loadingMembers}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAssign(parseInt(e.target.value))
                    }
                  }}
                >
                  <option value="">Select a team member...</option>
                  {projectMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.first_name && member.last_name
                        ? `${member.first_name} ${member.last_name} (${member.username})`
                        : member.username
                      } - {member.role === 'scrum_master' ? 'Scrum Master' : 'Employee'}
                    </option>
                  ))}
                </select>
                {loadingMembers && (
                  <p className="mt-1 text-sm text-gray-500">Loading team members...</p>
                )}
                {!loadingMembers && projectMembers.length === 0 && (
                  <p className="mt-1 text-sm text-gray-500">No team members available for assignment</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KanbanBoard
