// =============================================
// BODYSHOP OS — Portal Layout + Route Guard
// Fixed: animate-spin typo, loading timeout
// =============================================

import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function PortalGuard({ children, allowedRoles }) {

  const { user, profile, loading } = useAuth()

  // SECTION: Safety timeout — if loading takes more than 8 seconds
  // force it out of loading state to prevent infinite white screen
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!loading) return
    const timer = setTimeout(() => {
      console.warn('PortalGuard: loading timeout — forcing resolution')
      setTimedOut(true)
    }, 8000)
    return () => clearTimeout(timer)
  }, [loading])

  // SECTION: Loading State
  if (loading && !timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-600
                          border-t-transparent rounded-full
                          animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  // SECTION: Not logged in
  if (!user) return <Navigate to="/login" replace />

  // SECTION: Account inactive
  if (profile && !profile.active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-sm text-center space-y-3">
          <p className="text-red-600 font-semibold">Account Inactive</p>
          <p className="text-sm text-gray-500">
            Your account has been deactivated.
            Please contact your administrator.
          </p>
        </div>
      </div>
    )
  }

  // SECTION: Role not allowed
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}