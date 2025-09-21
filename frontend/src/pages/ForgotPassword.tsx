import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { authService } from '../services/api'

interface ResetErrors {
    email?: string
    password?: string
    confirmPassword?: string
    general?: string
}

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<ResetErrors>({})
    const [step, setStep] = useState<'request' | 'reset'>('request')
    const [token, setToken] = useState('')
    const [success, setSuccess] = useState(false)

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

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email.trim()) {
            setErrors({ email: 'Email is required' })
            return
        }

        if (!validateEmail(email)) {
            setErrors({ email: 'Please enter a valid email address' })
            return
        }

        setIsLoading(true)
        setErrors({})

        try {
            await authService.passwordReset({ email })
            setSuccess(true)
        } catch (err: any) {
            setErrors({ general: err.message || 'Failed to send reset email' })
        } finally {
            setIsLoading(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()

        const newErrors: ResetErrors = {}

        if (!newPassword) {
            newErrors.password = 'Password is required'
        } else {
            const validation = validatePassword(newPassword)
            if (validation.strength < 3) {
                newErrors.password = 'Password must be stronger (at least 8 characters with uppercase, lowercase, and numbers)'
            }
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password'
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        setIsLoading(true)
        setErrors({})

        try {
            await authService.passwordResetConfirm({
                token,
                new_password: newPassword,
                confirm_password: confirmPassword
            })
            setSuccess(true)
        } catch (err: any) {
            setErrors({ general: err.message || 'Failed to reset password' })
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

    // Check if we have a token in URL params
    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const tokenParam = urlParams.get('token')
        if (tokenParam) {
            setToken(tokenParam)
            setStep('reset')
        }
    }, [])

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <div className="mx-auto h-12 w-12 bg-green-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-6 w-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            {step === 'request' ? 'Check your email' : 'Password reset successful'}
                        </h2>
                        <p className="text-gray-600">
                            {step === 'request'
                                ? 'We\'ve sent you a password reset link. Please check your email and click the link to reset your password.'
                                : 'Your password has been successfully reset. You can now log in with your new password.'
                            }
                        </p>
                        <div className="mt-6">
                            <Link
                                to="/login"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                        <span className="text-white font-bold text-xl">T</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {step === 'request' ? 'Reset your password' : 'Set new password'}
                    </h2>
                    <p className="text-gray-600">
                        {step === 'request'
                            ? 'Enter your email address and we\'ll send you a link to reset your password.'
                            : 'Enter your new password below.'
                        }
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-soft p-8">
                    {step === 'request' ? (
                        <form className="space-y-6" onSubmit={handleRequestReset}>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className={`input w-full ${errors.email
                                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                        }`}
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="h-4 w-4 mr-1" />
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {errors.general && (
                                <div className="rounded-md bg-red-50 p-4">
                                    <div className="text-sm text-red-700 flex items-center">
                                        <AlertCircle className="h-4 w-4 mr-2" />
                                        {errors.general}
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full px-4 py-3 rounded-md text-white font-semibold bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                        </form>
                    ) : (
                        <form className="space-y-6" onSubmit={handleResetPassword}>
                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="newPassword"
                                        name="newPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        className={`input w-full pr-10 ${errors.password
                                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                            }`}
                                        placeholder="Enter your new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
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

                                {/* Password strength indicator */}
                                {newPassword && (
                                    <div className="mt-2">
                                        <div className="flex items-center space-x-2">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(validatePassword(newPassword).strength)}`}
                                                    style={{ width: `${(validatePassword(newPassword).strength / 5) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className={`text-xs font-medium ${validatePassword(newPassword).strength < 3 ? 'text-red-600' :
                                                    validatePassword(newPassword).strength < 4 ? 'text-yellow-600' : 'text-green-600'
                                                }`}>
                                                {getPasswordStrengthText(validatePassword(newPassword).strength)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="h-4 w-4 mr-1" />
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        className={`input w-full pr-10 ${errors.confirmPassword
                                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                            }`}
                                        placeholder="Confirm your new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="h-4 w-4 mr-1" />
                                        {errors.confirmPassword}
                                    </p>
                                )}
                            </div>

                            {errors.general && (
                                <div className="rounded-md bg-red-50 p-4">
                                    <div className="text-sm text-red-700 flex items-center">
                                        <AlertCircle className="h-4 w-4 mr-2" />
                                        {errors.general}
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full px-4 py-3 rounded-md text-white font-semibold bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Resetting...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="font-semibold text-blue-700 hover:text-blue-600 underline flex items-center justify-center"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ForgotPassword
