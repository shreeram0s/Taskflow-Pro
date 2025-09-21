import React from 'react'
import { useParams } from 'react-router-dom'

const TaskDetail: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Task Detail</h1>
          <p className="mt-2 text-gray-600">
            Task ID: {taskId}
          </p>
        </div>
        
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Task Detail</h3>
          <p className="text-gray-500">Task detail view coming soon...</p>
        </div>
      </div>
    </div>
  )
}

export default TaskDetail
