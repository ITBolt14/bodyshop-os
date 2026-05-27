// ===============================================
// BODYSHOP OS - Job List Page
// ===============================================

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Filter, X, ChevronUp,
  ChevronDown, RefreshCw, Eye
} from 'lucide-react'
import { supabase } from '../../../../lib/supabase'
import { useBranch } from '../../../../hooks/useBranch'

// SECTION: Constants
const ALL_STATUSES = [
  { value: 'draft',                     label: 'Draft'                  },
  { value: 'checked_in',                label: 'Checked In'             },
  { value: 'awaiting_assessment',       label: 'Awaiting Assessment'    },
  { value: 'awaiting_authorization',    label: 'Awaiting Authorization' },
  { value: 'authorized',                label: 'Authorized'             },
  { value: 'in_progress',               label: 'In Progress'            },
  { value: 'quality_check',             label: 'Quality Check'          },
  { value: 'awaiting_parts',            label: 'Awaiting Parts'         },
  { value: 'ready_for_collection',      label: 'Ready for Collection'   },
  { value: 'collected',                 label: 'Collected'              },
  { value: 'invoiced',                  label: 'Invoiced'               },
  { value: 'closed',                    label: 'Closed'                 },
  { value: 'cancelled',                 label: 'Cancelled'              },
]

const ALL_TYPES = [
  { value: 'insurance',     label: 'Insurance'  },
  { value: 'private',       label: 'Private'    },
  { value: 'warranty',      label: 'Warranty'   },
  { value: 'internal',      label: 'Internal'   },
]

const ALL_PRIORITIES = [
  { value: '1',     label: '🔴 Urgent'  },
  { value: '2',     label: '🟠 High'    },
  { value: '3',     label: '🟡 Normal'  },
  { value: '4',     label: '⚪ Low'     },
]

const STATUS_STYLES = {
  draft:                    'bg-gray-100 text-gray-600',
  checked_in:               'bg-blue-100 text-blue-700',
  awaiting_assessment:      'bg-purple-100 text-purple-700',
  awaiting_authorization:   'bg-yellow-100 text-yellow-700',
  authorized:               'bg-indigo-100 text-indigo-700',
  in_progress:              'bg-orange-100 text-orange-700',
  quality_check:            'bg-pink-100 text-pink-700',
  awaiting_parts:           'bg-red-100 text-red-700',
  ready_for_collection:     'bg-teal-100 text-teal-700',
  collected:                'bg-green-100 text-green-700',
  invoiced:                 'bg-cyan-100 text-cyan-700',
  closed:                   'bg-gray-100 text-gray-500',
  cancelled:                'bg-red-100 text-red-400',
}

const PRIORITY_MAP= {
  1: { label: 'Urgent', class: 'text-red-600 font-bold'     },
  2: { label: 'High',   class: 'text-orange-500 font-bold'  },
  3: { label: 'Normal', class: 'text-gray-400'              },
  4: { label: 'Low',    class: 'text-gray-300'              },
}

// SECTION: Sub-Components

function StatusBadge({ status }) {
  const label = status?.replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase()) ?? ''
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
                      uppercase tracking-wide whitespace-nowrap
                      ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  )
}

