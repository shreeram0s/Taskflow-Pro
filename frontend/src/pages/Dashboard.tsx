import React from 'react'
import { User } from '../types'
import EmployeeDashboard from './EmployeeDashboard'
import ScrumMasterDashboard from './ScrumMasterDashboard'

interface DashboardProps {
  user: User
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  // Route to appropriate dashboard based on user role
  if (user.role === 'employee') {
    return <EmployeeDashboard user={user} />
  } else if (user.role === 'scrum_master') {
    return <ScrumMasterDashboard user={user} />
  }

  // Fallback for unknown roles
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to TaskFlow</h1>
        <p className="text-gray-600">Your account is being set up. Please contact your administrator.</p>
      </div>
    </div>
  )
}

export default Dashboard
