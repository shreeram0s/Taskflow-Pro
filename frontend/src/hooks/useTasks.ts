import { useCallback, useEffect, useState } from 'react'
import { Task, TaskForm } from '../types'
import { taskService } from '../services/api'

export function useTasks(projectId?: number) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string>('')
    const [filters, setFilters] = useState<{ status?: string; priority?: string; assignee?: number; search?: string }>({})

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true)
            setError('')
            const res = await taskService.getAllTasks(projectId, filters)
            setTasks(res.data)
        } catch (err: any) {
            console.error(err)
            setError('Failed to load tasks')
        } finally {
            setLoading(false)
        }
    }, [projectId, filters])

    const createTask = useCallback(async (data: TaskForm) => {
        if (projectId === undefined) throw new Error('projectId required')
        const res = await taskService.createTask(projectId, data)
        setTasks(prev => [res.data, ...prev])
        return res.data
    }, [projectId])

    const updateTask = useCallback(async (id: number, data: Partial<TaskForm>) => {
        const res = await taskService.updateTask(id, data)
        setTasks(prev => prev.map(t => (t.id === id ? (res.data as any) : t)))
        return res.data
    }, [])

    const deleteTask = useCallback(async (id: number) => {
        await taskService.deleteTask(id)
        setTasks(prev => prev.filter(t => t.id !== id))
    }, [])

    const moveTask = useCallback(async (id: number, newStatus: Task['status']) => {
        await taskService.changeStatus(id, newStatus)
        setTasks(prev => prev.map(t => (t.id === id ? { ...t, status: newStatus } : t)))
    }, [])

    useEffect(() => {
        fetchTasks()
    }, [fetchTasks])

    return { tasks, loading, error, fetchTasks, createTask, updateTask, deleteTask, moveTask, setFilters }
}

export default useTasks


