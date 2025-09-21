import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { RegisterForm } from '../types'
import { Eye, EyeOff, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'react-toastify'

interface ValidationErrors {
  username?: string
  email?: string
  password?: string
  confirmPassword?: string
  first_name?: string
  last_name?: string
  phone?: string
  general?: string
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterForm>({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    bio: '',
    job_title: '',
    department: '',
    phone: ''
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'scrum_master' | 'employee'>('employee')
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [passwordStrength, setPasswordStrength] = useState(0)

  const { register } = useAuth()
  const navigate = useNavigate()

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string): { strength: number; message: string } => {
    let strength = 0
    let message = ''

    if (password.length >= 8) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/\d/.test(password)) strength += 1
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1

    if (strength < 2) message = 'Very weak'
    else if (strength < 3) message = 'Weak'
    else if (strength < 4) message = 'Fair'
    else if (strength < 5) message = 'Good'
    else message = 'Strong'

    return { strength, message }
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores'
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else {
      const passwordValidation = validatePassword(formData.password)
      if (passwordValidation.strength < 3) {
        newErrors.password = 'Password must be stronger (at least 8 characters with uppercase, lowercase, and numbers)'
      }
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    // Name validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required'
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required'
    }

    // Phone validation (optional but if provided, should be valid)
    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name === 'confirmPassword') {
      setConfirmPassword(value)
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }

    // Clear specific field error when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }

    // Update password strength
    if (name === 'password') {
      const validation = validatePassword(value)
      setPasswordStrength(validation.strength)
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
      // Add role to form data and ensure it's properly formatted
      const registrationData = {
        ...formData,
        role: selectedRole,
        confirm_password: confirmPassword // Add confirm password for backend validation
      }

      // Log the role being sent with redacted password for security
      console.log('Selected role for registration:', selectedRole)
      console.log('Submitting registration data:', { ...registrationData, password: '[REDACTED]', confirm_password: '[REDACTED]' })

      // Ensure the role is correctly set in the form data
      if (selectedRole === 'scrum_master') {
        console.log('Registering as scrum master')
      }

      await register(registrationData as any)
      console.log('Registration successful')

      // Show success message and redirect to login page
      toast.success('Registration successful! Redirecting to login...', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })

      // Short delay before redirect to ensure the user sees the message
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err: any) {
      console.error('Registration error:', err)

      // Handle specific error types
      if (err.response && err.response.data) {
        const serverErrors = err.response.data;
        const newErrors: ValidationErrors = {};

        // Map server validation errors to form fields
        Object.entries(serverErrors).forEach(([key, value]) => {
          if (Array.isArray(value) && value.length > 0) {
            newErrors[key as keyof ValidationErrors] = value[0] as string;
          } else if (typeof value === 'string') {
            newErrors[key as keyof ValidationErrors] = value;
          }
        });

        // If we have specific field errors, use them; otherwise use general message
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
        } else {
          const errorMessage = err.message || 'Registration failed. Please try again.'
          setErrors({ general: errorMessage })
        }
      } else {
        const errorMessage = err.message || 'Registration failed. Please try again.'
        setErrors({ general: errorMessage })
      }

      // Clear password fields on error for security
      setFormData(prev => ({
        ...prev,
        password: ''
      }))
      setConfirmPassword('')
      setPasswordStrength(0)
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 2) return 'bg-red-500'
    if (strength < 3) return 'bg-orange-500'
    if (strength < 4) return 'bg-yellow-500'
    if (strength < 5) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 2) return 'Very weak'
    if (strength < 3) return 'Weak'
    if (strength < 4) return 'Fair'
    if (strength < 5) return 'Good'
    return 'Strong'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900">
            Create your TaskFlow account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary/80"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>
        <form className="bg-white shadow-lg rounded-lg p-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Role selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Register as *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`px-4 py-3 rounded-lg text-sm font-semibold border-2 transition-all duration-200 ${selectedRole === 'employee'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  onClick={() => setSelectedRole('employee')}
                >
                  <div className="text-center">
                    <div className="font-medium">Employee</div>
                    <div className="text-xs opacity-75 mt-1">View and update assigned tasks</div>
                  </div>
                </button>
                <button
                  type="button"
                  className={`px-4 py-3 rounded-lg text-sm font-semibold border-2 transition-all duration-200 ${selectedRole === 'scrum_master'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  onClick={() => setSelectedRole('scrum_master')}
                >
                  <div className="text-center">
                    <div className="font-medium">Scrum Master / Admin</div>
                    <div className="text-xs opacity-75 mt-1">Manage projects and assign tasks</div>
                  </div>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none sm:text-sm ${errors.first_name
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  placeholder="First name"
                  value={formData.first_name}
                  onChange={handleChange}
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    {errors.first_name}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none sm:text-sm ${errors.last_name
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  placeholder="Last name"
                  value={formData.last_name}
                  onChange={handleChange}
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    {errors.last_name}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username *
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none sm:text-sm ${errors.username
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    {errors.username}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none sm:text-sm ${errors.email
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className={`appearance-none relative block w-full px-3 py-2 pr-10 border rounded-md focus:outline-none sm:text-sm ${errors.password
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Password strength indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs font-medium ${passwordStrength < 3 ? 'text-red-600' :
                        passwordStrength < 4 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                        {getPasswordStrengthText(passwordStrength)}
                      </span>
                    </div>
                  </div>
                )}

                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password *
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className={`appearance-none relative block w-full px-3 py-2 pr-10 border rounded-md focus:outline-none sm:text-sm ${errors.confirmPassword
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="job_title" className="block text-sm font-medium text-gray-700">
                  Job Title (Optional)
                </label>
                <input
                  id="job_title"
                  name="job_title"
                  type="text"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Job title"
                  value={formData.job_title}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department (Optional)
                </label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Department"
                  value={formData.department}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio (Optional)
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={2}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Tell us about yourself"
                value={formData.bio}
                onChange={handleChange}
              />
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

          <div className="pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-6 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
            <p className="mt-3 text-center text-xs text-gray-500">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register
