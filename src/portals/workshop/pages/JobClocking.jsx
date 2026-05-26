// ===============================================
// BODYSHOP OS - Job Clocking Screen
// Shows stages, permissions, clock-on + auto logout
// ===============================================

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { getWorkshopUser, setWorkshopUser } from '../WorkshopPortal'
import { toast } from 'react-hot-toast'
import {
  ArrowLeft, Car, CheckCircle,
  Clock, Circle, Lock,
  User, AlertCircle, LogOut
} from 'lucide-react'

// SECTION: Format elapsed time
const elapsed = (from) => {
  if (!from) return ''
  const mins = Math.round((new Date() - new Date(from)) / 60000)
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const fmtTime = (d) => d
  ? new Date(d).toLocaleTimeString('en-ZA', {
      hour: '2-digit', minute: '2-digit'
    })
  : '-'

export function JobClocking() {

  const { token } = useParams()
  const navigate  = useNavigate()
  const user      = getWorkshopUser()

  // SECTION: State
  const [ job,          setJob]         = useState(null)
  const [vehicle,       setVehicle]     = useState(null)
  const [stages,        setStages]      = useState([])
  const [allClocking,   setAllClocking] = useState([])
  const [loading,       setLoading]     = useState(true)
  const [clocking,      setClocking]    = useState(false)
  const [notFound,      setNotFound]    = useState(false)
  const [success,       setSuccess]     = useState(null)

  // SECTION: Fetch job data
  const fetchData = async () => {
    setLoading(true)

    // Find job by QR token
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

    // Fetch stages with allwed role info
    const { data: stagesData } = await supabase
      .from('job_stages')
      .select('*, workshop_roles(id, name, colour)')
      .eq('job_id', jobData.id)
      .order('sort_order', { ascending: true })

    if (stagesData) setStages(stagesData)

    // Fetch active clocking sessions for this job
    const { data: clockData } = await supabase
      .from('workshop_clocking')
      .select('*, profiles(full_name)')
      .eq('job_id', jobData.id)
      .is('clocked_off_at', null)

    if (clockData) setAllClocking(clockData)

    setLoading(false)
  }

  useEffect(() => { if (token) fetchData() }, [token])

  // SECTION: Check if current user can clock on to a stage
  const canUserClockOn = (stage) => {
    if (!user) return false
    // If stage has no role restriction, anyone can clock on
    if (!stage.allowed_role_id) return true
    // Otherwise user's workshop role must match
    return user.workshop_role_id === stage.allwed_role_id
  }

  // SECTION: Check if stage is available to clock on
  const isAvailable = (stage, index) => {
    if (stage.status === 'complete' || stage.status === 'skipped') return false
    // Check someone else is already on it
    const alreadyClockedOn = allClocking.find(
      c => c.job_stage_id === stage.id
    )
    if (alreadyClockedOn) return false
    // Check previous stage is done
    const prevDone = index === 0 ||
      ['complete', 'skipped'].includes(stages[index - 1]?.status)
    return prevDone
  }

  // SECTION: Clock On handler
  const handleClockOn = async (stage) => {
    if (!user || clocking) return
    setClocking(true)

    try {
      // Insert clocking record
      // DB trigger auto-closes previous session
      const { error: clockErr } = await supabase
        .from('workshop_clocking')
        .insert({
          branch_id:      job.branch_id,
          job_id:         job.id,
          job_stage_id:   stage.id,
          technician_id:  user.id,
          clocked_on_at:  new Date().toISOString(),
        })

      if (clockErr) throw new Error(clockErr.message)

      // Activate stage if pending
      if (stage.status === 'pending') {
        await supabase
          .from('job_stages')
          .update({
            status:       'active',
            started_at:   new Date().toISOString(),
          })
          .eq('id', stage.id)
      }

      // Update job status if needed
      if (['checked_in', 'authorized'].includes(job.status)) {
        await supabase
          .from('jobs')
          .update({ status: 'in_progress' })
          .eq('id', job.id)
      }

      // Audit log
      await supabase.from('audit_log').insert({
        branch_id:    job.branch_id,
        user_id:      user.id,
        portal:       'workshop',
        action:       'clocking.on',
        table_name:   'workshop_clocking',
        record_id:    job.id,
        new_value:    {
          stage:        stage.name,
          job_number:   job.job_number,
          technician:   user.full_name,
        },
      })

      // Show success screen then auto-logout
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

  // SECTION: Success screen - auto logout after 4 seconds
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
          onClick={() => navigate('workshop/home')}
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

        {/* Success Icon */}
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center
                        justify-center mb-6 shadow-2xl shadow-green-900">
          <CheckCirle size={52} className="text-white" />
        </div>

        <h2 className="text-white text-3xl font-black mb-2">
          Clocked On!
        </h2>

        <p className="text-green-400 text-xl font-bold mb-1">
          {success.technician}
        </p>
        <p className="text-gray-300 text-lg mb-1">
          {success.stage}
        </p>
        <p className="text-gray-500 text-base">
          {success.job} • {success.vehicle}
        </p>
        <p className="text-gray-600 text-sm mt-2">
          {fmtTime(success.time)}
        </p>

        {/* Auto logout countdown */}
        <div className="mt-10 bg-gray-800 rounded-2xl px-6 py-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <LogOut size={16} />
            <span>Returning to login screen in a moment...</span>
          </div>
        </div>

        {/* Manual logout button */}
        <button
          onClick={() => {
            setWorkshopUser(null)
            navigate('/workshop/login', { replace: true })
          }}
          className="mt-4 text-gray-600 hover:text-gray-400
                     text-sm transition-colors"
        >
          Return to login now
        </button>

      </div>
    )
  }

  // SECTION: Main Render - Stage List
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
            {vehicle?.make} {vehicle?.model} • {vehicle?.registration}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-white text-sm font-bold">
            {user?.full_name?.split(' ')[0]}
          </p>
          <p className="text-gray-500 text-xs">
            {user?.workshop_role?.name}
          </p>
        </div>
      </div>

      {/* Owner Strip */}
      <div className="bg-gray-850 border-b border-gray-700/50 px-5 py-2.5">
        <div className="flex items-center gap-2">
          <Car size={14} className="text-gray-600 shrink-0" />
          <p className="text-gray-500 text-sm">
            {vehicle?.owner_name}
            {vehicle?.colour ? ` • ${vehicle.colour}` : ''}
          </p>
        </div>
      </div>

      {/* Stages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">

        <p className="text-gray-600 text-xs uppercase tracking-wider
                      font-semibold px-1 mb-3">
          Workshop Stages - tap to clock on
        </p>

        {stages.map((stage, index) => {
          const isComplete    = stage.status === 'complete'
          const isSkipped     = stage.status === 'skipped'
          const isActive      = stage.status === 'active'
          const available     = isAvailable(stage, index)
          const userAllowed   = canUserClockOn(stage)
          const clockedOnBy   = allClocking.find(c => c.job_stage_id === stage.id)
          const canPress      = available && userAllowed && !isComplete && !isSkipped

          // Determine visual state
          let cardStyle = 'bg-gray-800 border-gray-700'
          if (isComplete) cardStyle = 'bg-green-900/20 border-green-800'
          else if (isActive && clockedOnBy) cardStyle = 'bg-blue-900/30 border-blue-700'
          else if (canPress) cardStyle = 'bg-gray-800 border-gray-600 hover:border-brand-500'
          else if (!userAllowed && !isComplete && !isSkipped)
            cardStyle = 'bg-gray-800/50 border-gray-800 opcaity-60'

          return (
            <div
              key={stage.id}
              className={`rounded-2xl border p-4 trnasition-all
                          duration-200 ${cardStyle}
                          ${isSkipped ? 'opacity-40' : ''}`}
            >
              <div className="flex items-center gap-4">

                {/* Status Icon */}
                <div className="shrink-0">
                  {isComplete ? (
                    <CheckCircle size={26} className="text-green-500" />
                  ) : isActive && clockedOnBy ? (
                    <Clock size={26} className="text-blue-400" />
                  ) : !userAllowed && !isComplete ? (
                    <Lock size={22} className="text-gray-600" />
                  ) : (
                    <Circle size={26} className="text-gray-600" />
                  )}
                </div>

                {/* Stage Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-bold text-base leading-tight
                                   ${isComplete ? 'text-green-400'
                                   : isSkipped  ? 'text-gray-600'
                                   : canPress   ? 'text-white'
                                   : !userAllowed? 'text-gray-600'
                                   : 'text-gray-300'}`}>
                      {stage.sort_order}. {stage.name}
                    </p>
                  </div>

                  {/* Role Badge */}
                  {stage.workshop_roles?.name && (
                    <p className={`text-xs mt-0.5
                                   ${userAllowed
                                    ? 'text-brand-400'
                                    : 'text-gray-600'
                                   }`}>
                      {stage.workshop_roles.name}
                      {!userAllowed && !isComplete && '- not your stage'}
                    </p>
                  )}

                  {/* Competion Time */}
                  {isComplete && stage.completed_at && (
                    <p className="text-green-600 text-xs mt-0.5">
                      Completed {fmtTime(stage.completed_at)}
                      {stage.duration_minutes && (
                        <> • {stage.duration_minutes}m</>
                      )}
                    </p>
                  )}

                  {/* Active clocking info */}
                  {isActive && clockedOnBy && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full
                                      animate-pulse" />
                      <p className="text-blue-400 text-xs font-medium">
                        {clockedOnBy.profiles?.full_name} •{' '}
                        {elapsed(clockedOnBy.clocked_on_at)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Clock On Button */}
                {canPress && (
                  <button
                    onClick={() => handleClockOn(stage)}
                    disabled={clocking}
                    className="shrink-0 bg-brand-600 hover:bg-brand-500
                               active:bg-brand-700 text-white font-bold
                               rounded-xl px-5 py-3 text-sm transition-all
                               active:scale-95 disabled:opacity-50
                               shadow-lg shadow-brand-900"
                  >
                    {clocking ? '...' : 'CLOCK ON'}
                  </button>
                )}

              </div>
            </div>
          )
        })}

        {stages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-600">No stages set up for this job</p>
          </div>
        )}

      </div>

    </div>
  )
}