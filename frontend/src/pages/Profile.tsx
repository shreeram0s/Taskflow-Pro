import React, { useState } from 'react'
import { User } from '../types'
import { User as UserIcon, Mail, Phone, Briefcase, Building } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface ProfileProps {
  user: User
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const { changePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match')
      return
    }
    try {
      setLoading(true)
      await changePassword({ current_password: currentPassword, new_password: newPassword })
      setMessage('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(err.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="mt-2 text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center">
                <UserIcon className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.first_name} {user.last_name}
                </h2>
                <p className="text-gray-600">{user.email}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {user.role.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-900">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-gray-900">{user.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Work Information</h3>
                <div className="space-y-3">
                  {user.job_title && (
                    <div className="flex items-center">
                      <Briefcase className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-gray-900">{user.job_title}</span>
                    </div>
                  )}
                  {user.department && (
                    <div className="flex items-center">
                      <Building className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-gray-900">{user.department}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {user.bio && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Bio</h3>
                <p className="text-gray-700">{user.bio}</p>
              </div>
            )}

            {/* Change Password */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input id="current_password" type="password" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                </div>
                <div>
                  <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">New Password</label>
                  <input id="new_password" type="password" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                </div>
                <div>
                  <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <input id="confirm_password" type="password" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
                {message && <div className="rounded-md bg-green-50 p-3 text-green-700 text-sm">{message}</div>}
                {error && <div className="rounded-md bg-red-50 p-3 text-red-700 text-sm">{error}</div>}
                <div>
                  <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Saving...' : 'Change Password'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
