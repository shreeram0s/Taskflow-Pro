import React, { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { ThemeProvider } from './context/ThemeContext'
import './App.css'

// Import pages
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
// Jira-like demo pages are deprecated for TaskFlow
import Projects from './pages/Projects'
import Tasks from './pages/Tasks'
import Analytics from './pages/Analytics'
import Profile from './pages/Profile'
import TaskDetail from './components/TaskDetail'
import ProjectDetail from './components/ProjectDetail'
// Removed TestPage from default app flow
import AuthDebug from './components/AuthDebug'
import CreateIssueModal from './components/CreateIssueModal'
import IssueDetailModal from './components/IssueDetailModal'

// Import components
import Navbar from './components/Navbar'
// Removed JiraNavbar usage from app flow
import PrivateRoute from './components/PrivateRoute'

function AppContent() {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()
  // Remove demo issue modal state

  console.log('AppContent render - loading:', loading, 'isAuthenticated:', isAuthenticated, 'user:', user)

  if (loading) {
    console.log('Showing loading spinner')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  console.log('Rendering main content - isAuthenticated:', isAuthenticated, 'user:', user)

  // Fallback for debugging
  if (!loading && !isAuthenticated) {
    console.log('Not authenticated, showing login')
  }

  // Remove demo handlers

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AuthDebug />
      {isAuthenticated && user && <Navbar user={user} />}
      <div className="content">
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={user?.role === 'scrum_master' ? '/projects' : '/tasks'} />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to={user?.role === 'scrum_master' ? '/projects' : '/tasks'} />} />
          <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPassword /> : <Navigate to={user?.role === 'scrum_master' ? '/projects' : '/tasks'} />} />
          {/* Clean TaskFlow routes */}
          <Route path="/projects" element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              {user && <Projects user={user} />}
            </PrivateRoute>
          } />
          <Route path="/projects/:projectId" element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <ProjectDetail />
            </PrivateRoute>
          } />
          <Route path="/projects/:projectId/tasks" element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              {user && <Tasks user={user} />}
            </PrivateRoute>
          } />
          <Route path="/tasks" element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              {user && <Tasks user={user} />}
            </PrivateRoute>
          } />
          <Route path="/tasks/:taskId" element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <TaskDetail />
            </PrivateRoute>
          } />
          <Route path="/analytics" element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              {user && <Analytics user={user} />}
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              {user && <Profile user={user} />}
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/projects" : "/login"} />} />
        </Routes>
      </div>

      {/* No demo modals in production flow */}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App
