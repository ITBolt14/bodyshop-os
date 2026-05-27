// ===============================================
// BODYSHOP OS - Main System Portal
// ===============================================

import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { MainSidebar } from './components/MainSidebar'
import { MainTopBar } from './components/MainTopBar'
import { Dashboard } from './pages/Dashboard'
import { CheckInWizard } from './pages/jobs/checkin/CheckInWizard'
import { JobList } from './pages/jobs/JobList'
import { JobDetail } from './pages/jobs/detail/JobDetail'
import { EstimatingList } from './pages/estimating/EstimatingList'
import { QuoteBuilder } from './pages/estimating/QuoteBuilder'
import { RateCards } from './pages/estimating/RateCards'
import { QRSticker } from './pages/jobs/QRSticker'
import { FloorMonitor } from './pages/floormonitor/FloorMonitor'
import { TabStages } from './pages/jobs/detail/TabStages'
import { StageTemplates } from './pages/admin/StageTemplates'

// SECTION: Placeholder Page Component
const ComingSoon = ({ title }) => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center space-y-3">
      <div className="text-5xl">🔧</div>
      <h2 className="text-xl font-bold text-gray-700">{title}</h2>
      <p className="text-gray-400 text-sm">This module is coming soon.</p>
    </div>
  </div>
)

export function MainPortal() {

  // SECTION: Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // SECTION: Render
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Sidebar */}
      <MainSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(prev => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Bar */}
        <MainTopBar
          onMenuToggle={() => setSidebarOpen(prev => !prev)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"             element={<Dashboard />} />
            <Route path="jobs"                  element={<JobList />} />
            <Route path="jobs/checkin"          element={<CheckInWizard />} />
            <Route path="jobs/monitor"          element={<FloorMonitor />} />
            <Route path="jobs/:id/sticker"      element={<QRSticker />} />
            <Route path="jobs/:id"              element={<JobDetail />} />
            <Route path="jobs/*"                element={<ComingSoon title="Job Management" />} />
            <Route path="estimating"            element={<EstimatingList />} />
            <Route path="estimating/rate-cards" element={<RateCards />} />
            <Route path="estimating/:jobId"     element={<QuoteBuilder />} />
            <Route path="estimating/*"          element={<ComingSoon title="Estimating" />} />
            <Route path="insurance/*"           element={<ComingSoon title="Insurance & Approvals" />} />
            <Route path="parts/*"               element={<ComingSoon title="Parts & Inventory" />} />
            <Route path="financials/*"          element={<ComingSoon title="Financials & Accounting" />} />
            <Route path="hr/*"                  element={<ComingSoon title="HR & Payroll" />} />
            <Route path="crm/*"                 element={<ComingSoon title="Cutomer CRM" />} />
            <Route path="reports/*"             element={<ComingSoon title="Reports & Analytics" />} />
            <Route path="documents/*"           element={<ComingSoon title="Document Management" />} />
            <Route path="workshop/*"            element={<FloorMonitor />} />
            <Route path="admin/stages"          element={<StageTemplates />} />
            <Route path="admin/*"               element={<ComingSoon title="System Administrator" />} />
            <Route path="*"                     element={<Navigate to="dashboard" replace />} />
          </Routes>
        </main>

      </div>
    </div>
  )
}