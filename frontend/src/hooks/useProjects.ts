import { useCallback, useEffect, useState } from 'react'
import { Project, ProjectForm } from '../types'
import { projectService } from '../services/api'

export function useProjects() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string>('')

    const fetchProjects = useCallback(async () => {
        try {
            setLoading(true)
            setError('')
            const res = await projectService.getAllProjects()
            setProjects(res.data)
        } catch (err: any) {
            console.error(err)
            setError('Failed to load projects')
        } finally {
            setLoading(false)
        }
    }, [])

    const createProject = useCallback(async (data: ProjectForm) => {
        const res = await projectService.createProject(data)
        setProjects(prev => [res.data, ...prev])
        return res.data
    }, [])

    const updateProject = useCallback(async (id: number, data: Partial<ProjectForm>) => {
        const res = await projectService.updateProject(id, data)
        setProjects(prev => prev.map(p => (p.id === id ? res.data : p)))
        return res.data
    }, [])

    const deleteProject = useCallback(async (id: number) => {
        await projectService.deleteProject(id)
        setProjects(prev => prev.filter(p => p.id !== id))
    }, [])

    useEffect(() => {
        fetchProjects()
    }, [fetchProjects])

    return { projects, loading, error, fetchProjects, createProject, updateProject, deleteProject }
}

export default useProjects


