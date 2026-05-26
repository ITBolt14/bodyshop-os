// ===============================================
// BODYSHOP OS - Job Detail Header
// ===============================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Edit2, Save, X, ChevronDown
} from 'lucide-react'
import { supabase } from '../../../../../lib/supabase'
import { useAuth } from '../../../../../hooks/useAuth'
import { useBranch } from '../../../../../hooks/useBranch'
import { toast } from 'react-hot-toast'
import { QrCode } from 'lucide-react'

// SECTION: Constants
const STATUS_STYLES = {
  draft:                    'bg-gray-100 text-gray-600',
  checked_in:               'bg-blue-100 text-blue-700',
  awaiting_assessment:      'bg-purple-100 text-purple-700',
  awaiting_authorization:   'bg-yellow-100 text-yellow-700',
  autorized:                'bg-indigo-100 text-indigo-700',
  in_progress:              'bg-orange-100 text-orange-700',
  quality_check:            'bg-pink-100 text-pink-100',
  awaiting_parts:           'bg-red-100 text-red-700',
  ready_for_collection:     'bg-teal-100 text-teal-700',
  collected:                'bg-green-100 text-graan-700',
  invoiced:                 'bg-cyan-100 text-cyan-700',
  closed:                   'bg-gray-100 text-gray-500',
  cancelled:                'bg-red-100 text-red-400',
}

const ALL_STATUSES = [
  'draft', 'checked_in', 'awaiting_assessment',
  'awaiting_authorization', 'authorized', 'in_progress',
  'quality_check', 'awaiting_parts', 'ready_for_collection',
  'collected', 'invoiced', 'closed', 'cancelled',
]

const PRIORITY_MAP = {
  1: { label: 'Urgent', class: 'text-red-600' },
  2: { label: 'High', class: 'text-orange-500' },
  3: { label: 'Normal', class: 'text-gray-500' },
  4: { label: 'Low', class: 'text-gray-300' },
}

export function JobDetailHeader({
  job,
  editMode,
  onEditToggle,
  onJobUpdated,
}) {

  // SECTION: State
  const [statusOpen,        setStatusOpen]      = useState(false)
  const [changingStatus,    setChangingStatus]  = useState(false)

  const { profile }     = useAuth()
  const { branchId }    = useBranch()
  const navigate        = useNavigate()

  // SECTION: State Change
  const handleStatusChange = async (newStatus) => {
    if (newStatus === job.status) {
      setStatusOpen(false)
      return
    }

    setChangingStatus(true)
    setStatusOpen(false)

    const oldStatus = job.status

    const { error } = await supabase
      .from('jobs')
      .update({ status: newStatus })
      .eq('id', job.id)

    if (error) {
      toast.error('Failed to update status')
      setChangingStatus(false)
      return
    }

    // Write audit log
    await supabase.from('audit_log').insert({
      branch_id:    branchId,
      user_id:      profile.id,
      portal:       'main',
      action:       'job.status.changed',
      table_name:   'jobs',
      record_id:    job.id,
      old_value:    { status: oldStatus },
      new_value:    { status: newStatus },
    })

    toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`)
    setChangingStatus(false)
    onJobUpdated()
  }

  const statusLabel = job.status
    ?.replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())

  // SECTION: Render
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-[1400px] mx-auto">

        {/* Top Row */}
        <div className="flex items-center justify-between gap-4">
          
          {/* Left - Back + Job Number */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/main/jobs')}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600
                         hover:bg-gray-100 transition-colors shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-brand-700">
                  {job.job_number}
                </h1>
                <span className={`text-xs font-semibold px-2 py-0.5
                                  rounded-full uppercase tracking-wide
                                  ${STATUS_STYLES[job.status]
                                    ?? 'bg-gray-100 text-gray-600'}`}>
                  {statusLabel}
                </span>
                <span className={`text-xs font-bold
                                  ${PRIORITY_MAP[job.priority]?.class
                                    ?? 'text-gray-400'}`}>
                  {PRIORITY_MAP[job.priority]?.label ?? ''}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5 truncate">
                {job.vehicles?.make} {job.vehicles?.model}
                {job.vehicles?.registration
                  ? ` - ${job.vehicles.registration}`
                  : ''
                }
              </p>
            </div>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Status Dropdown */}
            <div className="relative">
              {/* QR Sticker Button */}
              <button
                onClick={() => navigate(`/main/jobs/${job.id}/sticker`)}
                className="btn-secondary flex items-center gap-2 py-2 text-sm"
              >
                <QrCode size={14} /> Print QR Sticker
              </button>
              <button
                onClick={() => setStatusOpen(prev => !prev)}
                disabled={changingStatus || editMode}
                className="btn-secondary flex items-center gap-2 py-2 text-sm"
              >
                {changingStatus ? 'Updating...' : 'Change Status'}
                <ChevronDown size={14} />
              </button>

              {statusOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white
                                rounded-xl shadow-lg border border-gray-100
                                py-1 z-50 max-h-72 overflow-y-auto">
                  {ALL_STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`w-full text-left px-4 py-2.5 text-sm
                                  hover:bg-gray-50 transition-colors flex
                                  items-center gap-2
                                  ${s === job.status
                                    ? 'font-semibold text-brand-700'
                                    : 'text-gray-700'
                                  }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0
                                        ${STATUS_STYLES[s]
                                          ?.split(' ')[0]
                                          .replace('text', 'bg')
                                          ?? 'bg-gray-300'}`}
                      />
                      {s.replace(/_/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Edit Toggle */}
            {!editMode ? (
              <button
                onClick={onEditToggle}
                className="btn-primary flex items-center gap-2 py-2 text-sm"
              >
                <Edit2 size={14} /> Edit Job
              </button>
            ) : (
              <button
                onClick={onEditToggle}
                className="btn-secondary flex items-center gap-2 py-2 text-sm
                           border-red-300 text-red-600 hover:bg-red-50"
              >
                <X size={14} /> Cancel Edit
              </button>
            )}
            
          </div>
        </div>
      </div>
    </div>
  )
}