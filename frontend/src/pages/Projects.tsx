import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, Project } from '../types'
import { projectService } from '../services/api'
import { formatDate, getProjectStatusColor } from '../utils/auth'
import {
  FolderOpen,
  Plus,
  Users,
  Calendar,
  MoreVertical,
  AlertCircle,
  Loader2,
  CheckSquare
} from 'lucide-react'
import CreateProjectModal from '../components/CreateProjectModal'

interface ProjectsProps {
  user: User
}

const Projects: React.FC<ProjectsProps> = ({ user }) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await projectService.getAllProjects()
      console.log('Projects API response:', response)
      
      // If no projects exist and user is a scrum master, create a sample project
      if (response.data.length === 0 && user.role === 'scrum_master') {
        try {
          console.log('Creating sample project')
          const sampleProject = await projectService.createProject({
            name: 'Sample Project',
            description: 'This is a sample project to demonstrate TaskFlow functionality',
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'active'
          })
          console.log('Sample project created:', sampleProject)
          // Fetch projects again to include the new one
          const updatedResponse = await projectService.getAllProjects()
          setProjects(updatedResponse.data)
        } catch (createErr) {
          console.error('Error creating sample project:', createErr)
          setProjects(response.data) // Use original response if creation fails
        }
      } else {
        setProjects(response.data)
      }
    } catch (err: any) {
      setError('Failed to load projects')
      console.error('Error fetching projects:', err)
    } finally {
      setLoading(false)
    }
  }

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
          <button
            onClick={fetchProjects}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
              <p className="mt-2 text-gray-600">
                Manage and track your project progress
              </p>
            </div>
            {user.role === 'scrum_master' && (
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </button>
            )}
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-4">
              {user.role === 'scrum_master'
                ? 'Create your first project to get started'
                : 'You haven\'t been added to any projects yet'
              }
            </p>
            {user.role === 'scrum_master' && (
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-0">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProjectStatusColor(project.status)}`}>
                      {project.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckSquare className="w-4 h-4 mr-1" />
                      <span>{project.task_count} tasks</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{project.member_count} members</span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>
                      {formatDate(project.start_date)} - {formatDate(project.end_date)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Link
                      to={`/projects/${project.id}`}
                      className="flex-1 btn btn-primary btn-sm"
                    >
                      View Details
                    </Link>
                    <Link
                      to={`/projects/${project.id}/tasks`}
                      className="flex-1 btn btn-outline btn-sm"
                    >
                      View Tasks
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); fetchProjects() }}
        />
      )}
    </div>
  )
}

export default Projects
