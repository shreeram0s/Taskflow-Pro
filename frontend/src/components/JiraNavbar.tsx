import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { User } from '../types'
import {
    Search,
    Bell,
    Settings,
    User as UserIcon,
    Plus,
    Grid3X3,
    FolderOpen,
    BarChart3,
    HelpCircle,
    ChevronDown
} from 'lucide-react'

interface JiraNavbarProps {
    user: User
}

const JiraNavbar: React.FC<JiraNavbarProps> = ({ user }) => {
    const location = useLocation()
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showCreateMenu, setShowCreateMenu] = useState(false)

    const navigation = [
        { name: 'Projects', href: '/projects', icon: FolderOpen, current: location.pathname === '/projects' },
        { name: 'Tasks', href: '/tasks', icon: Grid3X3, current: location.pathname === '/tasks' },
        { name: 'Analytics', href: '/analytics', icon: BarChart3, current: location.pathname === '/analytics' }
    ]

    const createOptions = [
        { name: 'Create Issue', href: '#', icon: Plus },
        { name: 'Create Project', href: '#', icon: FolderOpen },
        { name: 'Create Epic', href: '#', icon: BarChart3 }
    ]

    return (
        <nav className="bg-white border-b border-gray-200">
            <div className="px-6 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo and Navigation */}
                    <div className="flex items-center space-x-8">
                        {/* Logo */}
                        <Link to="/projects" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                                <span className="text-white font-bold text-sm">T</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">TaskFlow</span>
                        </Link>

                        {/* Main Navigation */}
                        <div className="flex items-center space-x-1">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${item.current
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                        }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    <span>{item.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Search and Actions */}
                    <div className="flex items-center space-x-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search issues, projects, people..."
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Create Button */}
                        <div className="relative">
                            <button
                                onClick={() => setShowCreateMenu(!showCreateMenu)}
                                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="text-sm">Create</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {showCreateMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                                    <div className="py-1">
                                        {createOptions.map((option, index) => (
                                            <a
                                                key={index}
                                                href={option.href}
                                                className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <option.icon className="w-4 h-4" />
                                                <span>{option.name}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Notifications */}
                        <button className="relative p-2 text-gray-600 hover:text-gray-900">
                            <Bell className="w-5 h-5" />
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
                        </button>

                        {/* Help */}
                        <button className="p-2 text-gray-600 hover:text-gray-900">
                            <HelpCircle className="w-5 h-5" />
                        </button>

                        {/* Settings */}
                        <button className="p-2 text-gray-600 hover:text-gray-900">
                            <Settings className="w-5 h-5" />
                        </button>

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-100 rounded-md"
                            >
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                    <UserIcon className="w-4 h-4 text-gray-600" />
                                </div>
                                <span className="text-sm font-medium">{user.first_name}</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                                    <div className="py-1">
                                        <div className="px-4 py-2 border-b border-gray-200">
                                            <p className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                        <a
                                            href="#"
                                            className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <UserIcon className="w-4 h-4" />
                                            <span>Profile</span>
                                        </a>
                                        <a
                                            href="#"
                                            className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <Settings className="w-4 h-4" />
                                            <span>Settings</span>
                                        </a>
                                        <div className="border-t border-gray-200">
                                            <a
                                                href="#"
                                                className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <span>Sign out</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default JiraNavbar
