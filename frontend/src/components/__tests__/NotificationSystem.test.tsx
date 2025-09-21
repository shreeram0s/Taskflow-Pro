import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../utils/testUtils'
import NotificationSystem from '../NotificationSystem'

describe('NotificationSystem', () => {
    it('renders notification bell icon', () => {
        render(<NotificationSystem userId={1} />)

        expect(screen.getByRole('button')).toBeInTheDocument()
        expect(screen.getByTestId('bell-icon')).toBeInTheDocument()
    })

    it('shows unread count when there are unread notifications', async () => {
        render(<NotificationSystem userId={1} />)

        await waitFor(() => {
            expect(screen.getByText('3')).toBeInTheDocument() // Mock unread count
        })
    })

    it('opens dropdown when bell is clicked', async () => {
        render(<NotificationSystem userId={1} />)

        const bellButton = screen.getByRole('button')
        fireEvent.click(bellButton)

        await waitFor(() => {
            expect(screen.getByText('Notifications')).toBeInTheDocument()
        })
    })

    it('displays notifications in dropdown', async () => {
        render(<NotificationSystem userId={1} />)

        const bellButton = screen.getByRole('button')
        fireEvent.click(bellButton)

        await waitFor(() => {
            expect(screen.getByText('New Task Assigned')).toBeInTheDocument()
            expect(screen.getByText('Task Completed')).toBeInTheDocument()
            expect(screen.getByText('Deadline Approaching')).toBeInTheDocument()
        })
    })

    it('allows marking notifications as read', async () => {
        render(<NotificationSystem userId={1} />)

        const bellButton = screen.getByRole('button')
        fireEvent.click(bellButton)

        await waitFor(() => {
            const markAsReadButtons = screen.getAllByTitle('Mark as read')
            expect(markAsReadButtons).toHaveLength(2) // 2 unread notifications
        })
    })

    it('allows deleting notifications', async () => {
        render(<NotificationSystem userId={1} />)

        const bellButton = screen.getByRole('button')
        fireEvent.click(bellButton)

        await waitFor(() => {
            const deleteButtons = screen.getAllByTitle('Delete')
            expect(deleteButtons).toHaveLength(3) // 3 notifications
        })
    })

    it('shows mark all as read button when there are unread notifications', async () => {
        render(<NotificationSystem userId={1} />)

        const bellButton = screen.getByRole('button')
        fireEvent.click(bellButton)

        await waitFor(() => {
            expect(screen.getByText('Mark all as read')).toBeInTheDocument()
        })
    })

    it('closes dropdown when clicking outside', async () => {
        render(<NotificationSystem userId={1} />)

        const bellButton = screen.getByRole('button')
        fireEvent.click(bellButton)

        await waitFor(() => {
            expect(screen.getByText('Notifications')).toBeInTheDocument()
        })

        // Click outside
        fireEvent.click(document.body)

        await waitFor(() => {
            expect(screen.queryByText('Notifications')).not.toBeInTheDocument()
        })
    })
})
