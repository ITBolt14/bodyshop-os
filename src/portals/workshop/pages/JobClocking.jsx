// =============================================
// BODYSHOP OS — Job Clocking Screen
// Stage flow: auto-complete on next clock-on
// System stages not clockable by technicians
// =============================================

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { getWorkshopUser, setWorkshopUser } from '../WorkshopPortal'
import { toast } from 'react-hot-toast'
import {
  ArrowLeft, Car, CheckCircle,
  Clock, Circle, AlertCircle,
  Lock, ChevronRight,
} from 'lucide-react'

// SECTION: Format elapsed time from a timestamp
const elapsed = (from) => {
  if (!from) return ''
  const mins = Math.round((new Date() - new Date(from)) / 60000)
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// SECTION: Format time HH:MM
const fmtTime = (d) => d
  ? new Date(d).toLocaleTimeString('en-ZA', {
      hour: '2-digit', minute: '2-digit',
    })
  : '—'

// SECTION: Format duration minutes to readable string
const fmtDuration = (mins) => {
  if (!mins) return ''
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function JobClocking() {

  const { token } = useParams()
  const navigate  = useNavigate()
  const user      = getWorkshopUser()

  // SECTION: State
  const [job,         setJob]         = useState(null)
  const [vehicle,     setVehicle]     = useState(null)
  const [stages,      setStages]      = useState([])
  const [allClocking, setAllClocking] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [clocking,    setClocking]    = useState(false)
  const [notFound,    setNotFound]    = useState(false)
  const [success,     setSuccess]     = useState(null)

  // SECTION: Fetch all job data
  const fetchData = async () => {
    setLoading(true)

    const { data: jobData } = await supabase
      .from('jobs')
      .select('*, vehicles(*)')
      .eq('qr_token', token)
      .maybeSingle()

    if (!jobData) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setJob(jobData)
    setVehicle(jobData.vehicles)

    const { data: stagesData } = await supabase
      .from('job_stages')
      .select('*')
      .eq('job_id', jobData.id)
      .order('sort_order', { ascending: true })

    if (stagesData) setStages(stagesData)

    const { data: clockData } = await supabase
      .from('workshop_clocking')
      .select('*, profiles(full_name)')
      .eq('job_id', jobData.id)
      .is('clocked_off_at', null)

    if (clockData) setAllClocking(clockData)

    setLoading(false)
  }

  useEffect(() => { if (token) fetchData() }, [token])

  // SECTION: Can this stage be clocked on to?
  const canClockOn = (stage) => {
    if (stage.status === 'complete') return false
    if (stage.status === 'skipped')  return false
    if (stage.system_stage)          return false
    const alreadyClockedOn = allClocking.find(
      c => c.job_stage_id === stage.id
    )
    if (alreadyClockedOn) return false
    return true
  }

  // SECTION: Clock On
  // DB trigger auto-completes previous stage and activates new one
  const handleClockOn = async (stage) => {
    if (!user || clocking) return
    setClocking(true)

    try {
      const { error: clockErr } = await supabase
        .from('workshop_clocking')
        .insert({
          branch_id:     job.branch_id,
          job_id:        job.id,
          job_stage_id:  stage.id,
          technician_id: user.id,
          clocked_on_at: new Date().toISOString(),
        })

      if (clockErr) throw new Error(clockErr.message)

      await supabase.from('audit_log').insert({
        branch_id:  job.branch_id,
        user_id:    user.id,
        portal:     'workshop',
        action:     'clocking.on',
        table_name: 'workshop_clocking',
        record_id:  job.id,
        new_value:  {
          stage:      stage.name,
          job_number: job.job_number,
          technician: user.full_name,
        },
      })

      setSuccess({
        technician: user.full_name,
        stage:      stage.name,
        job:        job.job_number,
        vehicle:    vehicle?.registration,
        time:       new Date().toISOString(),
      })

    } catch (err) {
      console.error('Clock on error:', err)
      toast.error('Failed to clock on. Please try again.')
      setClocking(false)
    }
  }

  // SECTION: Auto logout after success
  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => {
      setWorkshopUser(null)
      navigate('/workshop/login', { replace: true })
    }, 4000)
    return () => clearTimeout(timer)
  }, [success])

  // SECTION: Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center
                      justify-center">
        <div className="w-14 h-14 border-4 border-brand-500
                        border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // SECTION: Not Found
  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center
                      justify-center px-6 text-center">
        <AlertCircle size={56} className="text-red-500 mb-4" />
        <h2 className="text-white text-2xl font-bold mb-2">Job Not Found</h2>
        <p className="text-gray-400 mb-8">
          This QR code does not match any active job.
          Please ask reception for a new sticker.
        </p>
        <button
          onClick={() => navigate('/workshop/home')}
          className="bg-brand-600 text-white font-bold rounded-xl
                     px-8 py-4 text-lg"
        >
          Go Back
        </button>
      </div>
    )
  }

  // SECTION: Success Screen
  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center
                      justify-center px-6 text-center">

        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center
                        justify-center mb-6 shadow-2xl shadow-green-900">
          <CheckCircle size={52} className="text-white" />
        </div>

        <h2 className="text-white text-3xl font-black mb-2">Clocked On!</h2>
        <p className="text-green-400 text-xl font-bold mb-1">
          {success.technician}
        </p>
        <p className="text-white text-lg mb-1">{success.stage}</p>
        <p className="text-gray-500 text-base">
          {success.job} · {success.vehicle}
        </p>
        <p className="text-gray-600 text-sm mt-1">{fmtTime(success.time)}</p>

        <div className="mt-10 bg-gray-800 rounded-2xl px-6 py-4">
          <p className="text-gray-500 text-sm">Returning to login screen...</p>
        </div>

        <button
          onClick={() => {
            setWorkshopUser(null)
            navigate('/workshop/login', { replace: true })
          }}
          className="mt-4 text-gray-600 hover:text-gray-400 text-sm
                     transition-colors"
        >
          Return now
        </button>

      </div>
    )
  }

  // SECTION: Progress stats
  const doneCount  = stages.filter(s => s.status === 'complete').length
  const totalCount = stages.filter(s => !s.system_stage).length
  const pct        = totalCount > 0
    ? Math.round((doneCount / totalCount) * 100) : 0

  // SECTION: Render Stage List
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">

      {/* Top Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-5 py-4
                      flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate('/workshop/home')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={26} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-brand-400 font-black text-xl leading-tight">
            {job.job_number}
          </p>
          <p className="text-gray-400 text-sm truncate">
            {vehicle?.make} {vehicle?.model} · {vehicle?.registration}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-white text-sm font-bold">
            {user?.full_name?.split(' ')[0]}
          </p>
          <p className="text-gray-500 text-xs">
            {user?.workshop_role?.name ?? 'Technician'}
          </p>
        </div>
      </div>

      {/* Vehicle + Progress Strip */}
      <div className="border-b border-gray-700/50 px-5 py-3">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <Car size={14} className="text-gray-600 shrink-0" />
            <p className="text-gray-500 text-sm">
              {vehicle?.owner_name}
              {vehicle?.colour ? ` · ${vehicle.colour}` : ''}
            </p>
          </div>
          <p className="text-gray-500 text-xs shrink-0">
            {doneCount} of {totalCount} done · {pct}%
          </p>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div
            className="bg-brand-500 h-1.5 rounded-full transition-all
                       duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Stages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">

        <p className="text-gray-600 text-xs uppercase tracking-wider
                      font-semibold px-1 mb-3">
          Tap a stage to clock on
        </p>

        {stages.map((stage) => {

          const isComplete    = stage.status === 'complete'
          const isSkipped     = stage.status === 'skipped'
          const isActive      = stage.status === 'active'
          const isSystemStage = stage.system_stage
          const clockedOnBy   = allClocking.find(
            c => c.job_stage_id === stage.id
          )
          const isMySession   = clockedOnBy?.technician_id === user?.id
          const canClock      = canClockOn(stage)

          // Card style based on state
          let cardBg    = 'bg-gray-800 border-gray-700'
          let textColor = 'text-white'

          if (isComplete) {
            cardBg    = 'bg-green-900/20 border-green-800'
            textColor = 'text-green-400'
          } else if (isActive && clockedOnBy) {
            cardBg    = 'bg-blue-900/30 border-blue-700'
            textColor = 'text-blue-300'
          } else if (isSystemStage) {
            cardBg    = 'bg-gray-800/40 border-gray-800'
            textColor = 'text-gray-600'
          } else if (canClock) {
            cardBg    = 'bg-gray-800 border-gray-600 hover:border-brand-500'
            textColor = 'text-white'
          }

          return (
            <div
              key={stage.id}
              className={`rounded-2xl border p-4 transition-all
                          duration-200 ${cardBg}
                          ${isSkipped ? 'opacity-40' : ''}`}
            >
              <div className="flex items-center gap-4">

                {/* Icon */}
                <div className="shrink-0">
                  {isComplete ? (
                    <CheckCircle size={26} className="text-green-500" />
                  ) : isActive && clockedOnBy ? (
                    <Clock size={26} className="text-blue-400" />
                  ) : isSystemStage ? (
                    <Lock size={22} className="text-gray-700" />
                  ) : (
                    <Circle size={26} className="text-gray-600" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">

                  <p className={`font-bold text-base leading-tight
                                 ${textColor}`}>
                    {stage.sort_order}. {stage.name}
                  </p>

                  {/* System stage note */}
                  {isSystemStage && !isComplete && (
                    <p className="text-gray-700 text-xs mt-0.5">
                      Set by reception
                    </p>
                  )}

                  {/* Completion details */}
                  {isComplete && (
                    <p className="text-green-700 text-xs mt-0.5">
                      {stage.completed_at
                        ? `Completed ${fmtTime(stage.completed_at)}`
                        : 'Complete'
                      }
                      {stage.duration_minutes
                        ? ` · ${fmtDuration(stage.duration_minutes)}`
                        : ''
                      }
                    </p>
                  )}

                  {/* Active clocking — who and elapsed */}
                  {isActive && clockedOnBy && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full
                                      animate-pulse shrink-0" />
                      <p className="text-blue-400 text-xs font-medium">
                        {isMySession
                          ? 'You'
                          : clockedOnBy.profiles?.full_name
                        }
                        {' · '}{elapsed(clockedOnBy.clocked_on_at)}
                      </p>
                    </div>
                  )}

                </div>

                {/* Clock On Button */}
                {canClock && (
                  <button
                    onClick={() => handleClockOn(stage)}
                    disabled={clocking}
                    className="shrink-0 bg-brand-600 hover:bg-brand-500
                               active:bg-brand-700 text-white font-bold
                               rounded-xl px-5 py-3 text-sm transition-all
                               active:scale-95 disabled:opacity-50
                               shadow-lg shadow-brand-900/50
                               flex items-center gap-1.5"
                  >
                    {clocking
                      ? <div className="w-4 h-4 border-2 border-white
                                        border-t-transparent rounded-full
                                        animate-spin" />
                      : <>CLOCK ON <ChevronRight size={14} /></>
                    }
                  </button>
                )}

                {/* Someone else is on this stage */}
                {isActive && clockedOnBy && !isMySession && (
                  <span className="shrink-0 text-xs text-blue-500
                                   bg-blue-900/30 px-3 py-1.5 rounded-xl
                                   font-medium whitespace-nowrap">
                    In progress
                  </span>
                )}

              </div>
            </div>
          )
        })}

        <div className="h-6" />
      </div>
    </div>
  )
}