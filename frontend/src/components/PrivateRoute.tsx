import React from 'react'
import { Navigate } from 'react-router-dom'

interface PrivateRouteProps {
  children: React.ReactNode
  isAuthenticated: boolean
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, isAuthenticated }) => {
  console.log('PrivateRoute - isAuthenticated:', isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

export default PrivateRoute
