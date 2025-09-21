import React from 'react'
import { render, screen } from '../../utils/testUtils'
import Dashboard from '../Dashboard'
import { mockUser, mockScrumMaster } from '../../utils/testUtils'

// Mock the dashboard components
jest.mock('../EmployeeDashboard', () => {
    return function MockEmployeeDashboard({ user }: { user: any }) {
        return <div data-testid="employee-dashboard">Employee Dashboard for {user.first_name}</div>
    }
})

jest.mock('../ScrumMasterDashboard', () => {
    return function MockScrumMasterDashboard({ user }: { user: any }) {
        return <div data-testid="scrum-master-dashboard">Scrum Master Dashboard for {user.first_name}</div>
    }
})

describe('Dashboard', () => {
    it('renders Employee Dashboard for employee role', () => {
        render(<Dashboard user={mockUser} />)

        expect(screen.getByTestId('employee-dashboard')).toBeInTheDocument()
        expect(screen.getByText('Employee Dashboard for Test')).toBeInTheDocument()
        expect(screen.queryByTestId('scrum-master-dashboard')).not.toBeInTheDocument()
    })

    it('renders Scrum Master Dashboard for scrum_master role', () => {
        render(<Dashboard user={mockScrumMaster} />)

        expect(screen.getByTestId('scrum-master-dashboard')).toBeInTheDocument()
        expect(screen.getByText('Scrum Master Dashboard for Scrum')).toBeInTheDocument()
        expect(screen.queryByTestId('employee-dashboard')).not.toBeInTheDocument()
    })

    it('renders fallback for unknown role', () => {
        const unknownUser = { ...mockUser, role: 'unknown' as any }
        render(<Dashboard user={unknownUser} />)

        expect(screen.getByText('Welcome to TaskFlow')).toBeInTheDocument()
        expect(screen.getByText('Your account is being set up. Please contact your administrator.')).toBeInTheDocument()
    })
})
