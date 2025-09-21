import React from 'react'
import { render, screen, waitFor } from '../../utils/testUtils'
import ProgressTracker from '../ProgressTracker'
import { mockUser, generateTasks, generateProjects, setupMocks, cleanupMocks } from '../../utils/testUtils'

// Mock the API services
jest.mock('../../services/api', () => ({
    taskService: {
        getAllTasks: jest.fn()
    },
    projectService: {
        getAllProjects: jest.fn()
    }
}))

describe('ProgressTracker', () => {
    beforeEach(() => {
        setupMocks()
    })

    afterEach(() => {
        cleanupMocks()
    })

    it('renders loading state initially', () => {
        const { taskService, projectService } = require('../../services/api')
        taskService.getAllTasks.mockImplementation(() => new Promise(() => { })) // Never resolves
        projectService.getAllProjects.mockImplementation(() => new Promise(() => { }))

        render(<ProgressTracker user={mockUser} />)

        expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
    })

    it('renders progress data when loaded', async () => {
        const { taskService, projectService } = require('../../services/api')
        const mockTasks = generateTasks(5)
        const mockProjects = generateProjects(2)

        taskService.getAllTasks.mockResolvedValue({ data: mockTasks })
        projectService.getAllProjects.mockResolvedValue({ data: mockProjects })

        render(<ProgressTracker user={mockUser} />)

        await waitFor(() => {
            expect(screen.getByText('Total Tasks')).toBeInTheDocument()
            expect(screen.getByText('Completed')).toBeInTheDocument()
            expect(screen.getByText('In Progress')).toBeInTheDocument()
            expect(screen.getByText('Completion Rate')).toBeInTheDocument()
        })
    })

    it('renders error state when API fails', async () => {
        const { taskService, projectService } = require('../../services/api')
        taskService.getAllTasks.mockRejectedValue(new Error('API Error'))
        projectService.getAllProjects.mockRejectedValue(new Error('API Error'))

        render(<ProgressTracker user={mockUser} />)

        await waitFor(() => {
            expect(screen.getByText('Failed to load progress data')).toBeInTheDocument()
            expect(screen.getByText('Try Again')).toBeInTheDocument()
        })
    })

    it('calculates progress metrics correctly', async () => {
        const { taskService, projectService } = require('../../services/api')
        const mockTasks = [
            { ...mockUser, id: 1, status: 'done' },
            { ...mockUser, id: 2, status: 'in-progress' },
            { ...mockUser, id: 3, status: 'todo' }
        ].map((assignee, index) => ({
            id: index + 1,
            title: `Task ${index + 1}`,
            status: assignee.status,
            assignee,
            due_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }))

        taskService.getAllTasks.mockResolvedValue({ data: mockTasks })
        projectService.getAllProjects.mockResolvedValue({ data: [] })

        render(<ProgressTracker user={mockUser} />)

        await waitFor(() => {
            expect(screen.getByText('3')).toBeInTheDocument() // Total tasks
            expect(screen.getByText('1')).toBeInTheDocument() // Completed tasks
            expect(screen.getByText('1')).toBeInTheDocument() // In progress tasks
        })
    })
})
