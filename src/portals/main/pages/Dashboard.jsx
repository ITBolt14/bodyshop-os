// ===============================================
// BODYSHOP OS - Main Dashboard
// ===============================================

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase, Clock, CheckCircle, AlertCircle,
  TrendingUp, Users, Bell, ArrowRight,
  Car, Wrench, FileText, DollarSign
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../hooks/useAuth'
import { useBranch } from '../../../hooks/useBranch'

// SECTION: Stat Card Component
function StatCard({ label, value, icon: Icon, color, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`card text-left w-full hover:shadow-md transition-shadow
                  duration-200 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase
                        tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
          {sub && (
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </button>
  )
}

// SECTION: Status Badge Component
function StatusBadge({ status }) {
  const map = {
    draft:                      'bg-gray-100 text-gray-600',
    checked_in:                 'bg-blue-100 text-blue-700',
    awaiting_assessment:        'bg-purple-100 text-purple-700',
    awaiting_authorization:     'bg-yellow-100 text-yellow-700',
    authorized:                 'bg-indigo-100 text-indigo-700',
    in_progress:                'bg-orange-100 text-orange-700',
    quality_check:              'bg-pink-100 text-pink-700',
    awaiting_parts:             'bg-red-100 text-red-700',
    ready_for_collection:       'bg-teal-100 text-teal-700',
    collected:                  'bg-green-100 text-green-700',
    invoiced:                   'bg-cyan-100 text-cyan-100',
    closed:                     'bg-gray-100 text-gray-500',
    cancelled:                  'bg-red-100 text-red-400',
  }
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
                      uppercase tracking-wide ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  )
}

// SECTION: Priority Badge Component
function PriorityBadge({ priority }) {
  const map = {
    1: { label: 'Urgent',   class: 'text-red-600' },
    2: { label: 'High',     class: 'text-orange-500' },
    3: { label: 'Normal',   class: 'text-gray-400' },
    4: { label: 'Low',      class: 'text-gray-300' },
  }
  const p = map[priority] ?? map[3]
  return (
    <span className={`text-[10px] font-bold ${p.class}`}>
      {p.label}
    </span>
  )
}

// SECTION: Main Dashboard Component
export function Dashboard() {

  const { profile }     = useAuth()
  const { branchId }    = useBranch()
  const navigate        = useNavigate()

  //SECTION: State
  const [stats,         setStats]           = useState(null)
  const [recentJobs,    setRecentJobs]      = useState([])
  const [notifications, setNotifications]   = useState([])
  const [loading,       setLoading]         = useState(true)

  // SECTION: Fetch Dashboard Data
  useEffect(() => {
    if (!branchId) return
    fetchDashboard()
  }, [branchId])

  // SECTION: Fetch Dashboard Data
  const fetchDashboard = async () => {
    setLoading(true)

    // Step 1 — Fetch jobs only, no vehicle join
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('id, status, priority, job_number, created_at, vehicle_id')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false })

    if (jobError) {
      console.error('Jobs fetch error:', jobError.message)
      setLoading(false)
      return
    }

    // Step 2 — Fetch vehicles separately using vehicle IDs from jobs
    let vehicleMap = {}
    if (jobData && jobData.length > 0) {
      const vehicleIds = [...new Set(jobData.map(j => j.vehicle_id).filter(Boolean))]

      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id, make, model, registration')
        .in('id', vehicleIds)

      if (vehicleError) {
        console.error('Vehicles fetch error:', vehicleError.message)
      } else if (vehicleData) {
        vehicleMap = vehicleData.reduce((acc, v) => {
          acc[v.id] = v
          return acc
        }, {})
      }
    }

    // Step 3 — Merge vehicle data into jobs
    const mergedJobs = (jobData || []).map(job => ({
      ...job,
      vehicles: vehicleMap[job.vehicle_id] || null
    }))

    // Step 4 — Fetch pending notifications
    const { data: notifData, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('branch_id', branchId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)

    if (notifError) console.error('Notifications fetch error:', notifError.message)

    // Step 5 — Calculate stats
    if (mergedJobs.length >= 0) {
      const today = new Date().toISOString().split('T')[0]

      setStats({
        totalActive:         mergedJobs.filter(j =>
                               !['closed','cancelled','collected'].includes(j.status)
                             ).length,
        checkedInToday:      mergedJobs.filter(j =>
                               j.created_at?.startsWith(today)
                             ).length,
        readyForCollection:  mergedJobs.filter(j =>
                               j.status === 'ready_for_collection'
                             ).length,
        awaitingAuth:        mergedJobs.filter(j =>
                               j.status === 'awaiting_authorization'
                             ).length,
        inProgress:          mergedJobs.filter(j =>
                               j.status === 'in_progress'
                             ).length,
        awaitingParts:       mergedJobs.filter(j =>
                               j.status === 'awaiting_parts'
                             ).length,
      })

      setRecentJobs(mergedJobs.slice(0, 8))
    }

    if (notifData) setNotifications(notifData)

    setLoading(false)
  }

  // SECTION: Loading State
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-28 bg-gray-100" />
          ))}
        </div>
        <div className="card h-64 bg-gray-100" />
      </div>
    )
  }

  // SECTION: Render
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
    
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Good {getGreeting()}, {profile?.full_name?.split(' ')[0]}.
            Here's what's happening today.
          </p>
        </div>
        <p className="text-xs text-gray-400 hidden sm:block">
          {new Date().toLocaleDateString('en-ZA', {
            weekday: 'long', year: 'numeric',
            month: 'long',   day: 'numeric'
          })}
        </p>
      </div>

      {/* SECTION: Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Jobs"
          value={stats?.totalActive ?? 0}
          icon={Briefcase}
          color="bg-brand-600"
          sub="Currently in workshop"
          onClick={() => navigate('/main/jobs')}
        />
        <StatCard
          label="Checked In Today"
          value={stats?.checkedInToday ?? 0}
          icon={Car}
          color="bg-blue-500"
          sub="New arrivals"
          onClick={() => navigate('/main/jobs')}
        />
        <StatCard
          label="Ready for Collection"
          value={stats?.readyForCollection ?? 0}
          icon={CheckCircle}
          color="bg-green-500"
          sub="Awaiting customer pickup"
          onClick={() => navigate('/main/jobs')}
        />
        <StatCard
          label="Awaiting Auth"
          value={stats?.awaitingAuth ?? 0}
          icon={AlertCircle}
          color="bg-amber-500"
          sub="Pending insurer approval"
          onClick={() => navigate('/main/insurance')}
        />
      </div>

      {/* SECTION: Secondary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="In Progress"
          value={stats?.inProgress ?? 0}
          icon={Wrench}
          color="bg-orange-500"
          sub="Active repairs"
        />
        <StatCard
          label="Awaiting Parts"
          value={stats?.awaitingParts ?? 0}
          icon={Clock}
          color="bg-red-500"
          sub="Parts not yet received"
        />
      </div>

      {/* SECTION: Bottom Grid - Recent Jobs + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Jobs Table */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4
                          border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm">Recent Jobs</h2>
            <button
              onClick={() => navigate('/main/jobs')}
              className="flex items-center gap-1 text-xs text-brand-600
                         hover:text-brand-700 font-medium"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>

          {recentJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center
                            py-16 text-gray-400">
              <Briefcase size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No jobs yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentJobs.map(job => (
                <button
                  key={job.id}
                  onClick={() => navigate(`/main/jobs/${job.id}`)}
                  className="w-full flex items-center justify-between
                             px-5 py-3 hover:bg-gray-50 transition-colors
                             text-left"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-700">
                        {job.job_number}
                      </span>
                      <PriorityBadge priority={job.priority} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {job.vehicles?.make} {job.vehicles?.model} -{' '}
                      {job.vehicles?.registration}
                    </p>
                  </div>
                  <div className="shrink-0 ml-3">
                    <StatusBadge status={job.status} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Panel */}
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4
                          border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm">
              Pending Notifications
            </h2>
            <Bell size={15} className="text-gray-400" />
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center
                            py-16 text-gray-400">
              <Bell size={32} className="mb-2 opacity-30" />
              <p className="text-sm">All clear</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map(n => (
                <div key={n.id} className="px-5 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase
                                      px-1.5 py-0.5 rounded-full
                                      ${n.channel === 'whatsapp'
                                        ? 'bg-green-100 text-green-700'
                                        : n.channel === 'sms'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-600'
                                      }`}>
                      {n.channel}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(n.created_at).toLocaleTimeString('en-ZA', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {n.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// SECTION: Greeting Helper
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  return 'evening'
}