function FilterSelect({ label, value, onChange, options, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500 font-medium">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input-field text-sm py-1.5"
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function SortHeader({ label, field, sortField, sortDir, onSort }) {
  const active = sortField === field
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-brand-600 transition-colors"
    >
      {label}
      <span className="flex flex-col">
        <ChevronUp
          size={10}
          className={active && sortDir === 'asc'
            ? 'text-brand-600' : 'text-gray-300'}
        />
        <ChevronDown
          size={10}
          className={active && sortDir === 'desc'
            ? 'text-brand-600' : 'text-gray-300'}
        />
      </span>
    </button>
  )
}

// SECTION: Main Component
export function JobList() {

  const navigate     = useNavigate()
  const { branchId } = useBranch()

  // SECTION: State
  const [jobs,          setJobs]            = useState([])
  const [insurers,      setInsurer]         = useState([])
  const [loading,       setLoading]         = useState(true)
  const [totalCount,    setTotalCount]      = useState(0)
  const [showFilters,   setShowFilters]     = useState(false)

  // Filters
  const [search,            setSearch]          = useState('')
  const [filterStatus,      setFilterStatus]    = useState('')
  const [filterType,        setFilterType]      = useState('')
  const [filterPriority,    setFilterPriority]  = useState('')
  const [filterInsurer,     setFilterInsurer]   = useState('')
  const [dateFrom,          setDateFrom]        = useState('')
  const [dateTo,            setDateTo]          = useState('')

  // Sorting & Pagination
  const [sortField,     setSortField]   = useState('created_at')
  const [sortDir,       setSortDir]     = useState('desc')
  const [page,          setPage]        = useState(0)
  const PAGE_SIZE = 20

  // SECTION: Load Insurers for filter dropdown
  useEffect(() => {
    supabase
      .from('insurers')
      .select('id, name')
      .eq('active', true)
      .order('name')
      .then(({ data }) => { if (data) setInsurer(data) })
  }, [])

  // SECTION: Fetch Jobs
  const fetchJobs = useCallback(async () => {
    if (!branchId) return
    setLoading(true)

    // Base query - jobs only, no vehicle join
    let query = supabase
      .from('jobs')
      .select('id, job_number, status, job_type, priority, check_in_date, estimated_completion, created_at, insurer_id, vehicle_id', { count: 'exact' })
      .eq('branch_id', branchId)

    // Apply filters
    if (filterStatus)   query = query.eq('status', filterStatus)
    if (filterType)     query = query.eq('job_type', filterType)
    if (filterPriority) query = query.eq('priority', parseInt(filterPriority))
    if (filterInsurer)  query = query.eq('insurer_id', filterInsurer)
    if (dateFrom)       query = query.gte('check_in_date', dateFrom)
    if (dateTo)         query = query.lte('check_in_date', dateTo + 'T23:59:59')

    // Sorting
    query = query.order(sortField, { ascending: sortDir === 'asc' })

    // Pagination
    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    const { data: jobData, error, count } = await query

    if (error) {
      console.error('Jobs fetch error:', error.message)
      setLoading(false)
      return
    }

    // Fetch vehicles separately
    let vehicleMap = {}
    let claimMap   = {}

    if (jobData && jobData.length > 0) {
      const vehicleIds = [...new Set(jobData.map(j => j.vehicle_id).filter(Boolean))]
      const jobIds     = jobData.map(j => j.id)

      // Fetch vehicles
      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('id, registration, make, model, year, colour, owner_name, owner_phone')
        .in('id', vehicleIds)

      if (vehicleData) {
        vehicleMap = vehicleData.reduce((acc, v) => {
          acc[v.id] = v
          return acc
        }, {})
      }

      // Fetch claim numbers separately
      const { data: claimData } = await supabase
        .from('job_claims')
        .select('job_id, claim_number, policy_number')
        .in('job_id', jobIds)

      if (claimData) {
        claimMap = claimData.reduce((acc, c) => {
          acc[c.job_id] = c
          return acc
        }, {})
      }
    }

    // Merge everything
    const merged = (jobData || []).map(job => ({
      ...job,
      vehicle: vehicleMap[job.vehicle_id] || null,
      claim:   claimMap[job.id]           || null,
      insurer_id: job.insurer_id,
    }))

    setJobs(merged)
    setTotalCount(count ?? 0)
    setLoading(false)
  }, [
    branchId, filterStatus, filterType, filterPriority,
    filterInsurer, dateFrom, dateTo, sortField, sortDir,
    page
  ])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  //ESCTION: Search Filter (client-side on loaded page)
  const filtered = jobs.filter(job => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      job.job_number?.toLowerCase().includes(q)                 ||
      job.vehicle?.registration?.toLowerCase().includes(q)      ||
      job.vehicle?.make?.toLowerCase().includes(q)              ||
      job.vehicle?.model?.toLowerCase().includes(q)             ||
      job.vehicle?.owner_name?.toLowerCase().includes(q)        ||
      job.vehicle?.claim_number?.toLowerCase().includes(q)      ||
      job.vehicle?.policy_number?.toLowerCase().includes(q)
    )
  })

  // SECTION: Sort Handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
    setPage(0)
  }

  // SECTION: Clear Filters
  const clearFilters = () => {
    setFilterStatus('')
    setFilterType('')
    setFilterPriority('')
    setFilterInsurer('')
    setDateFrom('')
    setDateTo('')
    setSearch('')
    setPage(0)
  }

  const hasActiveFilters = filterStatus || filterType ||
    filterPriority || filterInsurer || dateFrom || dateTo

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // SECTION: Format Date
  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-ZA', {
        day: '2-digit', month: 'short', year: 'numeric'
      })
    : '-'

  // SECTION: Render
  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Jobs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading...' : `${totalCount} job${totalCount !== 1 ? 's' : ''} found`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchJobs}
            className="btn-secondary flex items-center gap-2 py-2"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className={`btn-secondary flex items-center gap-2 py-2
                        ${hasActiveFilters ? 'border-brand-400 text-brand-600' : ''}`}
            >
              <Filter size={15} />
              Filters
              {hasActiveFilters && (
                <span className="bg-brand-600 text-white text-[10px]
                                 rounded-full w-4 h-4 flex items-center
                                 justify-center font-bold">
                  !
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/main/jobs/checkin')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={15} /> New Check-In
            </button>
        </div>
      </div>

      {/* SECTION: Search Bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          className="input-field pl-9"
          placeholder="Search by job number, registration, owner name, claim number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2
                       text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* SECTION: Filters Panel */}
      {showFilters && (
        <div className="card">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <FilterSelect
              label="Status"
              value={filterStatus}
              onChange={v => { setFilterStatus(v); setPage(0) }}
              options={ALL_STATUSES}
              placeholder="All Statuses"
            />
            <FilterSelect
              label="Job Type"
              value={filterType}
              onChange={v => { setFilterType(v); setPage(0) }}
              options={ALL_TYPES}
              placeholder="All Types"
            />
            <FilterSelect
              label="Priority"
              value={filterPriority}
              onChange={v => { setFilterPriority(v); setPage(0) }}
              options={ALL_PRIORITIES}
              placeholder="All Priorities"
            />
            <FilterSelect
              label="Insurer"
              value={filterInsurer}
              onChange={v => { setFilterInsurer(v); setPage(0) }}
              options={insurers.map(i => ({ value: i.id, label: i.name }))}
              placeholder="All Insurers"
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">
                Check-In From
              </label>
              <input
                type="date"
                className="input-field text-sm py-1.5"
                value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setPage(0) }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">
                Check-In To
              </label>
              <input
                type="date"
                className="input-field text-sm py-1.5"
                value={dateTo}
                onChange={e => { setDateTo(e.target.value); setPage(0) }}
              />
            </div>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-xs text-red-500 hover:text-red-700
                         flex items-center gap-1"
            >
              <X size={12} /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* SECTION: Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            {/* Table Header */}
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold
                               text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  <SortHeader
                    label="Job #"
                    field="job_number"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />                              
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold
                               text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold
                               text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold
                               text-gray-500 uppercase tracking-wider">
                  Insurer
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold
                               text-gray-500 uppercase tracking-wider">
                  Claim #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold
                               text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold
                               text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold
                               text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  <SortHeader
                    label="Check-In"
                    field="check_in_date"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold
                               text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Est. Complete
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                // Loading skeleton
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(10)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={32} className="opacity-20" />
                      <p className="text-sm">No jobs found</p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="text-xs text-brand-600 hover:underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(job => (
                  <tr
                    key={job.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/main/jobs/${job.id}`)}
                  >
                    {/* Job Number */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold text-brand-700 text-xs">
                        {job.job_number}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-0.5 capitalize">
                        {job.job_type}
                      </p>
                    </td>

                    {/* Vehicle */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 text-xs">
                        {job.vehicle
                          ? `${job.vehicle.make} ${job.vehicle.model}`
                          : '-'
                        }
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {job.vehicle?.registration ?? '-'}
                        {job.vehicle?.year ? ` • ${job.vehicle.year}` : ''}
                        {job.vehicle?.colour ? ` • ${job.vehicle.colour}` : ''}
                      </p>
                    </td>

                    {/* Owner */}
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-800 font-medium">
                        {job.vehicle?.owner_name ?? '-'}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {job.vehicle?.owner_phone ?? ''}
                      </p>
                    </td>

                    {/* Insurer */}
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-700">
                        {insurers.find(i => i.id === job.insurer_id)?.name ?? '-'}
                      </p>
                    </td>

                    {/* Claim Number */}
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-700 font-mono">
                        {job.claim?.claim_number ?? '-'}
                      </p>
                      {job.claim?.policy_number && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {job.claim.policy_number}
                        </p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={job.status} />
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3">
                      <span className={`text-xs
                                        ${PRIORITY_MAP[job.priority]?.class
                                          ?? 'text-gray-400'}`}>
                        {PRIORITY_MAP[job.priority]?.label ?? '-'}
                      </span>
                    </td>

                    {/* Check-In Date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs text-gray-600">
                        {fmtDate(job.check_in_date)}
                      </p>
                    </td>

                    {/* Est. Completion */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className={`text-xs
                                     ${job.estimated_completion &&
                                       new Date(job.estimated_completion) < new Date() &&
                                       !['collected','closed','cancelled'].includes(job.status)
                                         ? 'text-red-500 font-semibold'
                                         : 'text-gray-600'
                                     }`}>
                        {fmtDate(job.estimated_completion)}
                      </p>
                    </td>

                    {/* View Button */}
                    <td className="px-4 py-3">
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          navigate(`/main/jobs/${job.id}`)
                        }}
                        className="p-1.5 rounded-lg text-gray-400
                                   hover:text-brand-600 hover:bg-brand-50
                                   transition-colors"
                        title="View job"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* SECTION: Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3
                          border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {page * PAGE_SIZE + 1}-
              {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(prev => Math.max(0, prev - 1))}
                disabled={page === 0}
                className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={page >= totalPages - 1}
                className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}