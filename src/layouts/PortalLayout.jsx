// ===============================================
// BODYSHOP OS - Portal Layout + Route Guard
// ===============================================

import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function PortalGuard({ children, allowedRoles }) {

  // SECTION: Auth State
  const { user, profile, loading } = useAuth()

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent
                          rounded-full animate-span mx-auto" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  // Not logged in
  if (!user) return <Navigate to="/login" replace />

  // Account inactive
  if (profile && !profile.active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-sm text-center space-y-3">
          <p className="text-red-600 font-semibold">Account Inactive</p>
          <p className="text-sm text-gray-500">
            Your account has been deactivated. Please contact your administrator.
          </p>
        </div>
      </div>
    )
  }

  // Role not allowed for this portal
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}