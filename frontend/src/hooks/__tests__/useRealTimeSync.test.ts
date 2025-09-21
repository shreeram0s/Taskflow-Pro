import { renderHook, act } from '@testing-library/react'
import { useRealTimeSync } from '../useRealTimeSync'
import { setupMocks, cleanupMocks, generateTasks, generateProjects } from '../../utils/testUtils'

// Mock the API services
jest.mock('../../services/api', () => ({
    taskService: {
        getAllTasks: jest.fn()
    },
    projectService: {
        getAllProjects: jest.fn()
    }
}))

describe('useRealTimeSync', () => {
    beforeEach(() => {
        setupMocks()
        jest.useFakeTimers()
    })

    afterEach(() => {
        cleanupMocks()
        jest.useRealTimers()
    })

    it('calls onTaskUpdate and onProjectUpdate on initial load', async () => {
        const { taskService, projectService } = require('../../services/api')
        const mockTasks = generateTasks(3)
        const mockProjects = generateProjects(2)

        taskService.getAllTasks.mockResolvedValue({ data: mockTasks })
        projectService.getAllProjects.mockResolvedValue({ data: mockProjects })

        const onTaskUpdate = jest.fn()
        const onProjectUpdate = jest.fn()
        const onNotification = jest.fn()

        renderHook(() => useRealTimeSync({
            userId: 1,
            userRole: 'employee',
            onTaskUpdate,
            onProjectUpdate,
            onNotification
        }))

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0))
        })

        expect(onTaskUpdate).toHaveBeenCalledWith(mockTasks)
        expect(onProjectUpdate).toHaveBeenCalledWith(mockProjects)
    })

    it('polls for updates at specified interval', async () => {
        const { taskService, projectService } = require('../../services/api')
        const mockTasks = generateTasks(3)
        const mockProjects = generateProjects(2)

        taskService.getAllTasks.mockResolvedValue({ data: mockTasks })
        projectService.getAllProjects.mockResolvedValue({ data: mockProjects })

        const onTaskUpdate = jest.fn()
        const onProjectUpdate = jest.fn()

        renderHook(() => useRealTimeSync({
            userId: 1,
            userRole: 'employee',
            onTaskUpdate,
            onProjectUpdate,
            interval: 1000
        }))

        // Initial call
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0))
        })

        expect(onTaskUpdate).toHaveBeenCalledTimes(1)

        // Advance timer to trigger polling
        act(() => {
            jest.advanceTimersByTime(1000)
        })

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0))
        })

        expect(onTaskUpdate).toHaveBeenCalledTimes(2)
    })

    it('filters tasks for employee role', async () => {
        const { taskService, projectService } = require('../../services/api')
        const allTasks = generateTasks(5)
        const userTasks = allTasks.slice(0, 3).map(task => ({ ...task, assignee: { id: 1 } }))
        const otherTasks = allTasks.slice(3).map(task => ({ ...task, assignee: { id: 2 } }))
        const allTasksWithAssignees = [...userTasks, ...otherTasks]

        taskService.getAllTasks.mockResolvedValue({ data: allTasksWithAssignees })
        projectService.getAllProjects.mockResolvedValue({ data: [] })

        const onTaskUpdate = jest.fn()

        renderHook(() => useRealTimeSync({
            userId: 1,
            userRole: 'employee',
            onTaskUpdate,
            onProjectUpdate: jest.fn()
        }))

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0))
        })

        expect(onTaskUpdate).toHaveBeenCalledWith(userTasks)
    })

    it('does not filter tasks for scrum master role', async () => {
        const { taskService, projectService } = require('../../services/api')
        const allTasks = generateTasks(5)

        taskService.getAllTasks.mockResolvedValue({ data: allTasks })
        projectService.getAllProjects.mockResolvedValue({ data: [] })

        const onTaskUpdate = jest.fn()

        renderHook(() => useRealTimeSync({
            userId: 1,
            userRole: 'scrum_master',
            onTaskUpdate,
            onProjectUpdate: jest.fn()
        }))

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0))
        })

        expect(onTaskUpdate).toHaveBeenCalledWith(allTasks)
    })

    it('handles API errors gracefully', async () => {
        const { taskService, projectService } = require('../../services/api')

        taskService.getAllTasks.mockRejectedValue(new Error('API Error'))
        projectService.getAllProjects.mockRejectedValue(new Error('API Error'))

        const onTaskUpdate = jest.fn()
        const onProjectUpdate = jest.fn()

        renderHook(() => useRealTimeSync({
            userId: 1,
            userRole: 'employee',
            onTaskUpdate,
            onProjectUpdate
        }))

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0))
        })

        // Should not call callbacks on error
        expect(onTaskUpdate).not.toHaveBeenCalled()
        expect(onProjectUpdate).not.toHaveBeenCalled()
    })

    it('provides forceSync function', () => {
        const { taskService, projectService } = require('../../services/api')
        const mockTasks = generateTasks(3)
        const mockProjects = generateProjects(2)

        taskService.getAllTasks.mockResolvedValue({ data: mockTasks })
        projectService.getAllProjects.mockResolvedValue({ data: mockProjects })

        const onTaskUpdate = jest.fn()
        const onProjectUpdate = jest.fn()

        const { result } = renderHook(() => useRealTimeSync({
            userId: 1,
            userRole: 'employee',
            onTaskUpdate,
            onProjectUpdate
        }))

        expect(typeof result.current.forceSync).toBe('function')

        act(() => {
            result.current.forceSync()
        })

        expect(onTaskUpdate).toHaveBeenCalledWith(mockTasks)
        expect(onProjectUpdate).toHaveBeenCalledWith(mockProjects)
    })

    it('cleans up interval on unmount', () => {
        const { taskService, projectService } = require('../../services/api')

        taskService.getAllTasks.mockResolvedValue({ data: [] })
        projectService.getAllProjects.mockResolvedValue({ data: [] })

        const { unmount } = renderHook(() => useRealTimeSync({
            userId: 1,
            userRole: 'employee',
            onTaskUpdate: jest.fn(),
            onProjectUpdate: jest.fn(),
            interval: 1000
        }))

        unmount()

        // Advance timer - should not cause any issues
        act(() => {
            jest.advanceTimersByTime(2000)
        })
    })
})
