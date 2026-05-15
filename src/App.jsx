// ===============================================
// BODYSHOP OS - App Router
// ===============================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { PortalGuard } from './layouts/PortalLayout'

// Auth Pages
import { Login } from './components/auth/Login'
import { ResetPassword } from './components/auth/ResetPassword'
import { UpdatePassword } from './components/auth/UpdatePassword'

// Portals
import { MainPortal } from './portals/main/MainPortal'
import { KioskPortal } from './portals/kiosk/KioskPortal'
import { WorkshopPortal } from './portals/workshop/WorkshopPortal'
import { CustomerPortal } from './portals/customer/CustomerPortal'
import { AssessorPortal } from './portals/assessor/AssessorPortal'

// SECTION: Role Groupings
const MAIN_ROLES      = ['super_admin', 'branch_admin', 'manager', 'estimator', 'receptionist']
const WORKSHOP_ROLES  = ['super_admin', 'branch_admin', 'manager', 'technician']
const ASSESSOR_ROLES  = ['assessor']
const CUSTOMER_ROLES  = ['customer']

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '8px',
              fontSize: '14px',
            },
          }}
        />

        <Routes>

          {/* SECTION: Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />

          {/* SECTION: Kiosk - no auth required, locked UI */}
          <Route path="/kiosk" element={<KioskPortal />} />

          {/* SECTION: Protected Portal Routes */}
          <Route
            path="/main/*"
            element={
              <PortalGuard allowedRoles={MAIN_ROLES}>
                <MainPortal />
              </PortalGuard>
            }
          />

          <Route
            path="/workshop/*"
            element={
              <PortalGuard allowedRoles={WORKSHOP_ROLES}>
                <WorkshopPortal />
              </PortalGuard>
            }
          />

          <Route
            path="/assessor/*"
            element={
              <PortalGuard allowedRoles={ASSESSOR_ROLES}>
                <AssessorPortal />
              </PortalGuard>
            }
          />

          <Route
            path="/customer/*"
            element={
              <PortalGuard allowedRoles={CUSTOMER_ROLES}>
                <CustomerPortal />
              </PortalGuard>
            }
          />

          {/* SECTION: Unauthorized */}
          <Route
            path="/unauthorized"
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="card max-w-sm text-center space-y-3">
                  <p className="text-red-600 font-bold text-lg">Access Denied</p>
                  <p className="text-sm text-gray-500">
                    You do not have permission to access this area.
                  </p>
                  <a href="/login" className="btn-secondary inline-block">
                    Back to Login
                  </a>
                </div>
              </div>
            }
          />

          {/* SECTION: Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>

      </AuthProvider>
    </BrowserRouter>
  )
}