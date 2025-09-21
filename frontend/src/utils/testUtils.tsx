import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { NotificationProvider } from '../context/NotificationContext'

// Mock user data for testing
export const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'employee' as const,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
}

export const mockScrumMaster = {
    id: 2,
    username: 'scrummaster',
    email: 'scrum@example.com',
    first_name: 'Scrum',
    last_name: 'Master',
    role: 'scrum_master' as const,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
}

export const mockTask = {
    id: 1,
    title: 'Test Task',
    description: 'This is a test task',
    status: 'todo' as const,
    priority: 'medium' as const,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignee: mockUser,
    created_by: mockScrumMaster,
    project: {
        id: 1,
        name: 'Test Project',
        description: 'A test project',
        status: 'active' as const,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
}

export const mockProject = {
    id: 1,
    name: 'Test Project',
    description: 'A test project for testing purposes',
    status: 'active' as const,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: mockScrumMaster
}

// Custom render function that includes providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <NotificationProvider>
                    {children}
                </NotificationProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}

const customRender = (
    ui: React.ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Mock API functions
export const mockApiCalls = {
    login: jest.fn(),
    register: jest.fn(),
    getCurrentUser: jest.fn(),
    getAllTasks: jest.fn(),
    getAllProjects: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    changeStatus: jest.fn(),
    getDashboardAnalytics: jest.fn()
}

// Mock localStorage
export const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
}

// Setup mocks
export const setupMocks = () => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
    })

    // Mock fetch
    global.fetch = jest.fn()

    // Mock console methods to reduce noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => { })
    jest.spyOn(console, 'warn').mockImplementation(() => { })
}

// Cleanup mocks
export const cleanupMocks = () => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
}

// Test data generators
export const generateTasks = (count: number) => {
    return Array.from({ length: count }, (_, index) => ({
        ...mockTask,
        id: index + 1,
        title: `Task ${index + 1}`,
        status: ['todo', 'in-progress', 'review', 'done'][index % 4] as any,
        priority: ['low', 'medium', 'high', 'urgent'][index % 4] as any
    }))
}

export const generateProjects = (count: number) => {
    return Array.from({ length: count }, (_, index) => ({
        ...mockProject,
        id: index + 1,
        name: `Project ${index + 1}`,
        status: ['active', 'completed', 'on-hold'][index % 3] as any
    }))
}

export const generateUsers = (count: number) => {
    return Array.from({ length: count }, (_, index) => ({
        ...mockUser,
        id: index + 1,
        username: `user${index + 1}`,
        email: `user${index + 1}@example.com`,
        first_name: `User${index + 1}`,
        last_name: 'Test',
        role: index % 2 === 0 ? 'employee' : 'scrum_master' as any
    }))
}

// Utility functions for testing
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const createMockEvent = (type: string, target: any = {}) => ({
    type,
    target,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn()
})

export const createMockFormEvent = (formData: Record<string, any>) => ({
    preventDefault: jest.fn(),
    target: {
        elements: Object.keys(formData).reduce((acc, key) => {
            acc[key] = { value: formData[key] }
            return acc
        }, {} as any)
    }
})

// Re-export everything from testing-library
export * from '@testing-library/react'
export { customRender as render }
