import React from 'react'
import { useAuth } from '../context/AuthContext'

const AuthDebug: React.FC = () => {
    if (!(import.meta as any).env?.VITE_SHOW_AUTH_DEBUG) {
        return null
    }
    const { user, isAuthenticated, loading, error } = useAuth()

    return (
        <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm z-50">
            <h3 className="font-bold text-sm mb-2">Auth Debug</h3>
            <div className="text-xs space-y-1">
                <div><strong>Loading:</strong> {loading ? 'true' : 'false'}</div>
                <div><strong>Authenticated:</strong> {isAuthenticated ? 'true' : 'false'}</div>
                <div><strong>User:</strong> {user ? user.username : 'null'}</div>
                <div><strong>Error:</strong> {error || 'none'}</div>
                <div><strong>Local Storage:</strong></div>
                <div className="ml-2">
                    <div>Access: {localStorage.getItem('access') ? 'exists' : 'missing'}</div>
                    <div>Refresh: {localStorage.getItem('refresh') ? 'exists' : 'missing'}</div>
                    <div>User: {localStorage.getItem('user') ? 'exists' : 'missing'}</div>
                </div>
            </div>
        </div>
    )
}

export default AuthDebug
