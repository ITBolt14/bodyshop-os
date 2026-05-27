// =============================================
// BODYSHOP OS — Job Detail: Stages Tab
// Foreman can complete Final QC from here
// Final QC completion triggers Ready for Collection
// =============================================

import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabase'
import { useAuth } from '../../../../../hooks/useAuth'
import { useBranch } from '../../../../../hooks/useBranch'
import { toast } from 'react-hot-toast'
import {
  CheckCircle, Clock, Circle, SkipForward,
  ChevronRight, User, RefreshCw, Lock,
  ShieldCheck,
} from 'lucide-react'

// SECTION: Status config
const STATUS_CONFIG = {
  pending:  { label: 'Pending',  icon: Circle,      color: 'text-gray-400',  bg: 'bg-gray-100'  },
  active:   { label: 'Active',   icon: Clock,       color: 'text-blue-600',  bg: 'bg-blue-100'  },
  complete: { label: 'Complete', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  skipped:  { label: 'Skipped',  icon: SkipForward, color: 'text-gray-400',  bg: 'bg-gray-50'   },
}

// SECTION: Format helpers
const fmtDuration = (mins) => {
  if (!mins) return null
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const fmtDate = (d) => d
  ? new Date(d).toLocaleString('en-ZA', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
    })
  : '—'

export function TabStages({ jobId, jobStatus }) {

  // SECTION: State
  const [stages,   setStages]   = useState([])
  const [clocking, setClocking] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [acting,   setActing]   = useState(null)

  const { profile }  = useAuth()
  const { branchId } = useBranch()

  // SECTION: Fetch stages and clocking history
  const fetchStages = async () => {
    setLoading(true)

    const [{ data: stagesData }, { data: clockData }] = await Promise.all([
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

  // SECTION: Manually complete a stage (foreman/manager action)
  const handleComplete = async (stage) => {
    setActing(stage.id)

    const now     = new Date().toISOString()
    const started = stage.started_at
      ? new Date(stage.started_at)
      : new Date()
    const mins    = Math.round((new Date() - started) / 60000)

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

    // If this is the Final QC (second to last stage),
    // the DB trigger handles moving job to ready_for_collection
    await supabase.from('audit_log').insert({
      branch_id:  branchId,
      user_id:    profile.id,
      portal:     'main',
      action:     'stage.completed',
      table_name: 'job_stages',
      record_id:  stage.id,
      new_value:  {
        stage:            stage.name,
        duration_minutes: mins,
      },
    })

    toast.success(`${stage.name} marked complete`)
    setActing(null)
    fetchStages()
  }

  // SECTION: Manually activate a stage
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
      branch_id:  branchId,
      user_id:    profile.id,
      portal:     'main',
      action:     'stage.activated',
      table_name: 'job_stages',
      record_id:  stage.id,
      new_value:  { stage: stage.name },
    })

    toast.success(`${stage.name} activated`)
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
          Go to Admin → Stage Templates to configure stages for this branch.
        </p>
      </div>
    )
  }

  // SECTION: Is Final QC — second to last non-system stage
  const nonSystemStages   = stages.filter(s => !s.system_stage)
  const finalQCStage      = nonSystemStages[nonSystemStages.length - 1]

  // SECTION: Progress
  const doneCount  = stages.filter(s => s.status === 'complete').length
  const totalCount = stages.filter(s => !s.system_stage).length
  const pct        = totalCount > 0
    ? Math.round((doneCount / totalCount) * 100) : 0

  // SECTION: Render
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-800">Workshop Stages</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {doneCount} of {totalCount} stages complete
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
      <div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
          <div
            className="bg-brand-600 h-2 rounded-full transition-all
                       duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 text-right">{pct}% complete</p>
      </div>

      {/* Stage List */}
      <div className="space-y-2">
        {stages.map((stage, index) => {

          const config        = STATUS_CONFIG[stage.status] ?? STATUS_CONFIG.pending
          const Icon          = config.icon
          const isActing      = acting === stage.id
          const isComplete    = stage.status === 'complete'
          const isSkipped     = stage.status === 'skipped'
          const isActive      = stage.status === 'active'
          const isSystemStage = stage.system_stage
          const isFinalQC     = stage.id === finalQCStage?.id
          const clockEvents   = clocking.filter(c => c.job_stage_id === stage.id)
          const activeEvent   = clockEvents.find(c => !c.clocked_off_at)

          return (
            <div
              key={stage.id}
              className={`card transition-all duration-200
                          ${isActive
                            ? 'border-blue-300 bg-blue-50/30 shadow-md'
                            : isComplete
                            ? 'border-green-200 bg-green-50/20'
                            : isSkipped
                            ? 'opacity-60'
                            : isSystemStage
                            ? 'border-gray-100 bg-gray-50'
                            : ''
                          }`}
            >
              <div className="flex items-start gap-4">

                {/* Stage Number + Icon */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className={`w-9 h-9 rounded-full flex items-center
                                   justify-center ${config.bg}`}>
                    {isSystemStage && !isComplete
                      ? <Lock size={16} className="text-gray-400" />
                      : <Icon size={18} className={config.color} />
                    }
                  </div>
                  {index < stages.length - 1 && (
                    <div className={`w-0.5 h-4
                                     ${isComplete
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
                    {isFinalQC && !isComplete && (
                      <span className="text-[10px] font-bold px-2 py-0.5
                                       rounded-full uppercase tracking-wide
                                       bg-amber-100 text-amber-700">
                        Requires Sign-Off
                      </span>
                    )}
                    {isSystemStage && (
                      <span className="text-[10px] text-gray-400 uppercase">
                        System
                      </span>
                    )}
                    {stage.duration_minutes && (
                      <span className="text-[10px] text-gray-400">
                        {fmtDuration(stage.duration_minutes)}
                      </span>
                    )}
                  </div>

                  {/* Timestamps */}
                  {stage.started_at && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Started: {fmtDate(stage.started_at)}
                      {stage.completed_at && (
                        <> · Completed: {fmtDate(stage.completed_at)}</>
                      )}
                    </p>
                  )}

                  {/* Active technician */}
                  {activeEvent && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full
                                      animate-pulse" />
                      <span className="text-xs text-green-700 font-medium">
                        {activeEvent.profiles?.full_name} clocked on
                      </span>
                    </div>
                  )}

                  {/* Clocking history */}
                  {clockEvents.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {clockEvents.map(ev => (
                        <div key={ev.id}
                             className="flex items-center gap-1.5
                                        text-[10px] text-gray-400">
                          <User size={10} />
                          <span>{ev.profiles?.full_name}</span>
                          <span>·</span>
                          <span>{fmtDate(ev.clocked_on_at)}</span>
                          {ev.clocked_off_at && (
                            <>
                              <ChevronRight size={10} />
                              <span>{fmtDate(ev.clocked_off_at)}</span>
                              {ev.duration_minutes && (
                                <span className="text-gray-500 font-medium">
                                  ({fmtDuration(ev.duration_minutes)})
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

                  {/* Final QC sign-off button — most prominent */}
                  {isFinalQC && !isComplete && !isSkipped && (
                    <button
                      onClick={() => handleComplete(stage)}
                      disabled={!!acting}
                      className="btn-primary text-xs py-2 px-4
                                 bg-green-600 hover:bg-green-700
                                 flex items-center gap-1.5"
                    >
                      <ShieldCheck size={14} />
                      {isActing ? '...' : 'Sign Off & Release'}
                    </button>
                  )}

                  {/* Regular stage actions */}
                  {!isFinalQC && !isComplete && !isSkipped && !isSystemStage && (
                    <>
                      {isActive && (
                        <button
                          onClick={() => handleComplete(stage)}
                          disabled={!!acting}
                          className="btn-primary text-xs py-1.5 px-3
                                     bg-green-600 hover:bg-green-700"
                        >
                          {isActing ? '...' : 'Complete'}
                        </button>
                      )}
                      {!isActive && (
                        <button
                          onClick={() => handleActivate(stage)}
                          disabled={!!acting}
                          className="btn-primary text-xs py-1.5 px-3"
                        >
                          {isActing ? '...' : 'Activate'}
                        </button>
                      )}
                      <button
                        onClick={() => handleSkip(stage)}
                        disabled={!!acting}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        Skip
                      </button>
                    </>
                  )}

                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Final QC callout if not yet done */}
      {finalQCStage && finalQCStage.status !== 'complete' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl
                        px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700 font-medium">
              When all repairs are complete, click{' '}
              <strong>Sign Off &amp; Release</strong> on the Final Quality
              Check stage above to mark the vehicle as ready for collection.
            </p>
          </div>
        </div>
      )}

    </div>
  )
}