import { taskService, analyticsService, authService } from '../api'
import { setupMocks, cleanupMocks, mockUser, mockTask, mockProject } from '../../utils/testUtils'

// Mock axios
jest.mock('axios', () => ({
    create: jest.fn(() => ({
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
        interceptors: {
            request: { use: jest.fn() },
            response: { use: jest.fn() }
        }
    }))
}))

describe('API Services', () => {
    beforeEach(() => {
        setupMocks()
    })

    afterEach(() => {
        cleanupMocks()
    })

    describe('taskService', () => {
        it('getAllTasks returns tasks data', async () => {
            const mockTasks = [mockTask]
            const mockAxios = require('axios').create()
            mockAxios.get.mockResolvedValue({ data: mockTasks })

            const result = await taskService.getAllTasks()
            expect(result.data).toEqual(mockTasks)
        })

        it('getAllTasks handles errors gracefully', async () => {
            const mockAxios = require('axios').create()
            mockAxios.get.mockRejectedValue(new Error('API Error'))

            const result = await taskService.getAllTasks()
            expect(result.data).toEqual([])
        })

        it('createTask calls API with correct data', async () => {
            const mockAxios = require('axios').create()
            mockAxios.post.mockResolvedValue({ data: mockTask })

            const taskData = {
                title: 'New Task',
                description: 'Task description',
                priority: 'medium' as const,
                due_date: new Date().toISOString()
            }

            await taskService.createTask(1, taskData)
            expect(mockAxios.post).toHaveBeenCalledWith('/projects/1/tasks/', taskData)
        })

        it('updateTask calls API with correct data', async () => {
            const mockAxios = require('axios').create()
            mockAxios.patch.mockResolvedValue({ data: mockTask })

            const updateData = { status: 'in-progress' as const }
            await taskService.updateTask(1, updateData)
            expect(mockAxios.patch).toHaveBeenCalledWith('/tasks/1/', updateData)
        })

        it('changeStatus calls API with correct data', async () => {
            const mockAxios = require('axios').create()
            mockAxios.post.mockResolvedValue({ data: mockTask })

            await taskService.changeStatus(1, 'done')
            expect(mockAxios.post).toHaveBeenCalledWith('/tasks/1/change_status/', { status: 'done' })
        })
    })

    describe('analyticsService', () => {
        it('getDashboardAnalytics returns fallback data on error', async () => {
            const mockAxios = require('axios').create()
            mockAxios.get.mockRejectedValue(new Error('API Error'))

            const result = await analyticsService.getDashboardAnalytics()
            expect(result.data).toEqual({
                task_stats: { total: 0, completed: 0, in_progress: 0, todo: 0, review: 0 },
                completion_percentage: 0,
                recent_activities: [],
                productivity: { tasks_completed_recently: 0, days_analyzed: 7 },
                project_progress: []
            })
        })

        it('getTaskAnalytics returns fallback data on error', async () => {
            const mockAxios = require('axios').create()
            mockAxios.get.mockRejectedValue(new Error('API Error'))

            const result = await analyticsService.getTaskAnalytics(30)
            expect(result.data).toEqual({
                status_changes: [],
                completion_by_priority: {},
                avg_completion_time: 0
            })
        })
    })

    describe('authService', () => {
        it('login calls API with credentials', async () => {
            const mockAxios = require('axios').create()
            mockAxios.post.mockResolvedValue({ data: { access: 'token', refresh: 'refresh' } })

            const credentials = { username: 'test', password: 'password' }
            await authService.login(credentials)
            expect(mockAxios.post).toHaveBeenCalledWith('/token/', credentials)
        })

        it('register calls API with user data', async () => {
            const mockAxios = require('axios').create()
            mockAxios.post.mockResolvedValue({ data: mockUser })

            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                first_name: 'Test',
                last_name: 'User',
                role: 'employee' as const
            }

            await authService.register(userData)
            expect(mockAxios.post).toHaveBeenCalledWith('/users/register/', userData)
        })

        it('getCurrentUser calls API for user profile', async () => {
            const mockAxios = require('axios').create()
            mockAxios.get.mockResolvedValue({ data: mockUser })

            const result = await authService.getCurrentUser()
            expect(mockAxios.get).toHaveBeenCalledWith('/users/profile/')
            expect(result.data).toEqual(mockUser)
        })

        it('logout clears localStorage', async () => {
            const { mockLocalStorage } = require('../../utils/testUtils')

            await authService.logout()

            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('access')
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refresh')
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user')
        })
    })
})
