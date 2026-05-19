// ===============================================
// BODYSHOP OS - job Detail Page
// ===============================================

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../../../../lib/supabase'
import { JobDetailHeader } from './JobDetailHeader'
import { TabOverview } from './TabOverview'
import { TabClaim } from './TabClaim'
import { TabStages } from './TabStages'
import { TabDocuments } from './TabDocuments'
import { TabNotes } from './TabNotes'
import { TabAudit } from './TabAudit'

// SECTION: Tab Definitions
const TABS = [
  { key: 'overview',    label: 'Overview'       },
  { key: 'claim',       label: 'Claim Details'  },
  { key: 'stages',      label: 'Stages'         },
  { key: 'documents',   label: 'Documents'      },
  { key: 'notes',       label: 'Notes'          },
  { key: 'audit',       label: 'Audit Log'      },
]

export function JobDetail() {
  
  // SECTION: State
  const { id }          = useParams()
  const navigate        = useNavigate()

  const [job,           setJob]         = useState(null)
  const [vehicle,       setVehicle]     = useState(null)
  const [claim,         setClaim]       = useState(null)
  const [auditLogs,     setAuditLogs]   = useState([])
  const [insurers,      setInsurers]    = useState([])
  const [loading,       setLoading]     = useState(true)
  const [activeTab,     setActiveTab]   = useState('overview')
  const [editMode,      setEditMode]    = useState(false)

  // SECTION: Fetch All Job Data
  const fetchJob = useCallback(async () => {
    setLoading(true)

    // Fetch job
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (jobError || !jobData) {
      console.error('Job fetch error:', jobError?.message)
      navigate('/main/jobs')
      return
    }

    setJob(jobData)

    // Fetch vehicle
    const { data: vehicleData } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', jobData.vehicle_id)
      .single()

    if (vehicleData) setVehicle(vehicleData)

    // Fetch claim
    const { data: claimData } = await supabase
      .from('job_claims')
      .select('*')
      .eq('job_id', id)
      .maybeSingle()

    if (claimData) setClaim(claimData)

    // Fetch audit logs for this job
    const { data: auditData } = await supabase
      .from('audit_log')
      .select('*, profiles(full_name)')
      .eq('record_id', id)
      .order('created_at', { ascending: false })

    if (auditData) setAuditLogs(auditData)

    // Fetch insurers for dropdowns
    const { data: insurerData } = await supabase
      .from('insurers')
      .select('id, name, code')
      .eq('active', true)
      .order('name')

    if (insurerData) setInsurers(insurerData)

    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchJob()
  }, [fetchJob])

  // SECTION: Handle Save - refresh data and exit edit mode
  const handleSaved = () => {
    setEditMode(false)
    fetchJob()
  }

  // SECTION: Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-600
                          border-t-transparent rounded-full
                          animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Loading job...</p>
        </div>
      </div>
    )
  }

  if (!job) return null

  // SECTION: Render
  return (
    <div className="m-6">

      {/* Sticky Header */}
      <div className="sticky top-0 z-20">
        <JobDetailHeader
          job={{ ...job, vehicles: vehicle }}
          editMode={editMode}
          onEditToggle={() => setEditMode(prev => !prev)}
          onJobUpdated={fetchJob}
        />

        {/* Tab Bar */}
        <div className="bg-white border-b border-gray-200 px-6">
          <div className="max-w-[1400px] mx-auto flex gap-0 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap
                            border-b-2 transition-colors
                            ${activeTab === tab.key
                              ? 'border-brand-600 text-brand-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6 max-w-[1400px] mx-auto">
        {activeTab === 'overview' && (
          <TabOverview
            job={job}
            vehicle={vehicle}
            insurers={insurers}
            auditLogs={auditLogs}
            editMode={editMode}
            onSaved={handleSaved}
          />
        )}
        {activeTab === 'claim' && (
          <TabClaim
            claim={claim}
            jobid={id}
            jobType={job.job_type}
            editMode={editMode}
            onSaved={handleSaved}
          />
        )}
        {activeTab === 'stages'     && <TabStages />}
        {activeTab === 'documents'  && <TabDocuments />}
        {activeTab === 'notes'      && <TabNotes />}
        {activeTab === 'audit'      && <TabAudit logs={auditLogs} />}
      </div>

    </div>
  )
}