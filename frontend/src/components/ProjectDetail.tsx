import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { projectService, taskService } from '../services/api'
import { Project, Task } from '../types'
import { Loader2, Users, CheckSquare, Calendar, AlertCircle } from 'lucide-react'
import ProjectMembers from './ProjectMembers'
import { formatDate } from '../utils/auth'

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        if (!projectId) return
        const [p, t] = await Promise.all([
          projectService.getProject(Number(projectId)),
          taskService.getAllTasks(Number(projectId)),
        ])
        setProject(p.data)
        setTasks(t.data)
      } catch (err) {
        console.error(err)
        setError('Failed to load project')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Link to="/projects" className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">Back to Projects</Link>
        </div>
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <p className="mt-2 text-gray-600">{project.description}</p>
            </div>
            <Link to={`/projects/${project.id}/tasks`} className="btn btn-primary">View Tasks</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tasks</h3>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{task.title}</h4>
                      <p className="text-sm text-gray-600">{task.description}</p>
                    </div>
                    <span className="text-xs text-gray-500">{task.status.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-2">
                    <Calendar className="w-4 h-4 mr-1" />
                    Due {formatDate(task.due_date)}
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-sm text-gray-500">No tasks yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Overview</h3>
            <div className="space-y-3">
              <div className="flex items-center text-gray-700">
                <Users className="w-4 h-4 mr-2" />
                Members: {project.member_count ?? project.members?.length ?? 0}
              </div>
              <div className="flex items-center text-gray-700">
                <CheckSquare className="w-4 h-4 mr-2" />
                Tasks: {project.task_count ?? tasks.length}
              </div>
              <div className="flex items-center text-gray-700">
                <Calendar className="w-4 h-4 mr-2" />
                {formatDate(project.start_date)} - {formatDate(project.end_date)}
              </div>
            </div>
            <div className="mt-6">
              <ProjectMembers projectId={Number(projectId)} canEdit={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectDetail
