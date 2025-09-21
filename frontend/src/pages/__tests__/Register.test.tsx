import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../utils/testUtils'
import Register from '../Register'
import { setupMocks, cleanupMocks, createMockFormEvent } from '../../utils/testUtils'

// Mock the auth context
const mockRegister = jest.fn()
jest.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        register: mockRegister
    })
}))

// Mock react-router-dom
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}))

describe('Register', () => {
    beforeEach(() => {
        setupMocks()
        mockRegister.mockClear()
        mockNavigate.mockClear()
    })

    afterEach(() => {
        cleanupMocks()
    })

    it('renders registration form', () => {
        render(<Register />)

        expect(screen.getByText('Create your TaskFlow account')).toBeInTheDocument()
        expect(screen.getByLabelText('First Name *')).toBeInTheDocument()
        expect(screen.getByLabelText('Last Name *')).toBeInTheDocument()
        expect(screen.getByLabelText('Username *')).toBeInTheDocument()
        expect(screen.getByLabelText('Email Address *')).toBeInTheDocument()
        expect(screen.getByLabelText('Password *')).toBeInTheDocument()
        expect(screen.getByLabelText('Confirm Password *')).toBeInTheDocument()
    })

    it('allows role selection', () => {
        render(<Register />)

        const employeeButton = screen.getByText('Employee')
        const scrumMasterButton = screen.getByText('Scrum Master / Admin')

        expect(employeeButton).toBeInTheDocument()
        expect(scrumMasterButton).toBeInTheDocument()

        fireEvent.click(scrumMasterButton)
        expect(scrumMasterButton).toHaveClass('bg-blue-600')
    })

    it('validates required fields', async () => {
        render(<Register />)

        const submitButton = screen.getByText('Create account')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText('First name is required')).toBeInTheDocument()
            expect(screen.getByText('Last name is required')).toBeInTheDocument()
            expect(screen.getByText('Username is required')).toBeInTheDocument()
            expect(screen.getByText('Email is required')).toBeInTheDocument()
            expect(screen.getByText('Password is required')).toBeInTheDocument()
            expect(screen.getByText('Please confirm your password')).toBeInTheDocument()
        })
    })

    it('validates email format', async () => {
        render(<Register />)

        const emailInput = screen.getByLabelText('Email Address *')
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

        const submitButton = screen.getByText('Create account')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
        })
    })

    it('validates password strength', async () => {
        render(<Register />)

        const passwordInput = screen.getByLabelText('Password *')
        fireEvent.change(passwordInput, { target: { value: 'weak' } })

        const submitButton = screen.getByText('Create account')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText('Password must be stronger (at least 8 characters with uppercase, lowercase, and numbers)')).toBeInTheDocument()
        })
    })

    it('validates password confirmation', async () => {
        render(<Register />)

        const passwordInput = screen.getByLabelText('Password *')
        const confirmPasswordInput = screen.getByLabelText('Confirm Password *')

        fireEvent.change(passwordInput, { target: { value: 'Password123' } })
        fireEvent.change(confirmPasswordInput, { target: { value: 'Different123' } })

        const submitButton = screen.getByText('Create account')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
        })
    })

    it('submits form with valid data', async () => {
        mockRegister.mockResolvedValue({})

        render(<Register />)

        // Fill in form
        fireEvent.change(screen.getByLabelText('First Name *'), { target: { value: 'John' } })
        fireEvent.change(screen.getByLabelText('Last Name *'), { target: { value: 'Doe' } })
        fireEvent.change(screen.getByLabelText('Username *'), { target: { value: 'johndoe' } })
        fireEvent.change(screen.getByLabelText('Email Address *'), { target: { value: 'john@example.com' } })
        fireEvent.change(screen.getByLabelText('Password *'), { target: { value: 'Password123' } })
        fireEvent.change(screen.getByLabelText('Confirm Password *'), { target: { value: 'Password123' } })

        const submitButton = screen.getByText('Create account')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalledWith({
                first_name: 'John',
                last_name: 'Doe',
                username: 'johndoe',
                email: 'john@example.com',
                password: 'Password123',
                bio: '',
                job_title: '',
                department: '',
                phone: '',
                role: 'employee'
            })
        })
    })

    it('shows loading state during submission', async () => {
        mockRegister.mockImplementation(() => new Promise(() => { })) // Never resolves

        render(<Register />)

        // Fill in form
        fireEvent.change(screen.getByLabelText('First Name *'), { target: { value: 'John' } })
        fireEvent.change(screen.getByLabelText('Last Name *'), { target: { value: 'Doe' } })
        fireEvent.change(screen.getByLabelText('Username *'), { target: { value: 'johndoe' } })
        fireEvent.change(screen.getByLabelText('Email Address *'), { target: { value: 'john@example.com' } })
        fireEvent.change(screen.getByLabelText('Password *'), { target: { value: 'Password123' } })
        fireEvent.change(screen.getByLabelText('Confirm Password *'), { target: { value: 'Password123' } })

        const submitButton = screen.getByText('Create account')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText('Creating account...')).toBeInTheDocument()
        })
    })

    it('handles registration errors', async () => {
        mockRegister.mockRejectedValue(new Error('Registration failed'))

        render(<Register />)

        // Fill in form
        fireEvent.change(screen.getByLabelText('First Name *'), { target: { value: 'John' } })
        fireEvent.change(screen.getByLabelText('Last Name *'), { target: { value: 'Doe' } })
        fireEvent.change(screen.getByLabelText('Username *'), { target: { value: 'johndoe' } })
        fireEvent.change(screen.getByLabelText('Email Address *'), { target: { value: 'john@example.com' } })
        fireEvent.change(screen.getByLabelText('Password *'), { target: { value: 'Password123' } })
        fireEvent.change(screen.getByLabelText('Confirm Password *'), { target: { value: 'Password123' } })

        const submitButton = screen.getByText('Create account')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText('Registration failed')).toBeInTheDocument()
        })
    })
})
