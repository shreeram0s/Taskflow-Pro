import { useEffect, useCallback, useRef } from 'react'
import { taskService, projectService } from '../services/api'

interface UseRealTimeSyncProps {
    userId: number
    userRole: 'employee' | 'scrum_master'
    onTaskUpdate?: (tasks: any[]) => void
    onProjectUpdate?: (projects: any[]) => void
    onNotification?: (notification: any) => void
    interval?: number
}

export const useRealTimeSync = ({
    userId,
    userRole,
    onTaskUpdate,
    onProjectUpdate,
    onNotification,
    interval = 30000 // 30 seconds default
}: UseRealTimeSyncProps) => {
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const lastUpdateRef = useRef<Date>(new Date())

    const syncData = useCallback(async () => {
        try {
            // Fetch latest tasks
            const tasksResponse = await taskService.getAllTasks()
            const tasks = tasksResponse.data

            // Filter tasks based on user role
            const userTasks = userRole === 'employee'
                ? tasks.filter((task: any) => task.assignee?.id === userId)
                : tasks

            onTaskUpdate?.(userTasks)

            // Fetch latest projects
            const projectsResponse = await projectService.getAllProjects()
            const projects = projectsResponse.data
            onProjectUpdate?.(projects)

            // Check for new notifications (simplified - in real app, this would be a proper API)
            const now = new Date()
            const timeSinceLastUpdate = now.getTime() - lastUpdateRef.current.getTime()

            if (timeSinceLastUpdate > interval) {
                // Simulate notification for new tasks assigned to employee
                if (userRole === 'employee') {
                    const newTasks = userTasks.filter((task: any) => {
                        const taskCreated = new Date(task.created_at)
                        return taskCreated > lastUpdateRef.current
                    })

                    newTasks.forEach((task: any) => {
                        onNotification?.({
                            id: Date.now() + Math.random(),
                            type: 'info',
                            title: 'New Task Assigned',
                            message: `You have been assigned a new task: "${task.title}"`,
                            timestamp: new Date().toISOString(),
                            read: false,
                            actionUrl: '/tasks'
                        })
                    })
                }

                lastUpdateRef.current = now
            }
        } catch (error) {
            console.error('Error syncing data:', error)
        }
    }, [userId, userRole, onTaskUpdate, onProjectUpdate, onNotification, interval])

    useEffect(() => {
        // Initial sync
        syncData()

        // Set up polling
        intervalRef.current = setInterval(syncData, interval)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [syncData, interval])

    const forceSync = useCallback(() => {
        syncData()
    }, [syncData])

    return {
        forceSync
    }
}

export default useRealTimeSync
