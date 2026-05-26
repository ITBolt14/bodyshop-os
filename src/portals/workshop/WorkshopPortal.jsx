// =============================================
// BODYSHOP OS — Workshop Clocking Portal
// =============================================

import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { WorkshopLogin } from './pages/WorkshopLogin'
import { WorkshopHome }  from './pages/WorkshopHome'
import { JobClocking }   from './pages/JobClocking'

// SECTION: Workshop Session Context
// Uses localStorage to store the workshop user
// separately from the main Supabase auth session
export const getWorkshopUser = () => {
  try {
    const stored = localStorage.getItem('workshop_user')
    return stored ? JSON.parse(stored) : null
  } catch { return null }
}

export const setWorkshopUser = (user) => {
  if (user) {
    localStorage.setItem('workshop_user', JSON.stringify(user))
  } else {
    localStorage.removeItem('workshop_user')
  }
}

// SECTION: Workshop Guard
function WorkshopGuard({ children }) {
  const user = getWorkshopUser()
  if (!user) return <Navigate to="/workshop/login" replace />
  return children
}

// SECTION: Main Workshop Portal Router
export function WorkshopPortal() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Routes>
        <Route path="login"    element={<WorkshopLogin />} />
        <Route
          path="home"
          element={
            <WorkshopGuard>
              <WorkshopHome />
            </WorkshopGuard>
          }
        />
        <Route
          path="job/:token"
          element={
            <WorkshopGuard>
              <JobClocking />
            </WorkshopGuard>
          }
        />
        <Route index  element={<Navigate to="login" replace />} />
        <Route path="*" element={<Navigate to="login" replace />} />
      </Routes>
    </div>
  )
}