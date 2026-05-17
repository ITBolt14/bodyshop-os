// ===============================================
// BODYSHOP OS - Check_in Wizard: Step 2 - Job Details
// ===============================================

import { useEffect, useState } from 'react'
import { Briefcase } from 'lucide-react'
import { supabase } from '../../../../../lib/supabase'

const JOB_TYPES = [
  { value: 'insurance', label: 'Insurance'  },
  { value: 'private',   label: 'Private'    },
  { value: 'warranty',  label: 'Warranty'   },
  { value: 'internal',  label: 'Internal'   },
]

const PRIORITIES = [
  { value: 1, label: '🔴 Urgent' },
  { value: 2, label: '🟠 High'   },
  { value: 3, label: '🟡 Normal' },
  { value: 4, label: '⚪ Low'    },
]

export function StepJob({ data, onChange, onNext, onBack }) {

  // SECTION: State
  const [insurers, setInsurers] = useState([])
  const [errors,   setErrors]   = useState({})

  // SECTION: Load Insurers
  useEffect(() => {
    supabase
      .from('insurers')
      .select('id, name, code')
      .eq('active', true)
      .order('name')
      .then(({ data: ins }) => {
        if (ins) setInsurers(ins)
      })
  }, [])

  // SECTION: Validation
  const validate = () => {
    const e = {}
    if (!data.job_type) e.job_type = 'Job type is required'
    if (data.job_type === 'insurance' && !data.insurer_id) {
      e.insurer_id = 'Please select an insurer for insurance jobs'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (validate()) onNext()
  }

  // SECTION: Field Change
  const handleChange = (name, value) => {
    onChange({ ...data, [name]: value })
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  // SECTION: Render
  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Briefcase size={16} /> Job Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Job Type */}
          <div>
            <label className="label">Job Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {JOB_TYPES.map(jt => (
                <button
                  key={jt.value}
                  type="button"
                  onClick={() => handleChange('job_type', jt.value)}
                  className={`py-2.5 px-3 rounded-lg border text-sm font-medium
                              transition_all
                              ${data.job_type === jt.value
                                ? 'bg-brand-600 text-white border border-brand-600'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400'
                              }`}
                >
                  {jt.label}
                </button>
              ))}
            </div>
            {errors.job_type && (
              <p className="text-xs text-red-500 mt-1">{errors.job_type}</p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="label">Priority</label>
            <div className="grid grid-cols-2 gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleChange('priority', p.value)}
                  className={`py-2.5 px-3 rounded-lg border text-sm font-medium
                              transition-all
                              ${data.priority === p.value
                                ? 'bg-brand-600 text-white border-brand-600'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400'
                              }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Insurer - only for insurance jobs */}
          {data.job_type === 'insurance' && (
            <div className="sm:col-span-2">
              <label className="label">Insurer *</label>
              <select
                className={`input-field ${errors.insurer_id ? 'border-red-400' : ''}`}
                value={data.insurer_id ?? ''}
                onChange={e => handleChange('insurer_id', e.target.value)}
              >
                <option value="">Select insurer...</option>
                {insurers.map(ins => (
                  <option key={ins.id} value={ins.id}>
                    {ins.name} {ins.code ? `(${ins.code})` : ''}
                  </option>
                ))}
              </select>
              {errors.insurer_id && (
                <p className="text-xs text-red-500 mt-1">{errors.insurer_id}</p>
              )}
            </div>
          )}

          {/* Estimated Completion */}
          <div>
            <label className="label">Estimated Completion</label>
            <input
              type="date"
              className="input-field"
              value={data.estimated_completion ?? ''}
              onChange={e => handleChange('estimated_completion', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Check-In Date */}
          <div>
            <label className="label">Check-In Date</label>
            <input
              type="date"
              className="input-field"
              value={data.check_in_date ?? new Date().toISOString().split('T')[0]}
              onChange={e => handleChange('check_in_date', e.target.value)}
            />
          </div>

          {/* Special Instructions */}
          <div className="sm:col-span-2">
            <label className="label">Special Instructions</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={data.special_instructions ?? ''}
              onChange={e => handleChange('special_instructions', e.target.value)}
              placeholder="Any special instructions for the workshop..."
            />
          </div>

          {/* Internal Notes */}
          <div className="sm:col-span-2">
            <label className="label">Internal Notes</label>
            <textarea
              className="input-field resize-none"
              rows={2}
              value={data.internal_notes ?? ''}
              onChange={e => handleChange('internal_notes', e.target.value)}
              placeholder="Internal notes - not visible to customer..."
            />
          </div>

        </div>
      </div>

      {/* SECTION: Navigation */}
      <div className="flex justify-between">
        <button onClick={onBack} className="btn-secondary px-8">
          ← Back
        </button>
        <button onClick={handleNext} className="btn-primary px-8">
          Next - Claim Details →
        </button>
      </div>
    </div>
  )
}