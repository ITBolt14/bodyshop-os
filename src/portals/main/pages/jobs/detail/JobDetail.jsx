// =============================================
// BODYSHOP OS — Job Detail Page
// =============================================

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { supabase } from '../../../../../lib/supabase'
import { JobDetailHeader } from './JobDetailHeader'
import { TabOverview }     from './TabOverview'
import { TabClaim }        from './TabClaim'
import { TabStages }       from './TabStages'
import { TabDocuments }    from './TabDocuments'
import { TabNotes }        from './TabNotes'
import { TabAudit }        from './TabAudit'

// SECTION: Tab Definitions
const TABS = [
  { key: 'overview',    label: 'Overview'       },
  { key: 'claim',       label: 'Claim Details'  },
  { key: 'stages',      label: 'Stages'         },
  { key: 'documents',   label: 'Documents'      },
  { key: 'notes',       label: 'Notes'          },
  { key: 'audit',       label: 'Audit Log'      },
  { key: 'estimating',  label: 'Estimating'     },
]

// SECTION: Estimate Status Badge Styles
const ESTIMATE_STATUS_STYLES = {
  draft:               'bg-gray-100 text-gray-600',
  submitted:           'bg-blue-100 text-blue-700',
  approved:            'bg-green-100 text-green-700',
  partially_approved:  'bg-yellow-100 text-yellow-700',
  rejected:            'bg-red-100 text-red-700',
  supplementary:       'bg-purple-100 text-purple-700',
}

export function JobDetail() {

  // SECTION: Params & Navigation
  const { id }   = useParams()
  const navigate = useNavigate()

  // SECTION: State
  const [job,          setJob]          = useState(null)
  const [vehicle,      setVehicle]      = useState(null)
  const [claim,        setClaim]        = useState(null)
  const [jobEstimate,  setJobEstimate]  = useState(null)
  const [auditLogs,    setAuditLogs]    = useState([])
  const [insurers,     setInsurers]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [activeTab,    setActiveTab]    = useState('overview')
  const [editMode,     setEditMode]     = useState(false)

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

    // Fetch claim details
    const { data: claimData } = await supabase
      .from('job_claims')
      .select('*')
      .eq('job_id', id)
      .maybeSingle()

    if (claimData) setClaim(claimData)

    // Fetch estimate for this job
    const { data: estimateData } = await supabase
      .from('estimates')
      .select('id, status, version, total_incl_vat, quote_mode')
      .eq('job_id', id)
      .maybeSingle()

    if (estimateData) setJobEstimate(estimateData)
    else setJobEstimate(null)

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

  useEffect(() => { fetchJob() }, [fetchJob])

  // SECTION: Handle Save — refresh data and exit edit mode
  const handleSaved = () => {
    setEditMode(false)
    fetchJob()
  }

  // SECTION: Loading State
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
    <div className="-m-6">

      {/* SECTION: Sticky Header */}
      <div className="sticky top-0 z-20">

        {/* Job Header — title, status, edit/change status buttons */}
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

      {/* SECTION: Tab Content */}
      <div className="p-6 max-w-[1400px] mx-auto">

        {/* Overview Tab */}
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

        {/* Claim Details Tab */}
        {activeTab === 'claim' && (
          <TabClaim
            claim={claim}
            jobId={id}
            jobType={job.job_type}
            editMode={editMode}
            onSaved={handleSaved}
          />
        )}

        {/* Stages Tab */}
        {activeTab === 'stages' && (
          <TabStages
            jobId={id}
            jobStatus={job.status}
          />
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && <TabDocuments />}

        {/* Notes Tab */}
        {activeTab === 'notes' && <TabNotes />}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && <TabAudit logs={auditLogs} />}

        {/* Estimating Tab */}
        {activeTab === 'estimating' && (
          <div className="card text-center py-16">
            <FileText size={40} className="mx-auto text-gray-200 mb-3" />

            {jobEstimate ? (
              <>
                {/* Estimate exists — show summary and open button */}
                <p className="font-semibold text-gray-700 text-lg">
                  Estimate — Version {jobEstimate.version}
                </p>

                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5
                                   rounded-full uppercase tracking-wide
                                   ${ESTIMATE_STATUS_STYLES[jobEstimate.status]
                                     ?? 'bg-gray-100 text-gray-600'}`}>
                    {jobEstimate.status?.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-gray-400 uppercase">
                    {jobEstimate.quote_mode}
                  </span>
                </div>

                <p className="text-3xl font-bold text-gray-800 mt-4">
                  R {Number(jobEstimate.total_incl_vat || 0).toLocaleString('en-ZA', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">incl. VAT</p>

                <button
                  onClick={() => navigate(`/main/estimating/${job.id}`)}
                  className="btn-primary mt-6 inline-flex items-center gap-2"
                >
                  <FileText size={15} />
                  Open Estimate
                </button>
              </>
            ) : (
              <>
                {/* No estimate yet */}
                <p className="font-semibold text-gray-500">No estimate yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Create an estimate for this job
                </p>

                <button
                  onClick={() => navigate(`/main/estimating/${job.id}`)}
                  className="btn-primary mt-6 inline-flex items-center gap-2"
                >
                  <FileText size={15} />
                  Create Estimate
                </button>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}