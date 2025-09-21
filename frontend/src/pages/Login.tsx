import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoginForm } from '../types'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

interface LoginErrors {
  username?: string
  password?: string
  general?: string
}

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginForm>({
    username: '',
    password: '',
    selectedRole: 'employee'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'scrum_master' | 'employee'>('employee')

  // Update formData when role changes
  const handleRoleChange = (role: 'scrum_master' | 'employee') => {
    setSelectedRole(role)
    setFormData(prev => ({
      ...prev,
      selectedRole: role
    }))
  }
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<LoginErrors>({})
  const [rememberMe, setRememberMe] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {}

    if (!formData.username.trim()) {
      newErrors.username = 'Username or email is required'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear specific field error when user starts typing
    if (errors[name as keyof LoginErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const me = await login(formData)

      // Verify we have valid user data
      if (!me || !me.role) {
        throw new Error('Invalid user data received from server')
      }

      // Redirect based on actual server role; fallback to selection if missing
      const role = me.role || selectedRole
      console.log('Redirecting based on role:', role)

      // Redirect based on role
      if (role === 'scrum_master') {
        console.log('Redirecting to scrum master dashboard')
        navigate('/scrum-dashboard')
      } else {
        console.log('Redirecting to employee dashboard')
        navigate('/employee-dashboard')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      const errorMessage = err.message || 'Login failed. Please try again.'
      setErrors({ general: errorMessage })

      // Clear password on error for security
      setFormData(prev => ({
        ...prev,
        password: ''
      }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">T</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to TaskFlow
          </h2>
          <p className="text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Role selection for UI targeting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Login as</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`px-3 py-2 rounded-md text-sm font-semibold border ${selectedRole === 'employee' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300'}`}
                    onClick={() => handleRoleChange('employee')}
                  >
                    Employee
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-2 rounded-md text-sm font-semibold border ${selectedRole === 'scrum_master' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300'}`}
                    onClick={() => handleRoleChange('scrum_master')}
                  >
                    Scrum Master / Admin
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username or Email
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className={`input w-full ${errors.username
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  placeholder="Enter your username or email"
                  value={formData.username}
                  onChange={handleChange}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.username}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className={`input w-full pr-10 ${errors.password
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            {errors.general && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {errors.general}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-md text-white font-semibold bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-green-700 hover:text-green-600 underline"
              >
                Create your TaskFlow account
              </Link>
            </p>
          </div>
        </div>

        {/* Demo credentials removed for real authentication */}
      </div>
    </div>
  )
}

export default Login
