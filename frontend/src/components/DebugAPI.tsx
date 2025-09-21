import React, { useState } from 'react'
import { authService, projectService, taskService } from '../services/api'

const DebugAPI: React.FC = () => {
    const [status, setStatus] = useState<string>('Ready to test')
    const [data, setData] = useState<any>(null)

    const testLogin = async () => {
        try {
            setStatus('Testing login...')
            const response = await authService.login({ username: 'admin', password: 'admin123' })
            setStatus('Login successful!')
            setData(response.data)
        } catch (error: any) {
            setStatus(`Login failed: ${error.message}`)
            console.error('Login error:', error)
        }
    }

    const testProjects = async () => {
        try {
            setStatus('Testing projects...')
            const response = await projectService.getAllProjects()
            setStatus('Projects loaded successfully!')
            setData(response.data)
        } catch (error: any) {
            setStatus(`Projects failed: ${error.message}`)
            console.error('Projects error:', error)
        }
    }

    const testTasks = async () => {
        try {
            setStatus('Testing tasks...')
            const response = await taskService.getAllTasks()
            setStatus('Tasks loaded successfully!')
            setData(response.data)
        } catch (error: any) {
            setStatus(`Tasks failed: ${error.message}`)
            console.error('Tasks error:', error)
        }
    }

    return (
        <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-bold mb-4">API Debug Panel</h3>
            <div className="space-x-2 mb-4">
                <button onClick={testLogin} className="px-4 py-2 bg-blue-500 text-white rounded">
                    Test Login
                </button>
                <button onClick={testProjects} className="px-4 py-2 bg-green-500 text-white rounded">
                    Test Projects
                </button>
                <button onClick={testTasks} className="px-4 py-2 bg-purple-500 text-white rounded">
                    Test Tasks
                </button>
            </div>
            <div className="mb-2">
                <strong>Status:</strong> {status}
            </div>
            {data && (
                <div>
                    <strong>Data:</strong>
                    <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    )
}

export default DebugAPI
