// ===============================================
// BODYSHOP OS - Job Detail Tab: Stages
// ===============================================

import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabase'
import { useAuth } from '../../../../../hooks/useAuth'
import { useBranch } from '../../../../../hooks/useBranch'
import { toast } from 'react-hot-toast'
import {
  CheckCircle, Clock, Circle, SkipForward,
  ChevronRight, User, RefreshCw
} from 'lucide-react'

// SECTION: Status Config
const STATUS_CONFIG = {
  pending:  { label: 'Pending',   icon: Circle,       color: 'text-gray-400',   bg: 'bg-gray-100'   },
  active:   { label: 'Active',    icon: Clock,        color: 'text-blue-600',   bg: 'bg-blue-100'   },
  complete: { label: 'Complete',  icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-100'  },
  skipped:  { label: 'Skipped',   icon: SkipForward,  color: 'text-gray-400',   bg: 'bg-gray-50'    },
}

// SECTION: Format duration
const fmtDuration = (minutes) => {
  if (!minutes) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `$[m}m`
  return `${h}h ${m}m`
}

// SECTION: Format date
const fmtDate = (d) => d
  ? new Date(d).toLocaleString('en-ZA', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
    })
  : '-'

export function TabStages({ jobId, jobStatus }) {

  // SECTION: State
  const [stages,    setStages]      = useState([])
  const [clocking,  setClocking]    = useState([])
  const [loading,   setLoading]     = useState(true)
  const [acting,    setActing]      = useState(null)

  const { profile }  = useAuth()
  const { branchId } = useBranch()

  // SECTION: Fetch stages and clocking data
  const fetchStages = async () => {
    setLoading(true)

    const [{ data: stagesData }, { data: clockData}] = await Promise.all([
      supabase
        .from('job_stages')
        .select('*')
        .eq('job_id', jobId)
        .order('sort_order'),
      supabase
        .from('workshop_clocking')
        .select('*, profiles(full_name)')
        .eq('job_id', jobId)
        .order('clocked_on_at', { ascending: false }),
    ])

    if (stagesData) setStages(stagesData)
    if (clockData)  setClocking(clockData)
    setLoading(false)
  }

  useEffect(() => { if (jobId) fetchStages() }, [jobId])

  // SECTION: Activate a stage - mark as active
  const handleActivate = async (stage) => {
    setActing(stage.id)

    const { error } = await supabase
      .from('job_stages')
      .update({
        status:     'active',
        started_at: new Date().toISOString(),
      })
      .eq('id', stage.id)

    if (error) {
      toast.error('Failed to activate stage')
      setActing(null)
      return
    }

    await supabase.from('audit_log').insert({
      branch_id:    branchId,
      user_id:      profile.id,
      portal:       'main',
      action:       'stage.activated',
      table_name:   'job_stages',
      record_id:    stage.id,
      new_value:    { stage: stage.name, status: 'active' },
    })

    toast.success(`${stage.name} activated`)
    setActing(null)
    fetchStages()
  }

  // SECTION: Complete a stage
  const handleComplete = async (stage) => {
    setActing(stage.id)

    const now         = new Date().toISOString()
    const started     = stage.started_at ? new Date(stage.started_at) : new Date()
    const mins        = Math.round((new Date() - started) / 60000)

    const { error } = await supabase
      .from('job_stages')
      .update({
        status:           'complete',
        completed_at:     now,
        duration_minutes: mins,
      })
      .eq('id', stage.id)

    if (error) {
      toast.error('Failed to complete stage')
      setActing(null)
      return
    }

    await supabase.from('audit_log').insert({
      branch_id:    branchId,
      user_id:      profile.id,
      portal:       'main',
      action:       'stage.completed',
      table_name:   'job_stages',
      record_id:    stage.id,
      new_value:    { stage: stage.name, duration_minutes: mins },
    })

    toast.success(`${stage.name} marked complete`)
    setActing(null)
    fetchStages()
  }

  // SECTION: Skip a stage
  const handleSkip = async (stage) => {
    setActing(stage.id)

    const { error } = await supabase
      .from('job_stages')
      .update({ status: 'skipped' })
      .eq('id', stage.id)

    if (error) {
      toast.error('Failed to skip stage')
      setActing(null)
      return
    }

    toast.success(`${stage.name} skipped`)
    setActing(null)
    fetchStages()
  }

  // SECTION: Loading
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card h-16 animate-pulse bg-gray-50" />
        ))}
      </div>
    )
  }

  // SECTION: No stages
  if (stages.length === 0) {
    return (
      <div className="card text-center py-16">
        <Clock size={40} className="mx-auto text-gray-200 mb-3" />
        <p className="font-semibold text-gray-500">No stages set up</p>
        <p className="text-sm text-gray-400 mt-1">
          Stage templates may not be configured to this branch yet.
          Go to Admin → Stage Template to set them up.
        </p>
      </div>
    )
  }

  // SECTION: Render
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-800">Workshop Stages</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {stages.filter(s => s.status === 'complete').length} of {' '}
            {stages.filter(s => s.status !== 'skipped').length} stages complete
          </p>
        </div>
        <button
          onClick={fetchStages}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600
                     hover:bg-gray-100 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className="bg-brand-600 h-2 rounded-full transition-all duration-500"
          style={{
            width: `${Math.round(
              (stages.filter(s => s.status === 'complete').length /
               Math.max(stages.filter(s => s.status !== 'skipped').length, 1)
              ) * 100
            )}%`
          }}
        />
      </div>

      {/* Stages List */}
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const config        = STATUS_CONFIG[stage.status] ?? STATUS_CONFIG.pending
          const Icon          = config.icon
          const isActing      = acting === stage.id
          const clockEvents   = clocking.filter(c => c.job_stage_id === stage.id)
          const activeEvent   = clockEvents.find(c => !c.clocked_off_at)
          const isFirst       = index === 0
          const prevDone      = index === 0 ||
            ['complete','skipped'].includes(stage[index -1]?.status)

          return (
            <div
              key={stage.id}
              className={`card transition-all duration-200
                          ${stage.status === 'active'
                            ? 'border-blue-300 bg-blue-50/30 shadow-md'
                            : stage.status === 'complete'
                            ? 'border-green-200 bg-graan-50/20'
                            : stage.status === 'skipped'
                            ? 'opacity-60'
                            : ''
                          }`}
            >
              <div className="flex items-start gap-4">

                {/* Stage Number & Icon */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className={`w-9 h-9 rounded-full flex items-center
                                   justify-center ${config.bg}`}>
                    <Icon size={18} className={config.color} />
                  </div>
                  {index < stages.length - 1 && (
                    <div className={`w-0.5 h-4
                                     ${stage.status === 'complete'
                                       ? 'bg-green-300'
                                       : 'bg-gray-200'
                                     }`}
                    />
                  )}
                </div>

                {/* Stage Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800 text-sm">
                      {stage.sort_order}. {stage.name}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5
                                     rounded-full uppercase tracking-wide
                                     ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    {stage.duration_minutes && (
                      <span className="text-[10px] text-gray-400">
                        {fmtDuration(stage.duration_minutes)}
                      </span>
                    )}
                  </div>

                  {stage.description && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {stage.description}
                    </p>
                  )}

                  {/* Timestamps */}
                  {stage.started_at && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Started: {fmtDate(stage.started_at)}
                      {stage.completed_at && (
                        <> • Completed: {fmtDate(stage.completed_at)}</>
                      )}
                    </p>
                  )}

                  {/* Activate technician */}
                  {activeEvent && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full
                                      animate-pulse" />
                      <span className="text-xs text-green-700 font-medium">
                        {activeEvent.profiles?.full_name} currently clocked on
                      </span>
                    </div>
                  )}

                  {/* Clocking history */}
                  {clockEvents.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {clockEvents.map(ev => (
                        <div key={ev.id}
                          className="flex items-center gap-1.5 text-[10px]
                                     text-gray-400">
                          <User size={10} />
                          <span>{ev.profiles?.full_name}</span>
                          <span>•</span>
                          <span>{fmtDate(ev.clocked_on_at)}</span>
                          {ev.clocked_off_at && (
                            <>
                              <ChevronRight size={10} />
                              <span>{fmtDate(ev.clocked_off_at)}</span>
                              {ev.duration_minutes && (
                                <span className="text-gray-500 font-medium">
                                  ({dmtDuration(ev.duration_minutes)})
                                </span>
                              )}
                              {ev.auto_clocked_off && (
                                <span className="text-amber-500">auto</span>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {stage.status === 'pwnding' && prevDone && (
                    <>
                      <button
                        onClick={() => handleActivate(stage)}
                        disabled={!!acting}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        {isActing ? '...' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleSkip(stage)}
                        disabled={!!acting}
                        className="btn-seconday text-xs py-1.5 px-3"
                      >
                        Skip
                      </button>
                    </>
                  )}
                  {stage.status === 'active' && (
                    <button
                      onClick={() => handleComplete(stage)}
                      disabled={!!acting}
                      className="btn-primary text-xs py-1.5 px-3
                                 bg-green-600 hover:bg-green-700"
                    >
                      {isActing ? '...' : 'Mark Complete'}
                    </button>
                  )}
                </div>

              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}