// =============================================
// BODYSHOP OS — Workshop Floor Monitor
// Real-time live view of all active jobs
// =============================================

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../../lib/supabase'
import { useBranch } from '../../../../hooks/useBranch'
import { RefreshCw, Maximize2, Car, User, Clock } from 'lucide-react'

// SECTION: Job card border colour based on due date
const jobHealth = (job) => {
  if (!job.estimated_completion) return 'border-gray-200'
  const due  = new Date(job.estimated_completion)
  const now  = new Date()
  const days = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
  if (days < 0)  return 'border-red-400 shadow-red-100'
  if (days <= 1) return 'border-amber-400 shadow-amber-100'
  return 'border-green-300'
}

// SECTION: Format elapsed time
const elapsed = (from) => {
  if (!from) return null
  const mins = Math.round((new Date() - new Date(from)) / 60000)
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// SECTION: Job Card Component
function JobCard({ job, onClick }) {

  const activeStage    = job.stages?.find(s => s.status === 'active')
  const doneCount      = job.stages?.filter(s => s.status === 'complete').length  ?? 0
  const totalCount     = job.stages?.filter(s => s.status !== 'skipped').length   ?? 0
  const pct            = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
  const health         = jobHealth(job)
  const isOverdue      = job.estimated_completion &&
                         new Date(job.estimated_completion) < new Date()

  return (
    <button
      onClick={() => onClick(job.id)}
      className={`card text-left w-full hover:shadow-lg transition-all
                  duration-200 border-2 ${health} shadow-sm`}
    >

      {/* SECTION: Job Number + Vehicle */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-black text-brand-700 text-sm leading-tight">
            {job.job_number}
          </p>
          <p className="text-xs font-semibold text-gray-700 truncate mt-0.5">
            {job.vehicles?.make} {job.vehicles?.model}
          </p>
          <p className="text-sm font-black text-gray-800 tracking-wide">
            {job.vehicles?.registration}
          </p>
          {job.vehicles?.owner_name && (
            <p className="text-[10px] text-gray-400 truncate">
              {job.vehicles.owner_name}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          {job.estimated_completion && (
            <p className={`text-[10px] font-bold
                           ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
              {isOverdue ? '⚠ OVERDUE' : 'Due'}
            </p>
          )}
          {job.estimated_completion && (
            <p className={`text-[10px]
                           ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
              {new Date(job.estimated_completion).toLocaleDateString('en-ZA', {
                day: '2-digit', month: 'short'
              })}
            </p>
          )}
        </div>
      </div>

      {/* SECTION: Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
        <div
          className="bg-brand-600 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-400 mb-3">
        {doneCount} of {totalCount} stages complete ({pct}%)
      </p>

      {/* SECTION: Current Active Stage */}
      {activeStage ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse
                            shrink-0" />
            <p className="text-xs font-bold text-blue-700 truncate">
              {activeStage.name}
            </p>
            {activeStage.started_at && (
              <span className="text-[10px] text-blue-500 ml-auto shrink-0
                               flex items-center gap-0.5">
                <Clock size={9} />
                {elapsed(activeStage.started_at)}
              </span>
            )}
          </div>
          {job.activeClocking?.profiles?.full_name && (
            <div className="flex items-center gap-1 text-[10px] text-blue-600">
              <User size={10} className="shrink-0" />
              <span className="truncate">
                {job.activeClocking.profiles.full_name}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-100 rounded-lg
                        p-2 mb-2 text-center">
          <p className="text-[10px] text-gray-400">
            {doneCount === totalCount && totalCount > 0
              ? '✓ All stages complete'
              : 'No active stage'
            }
          </p>
        </div>
      )}

      {/* SECTION: Stage Progress Dots */}
      <div className="flex gap-0.5 mt-1">
        {job.stages?.map(stage => (
          <div
            key={stage.id}
            className={`h-1.5 rounded-full flex-1 transition-colors
                        ${stage.status === 'complete' ? 'bg-green-400'
                          : stage.status === 'active'  ? 'bg-blue-400 animate-pulse'
                          : stage.status === 'skipped' ? 'bg-gray-100'
                          : 'bg-gray-200'
                        }`}
            title={`${stage.name} — ${stage.status}`}
          />
        ))}
      </div>

    </button>
  )
}

// SECTION: Main Floor Monitor Component
export function FloorMonitor() {

  const [jobs,       setJobs]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [fullscreen, setFullscreen] = useState(false)

  const { branchId } = useBranch()
  const navigate     = useNavigate()

  // SECTION: Fetch All Floor Data
  const fetchFloor = useCallback(async () => {
    if (!branchId) return

    // Step 1 — Fetch active jobs
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('id, job_number, status, priority, estimated_completion, vehicle_id')
      .eq('branch_id', branchId)
      .in('status', [
        'checked_in',
        'awaiting_assessment',
        'awaiting_authorization',
        'authorized',
        'in_progress',
        'quality_check',
        'awaiting_parts',
        'ready_for_collection',
      ])
      .order('priority',   { ascending: true })
      .order('created_at', { ascending: true })

    if (jobError) {
      console.error('Floor monitor jobs error:', jobError.message)
      setLoading(false)
      return
    }

    if (!jobData || jobData.length === 0) {
      setJobs([])
      setLastUpdate(new Date())
      setLoading(false)
      return
    }

    const jobIds     = jobData.map(j => j.id)
    const vehicleIds = [...new Set(jobData.map(j => j.vehicle_id).filter(Boolean))]

    // Step 2 — Fetch vehicles, stages, active clocking in parallel
    const [
      { data: vehicleData,  error: vErr  },
      { data: stagesData,   error: sErr  },
      { data: clockData,    error: cErr  },
    ] = await Promise.all([
      supabase
        .from('vehicles')
        .select('id, make, model, registration, owner_name')
        .in('id', vehicleIds),
      supabase
        .from('job_stages')
        .select('*')
        .in('job_id', jobIds)
        .order('sort_order', { ascending: true }),
      supabase
        .from('workshop_clocking')
        .select('*, profiles(full_name)')
        .in('job_id', jobIds)
        .is('clocked_off_at', null),
    ])

    if (vErr) console.error('Vehicles error:', vErr.message)
    if (sErr) console.error('Stages error:',   sErr.message)
    if (cErr) console.error('Clocking error:', cErr.message)

    // Step 3 — Build lookup maps
    const vehicleMap = (vehicleData ?? []).reduce((acc, v) => {
      acc[v.id] = v
      return acc
    }, {})

    const stagesMap = (stagesData ?? []).reduce((acc, s) => {
      if (!acc[s.job_id]) acc[s.job_id] = []
      acc[s.job_id].push(s)
      return acc
    }, {})

    const clockMap = (clockData ?? []).reduce((acc, c) => {
      if (c.job_stage_id) acc[c.job_stage_id] = c
      return acc
    }, {})

    // Step 4 — Merge everything into job objects
    const merged = jobData.map(job => {
      const stages         = stagesMap[job.id] ?? []
      const activeStage    = stages.find(s => s.status === 'active') ?? null
      const activeClocking = activeStage
        ? (clockMap[activeStage.id] ?? null)
        : null

      return {
        ...job,
        vehicles:        vehicleMap[job.vehicle_id] ?? null,
        stages,
        activeClocking,
      }
    })

    setJobs(merged)
    setLastUpdate(new Date())
    setLoading(false)

  }, [branchId])

  // SECTION: Initial fetch + 30-second auto-refresh
  useEffect(() => {
    fetchFloor()
    const interval = setInterval(fetchFloor, 30000)
    return () => clearInterval(interval)
  }, [fetchFloor])

  // SECTION: Realtime subscription — refresh on stage or clocking changes
  useEffect(() => {
    const channel = supabase
      .channel('floor-monitor-realtime')
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'job_stages',
      }, () => fetchFloor())
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'workshop_clocking',
      }, () => fetchFloor())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchFloor])

  // SECTION: Group jobs by category
  const inProgress = jobs.filter(j =>
    j.stages?.some(s => s.status === 'active') ||
    ['in_progress', 'quality_check'].includes(j.status)
  )

  const waiting = jobs.filter(j =>
    !j.stages?.some(s => s.status === 'active') &&
    ['checked_in', 'awaiting_assessment', 'awaiting_authorization',
     'authorized', 'awaiting_parts'].includes(j.status)
  )

  const readyCollect = jobs.filter(j =>
    j.status === 'ready_for_collection'
  )

  // SECTION: Section Header
  const SectionHeader = ({ color, label, count }) => (
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider">
        {label} ({count})
      </h2>
    </div>
  )

  // SECTION: Render
  return (
    <div className={`space-y-6 ${fullscreen
      ? 'fixed inset-0 z-50 bg-gray-50 p-6 overflow-y-auto'
      : ''}`}
    >

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Floor Monitor</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading && jobs.length === 0
              ? 'Loading...'
              : `${jobs.length} active vehicle${jobs.length !== 1 ? 's' : ''} in workshop`
            }
            {lastUpdate && !loading && (
              <span className="ml-2 text-gray-400 text-xs">
                · Updated {lastUpdate.toLocaleTimeString('en-ZA', {
                  hour: '2-digit', minute: '2-digit', second: '2-digit',
                })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchFloor}
            className="btn-secondary p-2"
            title="Refresh now"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setFullscreen(f => !f)}
            className="btn-secondary p-2"
            title={fullscreen ? 'Exit fullscreen' : 'Fullscreen mode'}
          >
            <Maximize2 size={15} />
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && jobs.length === 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-52 animate-pulse bg-gray-100" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && jobs.length === 0 && (
        <div className="card text-center py-20">
          <Car size={48} className="mx-auto text-gray-200 mb-3" />
          <p className="font-semibold text-gray-500">No active vehicles</p>
          <p className="text-sm text-gray-400 mt-1">
            Check in a vehicle to see it appear here
          </p>
        </div>
      )}

      {/* Job Groups */}
      {jobs.length > 0 && (
        <>
          {/* In Progress */}
          {inProgress.length > 0 && (
            <div>
              <SectionHeader
                color="bg-blue-500 animate-pulse"
                label="In Progress"
                count={inProgress.length}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2
                              lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {inProgress.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onClick={id => navigate(`/main/jobs/${id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Waiting / On Hold */}
          {waiting.length > 0 && (
            <div>
              <SectionHeader
                color="bg-amber-400"
                label="Waiting / On Hold"
                count={waiting.length}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2
                              lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {waiting.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onClick={id => navigate(`/main/jobs/${id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Ready for Collection */}
          {readyCollect.length > 0 && (
            <div>
              <SectionHeader
                color="bg-green-500"
                label="Ready for Collection"
                count={readyCollect.length}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2
                              lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {readyCollect.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onClick={id => navigate(`/main/jobs/${id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

    </div>
  )
}