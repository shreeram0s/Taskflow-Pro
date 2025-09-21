import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { ProjectForm } from '../types'
import { projectService } from '../services/api'

interface CreateProjectModalProps {
    onClose: () => void
    onSuccess: () => void
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState<ProjectForm>({
        name: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            await projectService.createProject(formData)
            onSuccess()
        } catch (err: any) {
            const data = err?.response?.data
            let msg = 'Failed to create project'
            if (typeof data === 'string') msg = data
            else if (data?.message || data?.error || data?.detail) msg = data.message || data.error || data.detail
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                            <input id="name" name="name" required value={formData.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea id="description" name="description" rows={3} value={formData.description} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">Start Date</label>
                                <input id="start_date" name="start_date" type="date" required value={formData.start_date} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
                            </div>
                            <div>
                                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">End Date</label>
                                <input id="end_date" name="end_date" type="date" required value={formData.end_date} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 p-4">
                                <div className="text-sm text-red-700">{error}</div>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button type="button" onClick={onClose} className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50">Cancel</button>
                            <button type="submit" disabled={loading} className="px-4 py-2 rounded-md text-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Project'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default CreateProjectModal


