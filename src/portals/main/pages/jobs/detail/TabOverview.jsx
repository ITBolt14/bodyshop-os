// ===============================================
// BODYSHOP OS - Job Details Tab: Overview
// ===============================================

import { useState } from 'react'
import { Save } from 'lucide-react'
import { supabase } from '../../../../../lib/supabase'
import { useAuth } from '../../../../../hooks/useAuth'
import { useBranch } from '../../../../../hooks/useBranch'
import { StatusTimeline } from './StatusTimeline'
import { toast } from 'react-hot-toast'

const PRIORITIES = [
  { value: 1, label: '🔴 Urgent' },
  { value: 2, label: '🟠 High'   },
  { value: 3, label: '🟡 Normal' },
  { value: 4, label: '⚪ Low'    },
]

// SECTION: View Field Helper
function ViewField({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase
                    tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-medium">
        {value || <span className="text-gray-300 font-normal">-</span>}
      </p>
    </div>
  )
}

export function TabOverview({
  job,
  vehicle,
  insurers,
  auditLogs,
  editMode,
  onSaved,
}) {

  // SECTION: Edit State
  const [form,      setForm]    = useState({
    job_type:               job.job_type,
    priority:               job.priority,
    insurer_id:             job.insurer_id      ?? '',
    check_in_date:          job.check_in_date
      ? job.check_in_date.split('T')[0] : '',
    estimated_completion:   job.estimated_completion ?? '',
    special_instructions:   job.special_instructions ?? '',
    internal_notes:         job.internal_notes       ?? '',
  })
  const [saving,    setSaving]  = useState(false)

  const { profile }     = useAuth()
  const { branchId }    = useBranch()

  // SECTION: Save Handler
  const handleSave = async () => {
    setSaving(true)

    const { error } = await supabase
      .from('jobs')
      .update({
        job_type:               form.job_type,
        priority:               form.priority,
        insurer_id:             form.insurer_id             || null,
        check_in_date:          form.check_in_date          || null,
        estimated_completion:   form.estimated_completion   || null,
        special_instructions:   form.special_instructions   || null,
        internal_notes:         form.internal_notes         || null,
      })
      .eq('id', job.id)

    if (error) {
      toast.error('Failed to save changes')
      setSaving(false)
      return
    }

    // Audit Log
    await supabase.from('audit_log').insert({
      branch_id:    branchId,
      user_id:      profile.id,
      portal:       'main',
      action:       'job.updated',
      table_name:   'jobs',
      record_id:    job.id,
      old_value:    {
        job_type:     job.job_type,
        priority:     job.priority,
        insurer_id:   job.insurer_id,
      },
      new_value:    form,
    })

    toast.success('Job updated successfully')
    setSaving(false)
    onSaved()
  }

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-ZA', {
        day: '2-digit', month: 'long', year: 'numeric'
      })
    : '-'

  // SECTION: Render
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Left - Job + Vehicle Info */}
      <div className="lg:col-span-2 space-y-6">

        {/* Vehicle Card */}
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm
                         uppercase tracking-wider">
            Vehicle Details
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <ViewField label="Registration" value={vehicle?.registration} />
            <ViewField label="VIN"          value={vehicle?.vin} />
            <ViewField label="Make"         value={vehicle?.make} />
            <ViewField label="Model"        value={vehicle?.model} />
            <ViewField label="Year"         value={vehicle?.year} />
            <ViewField label="Colour"       value={vehicle?.colour} />
            <ViewField label="Engine No."   value={vehicle?.engine_number} />
            <ViewField label="Transmission" value={vehicle?.transmission} />
            <ViewField label="Fuel Type"    value={vehicle?.fuel_type} />
            <ViewField
              label="Mileage In"
              value={vehicle?.mileage_in
                ? `${vehicle.mileage_in.toLocaleString()} km`
                : null}
            />
          </div>
        </div>

        {/* Owner Card */}
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm
                         uppercase tracking-wider">
            Owner Details
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <ViewField label="Full Name"     value={vehicle?.owner_name} />
            <ViewField label="Phone"         value={vehicle?.owner_phone} />
            <ViewField label="Email"         value={vehicle?.owner_email} />
            <ViewField label="ID / Passport" value={vehicle?.owner_id_number} />
          </div>
        </div>

        {/* Job Info Card */}
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm
                         uppercase tracking-wider">
            Job Details
          </h3>

          {/* VIEW MODE */}
          {!editMode ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <ViewField
                label="Job Type"
                value={job.job_type?.replace(/\b\w/g, l => l.toUpperCase())}
              />
              <ViewField
                label="Priority"
                value={['','Urgent','High','Normal','Low'][job.priority ?? 3]}
              />
              <ViewField
                label="Insurer"
                value={insurers.find(i => i.id === job.insurer_id)?.name}
              />
              <ViewField label="Check-In Date"      value={fmtDate(job.check_in_date)} />
              <ViewField label="Est. Completion"    value={fmtDate(job.estimated_completion)} />
              <ViewField
                label="Special Instructions"
                value={job.special_instructions}
              />
              <ViewField label="Internal Notes"     value={job.internal_notes} />
              <ViewField label="Created"            value={fmtDate(job.created_at)} />
            </div>
          ) : (

          /* EDIT MODE */
            <div className="space-y-4">

              {/* Job Type + Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Job Type</label>
                  <select
                    className="input-field"
                    value={form.job_type}
                    onChange={e =>
                      setForm(prev => ({ ...prev, job_type: e.target.value }))
                    }
                  >
                    {['insurance','private','warranty','internal'].map(t => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select
                    className="input-field"
                    value={form.priority}
                    onChange={e =>
                      setForm(prev => ({
                        ...prev, priority: parseInt(e.target.value)
                      }))
                    }
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Insurer */}
              {form.job_type === 'insurance' && (
                <div>
                  <label className="label">Insurer</label>
                  <select
                    className="input-field"
                    value={form.insurer_id}
                    onChange={e =>
                      setForm(prev => ({ ...prev, insurer_id: e.target.value }))
                    }
                  >
                    <option value="">Select insurer...</option>
                    {insurers.map(i => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Check-In Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.check_in_date}
                    onChange={e =>
                      setForm(prev => ({
                        ...prev, check_in_date: e.target.value
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="label">Est. Completion</label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.estimated_completion}
                    onChange={e =>
                      setForm(prev => ({
                        ...prev, estimated_completion: e.target.value
                      }))
                    }
                  />
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="label">Special Instructions</label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  value={form.special_instructions}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev, special_instructions: e.target.value
                    }))
                  }
                />
              </div>

              {/* Internal Notes */}
              <div>
                <label className="label">Internal Notes</label>
                <textarea
                  className="input-field resize-none"
                  rows={2}
                  value={form.internal_notes}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev, internal_notes: e.target.value
                    }))
                  }
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save size={15} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Right - Status Timeline */}
      <div className="space-y-6">
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm
                         uppercase tracking-wider">
            Status History
          </h3>
          <StatusTimeline logs={auditLogs} />
        </div>
      </div>

    </div>
  )
}