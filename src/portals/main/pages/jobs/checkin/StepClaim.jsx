// ===============================================
// BODYSHOP OS - Check-In Wizard: Step 3 - Claim Details
// ===============================================

import { useState } from 'react'
import { Shield, Users } from 'lucide-react'

const INCIDENT_TYPES = [
  { value: 'accident',      label: 'Accident'   },
  { value: 'theft',         label: 'Theft'      },
  { value: 'hail',          label: 'Hail'       },
  { value: 'flood',         label: 'Flood'      },
  { value: 'fire',          label: 'Fire'       },
  { value: 'vandalism',     label: 'Vandalism'  },
  { value: 'hit_and_run',   label: 'Hit & Run'  },
  { value: 'other',         label: 'Other'      },
]

const EXCESS_PAID_BY = [
  { value: 'insured',       label: 'Insured'     },
  { value: 'third_party',   label: 'Third Party' },
  { value: 'insurer',       label: 'Insurer'     },
  { value: 'waived',        label: 'Waived'      },
]

export function StepClaim({ data, onChange, onNext, onBack, jobType}) {
  
  // SECTION: State
  const [errors, setErrors] = useState({})

  // SECTION: Skip claim step for non-insurance jobs
  const isInsurance = jobType === 'insurance'

  // SECTION: Field Change
  const handleChange = (name, value) => {
    onChange({ ...data, [name]: value })
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  // SECTION: Field Helper
  const field = (name, label, props = {}) => (
    <div>
      <label className="label">{label}</label>
      <input
        className={`input-field ${errors[name] ? 'border-red-400' : ''}`}
        value={data[name] ?? ''}
        onChange={e => handleChange(name, e.target.value)}
        {...props}
      />
      {errors[name] && (
        <p className="text-xs text-red-500 mt-1">{errors[name]}</p>
      )}
    </div>
  )

  // SECTION: Render - Non-Insurance Skip
  if (!isInsurance) {
    return (
      <div className="space-y-6">
        <div className="card text-center py-12">
          <Shield size={40} className="mx-auto text-gray-300 mb-3" />
          <h3 className="font-semibold text-gray-600">No Claim Details Required</h3>
          <p className="text-sm text-gray-400 mt-1">
            Claim details are only captured for insurance jobs.
          </p>
        </div>
        <div className="flex justify-between">
          <button onClick={onBack} className="btn-secondary px-8">← Back</button>
          <button onClick={onNext} className="btn-primary px-8">Next - Confirm →</button>
        </div>
      </div>
    )
  }

  // SECTION: Render - Insurance Claim Form
  return (
    <div className="space-y-6">

      {/* Reference Numbers */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Shield size={16} /> Claim Reference Numbers
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('claim_number',        'Claim Number',         { placeholder: 'e.g. CLM-2026-001' })}
          {field('order_number',        'Order Number',         { placeholder: "Insurer's order number" })}
          {field('policy_number',       'Policy Number',        { placeholder: "Insured's policy number" })}
          {field('audatex_reference',   'Audatex Reference',    { placeholder: 'Audatex ref if applicable' })}
          {field('internal_reference',  'Internal Reference',   { placeholder: 'Your internal ref' })}
        </div>
      </div>

      {/* Policy Holder */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">
          Policy Holder Details
          <span className="text-xs text-gray-400 font-normal ml-2">
            (if different from vehicle owner)
          </span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('policy_holder_name',          'Full Name',        { placeholder: 'e.g. Jane Smith' })}
          {field('policy_holder_phone',         'Phone',            { placeholder: 'e.g. 083 000 0000' })}
          {field('policy_holder_email',         'Email',            { type: 'email' })}
          {field('policy_holder_id_number',     'ID / Passport',    { placeholder: 'e.g. 8001015009087' })}
        </div>
      </div>

      {/* Incident Details */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Incident Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Incident Type */}
          <div className="sm:col-span-2">
            <label className="label">Incident Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {INCIDENT_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => handleChange('incident_type', t.value)}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium
                              transition-all
                              ${data.incident_type === t.value
                                ? 'bg-brand-600 text-white border-brand-600'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400'
                              }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date of Loss */}
          <div>
            <label className="label">Date of Loss</label>
            <input
              type="date"
              className="input-field"
              value={data.date_of_loss ?? ''}
              onChange={e => handleChange('date_of_loss', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Date Reported */}
          <div>
            <label className="label">Date Reported to Insurer</label>
            <input
              type="date"
              className="input-field"
              value={data.date_reported_to_insurer ?? ''}
              onChange={e => handleChange('date_reported_to_insurer', e.target.value)}
            />
          </div>

          {/* Incident Location */}
          <div className="sm:col-span-2">
            {field('incident_location', 'Incident Location', {
              placeholder: 'e.g. Corner of Main Rd and Jan Smuts Ave, Johannesburg'
            })}
          </div>

          {/* Incident Description */}
          <div className="sm:col-span-2">
            <label className="label">Incident Description</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={data.incident_description ?? ''}
              onChange={e => handleChange('incident_description', e.target.value)}
              placeholder="Describe the incident as reported to the insurer..."
            />
          </div>

        </div>
      </div>

      {/* Excess Details */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Excess Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Excess Amount */}
          <div>
            <label className="label">Excess Amount (R)</label>
            <input
              type="number"
              className="input-field"
              value={data.excess_amount ?? ''}
              onChange={e => handleChange('excess_amount', e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          {/* Excess Paid By */}
          <div>
            <label className="label">Excess Paid By</label>
            <select
              className="input-field"
              value={data.excess_paid_by ?? ''}
              onChange={e => handleChange('excess_paid_by', e.target.value)}
            >
              <option value="">Select</option>
              {EXCESS_PAID_BY.map(ep => (
                <option key={ep.value} value={ep.value}>{ep.label}</option>
              ))}
            </select>
          </div>

          {/* Excess Waived Toggle */}
          <div className="sm:col-span-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="excess_waived"
              checked={data.excess_waived ?? false}
              onChange={e => handleChange('excess_waived', e.target.checked)}
              className="w-4 h-4 accent-brand-600"
            />
            <label htmlFor="excess_waived" className="text-sm text-gray-700">
              Excess waived
            </label>
          </div>

          {/* Waiver Reason */}
          {data.excess_waived && (
            <div className="sm:col-span-2">
              {field('excess_waiver_reason', 'Waiver Reason', {
                placeholder: 'Reason for waiving the excess...'
              })}
            </div>
          )}

        </div>
      </div>

      {/* Third Party */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            id="third_party_involved"
            checked={data.third_party_involved ?? false}
            onChange={e => handleChange('third_party_involved', e.target.checked)}
            className="w-4 h-4 accent-brand-600"
          />
          <label
            htmlFor="third_party_involved"
            className="font-semibold text-gray-800 flex items-center gap-2 cursor-pointer"
          >
            <Users size={16} /> Third Party Involved
          </label>
        </div>

        {data.third_party_involved && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('third_party_name',          'Third Party Name',         { placeholder: 'Full Name' })}
            {field('third_party_phone',         'Third Party Phone',        { placeholder: 'Contact mumber' })}
            {field('third_party_vehicle_reg',   'Third Party Vehicle Reg',  { placeholder: 'Registration number' })}
            {field('third_party_insurer',       'Third Party Insurer',      { placeholder: "Their insurer's name" })}
          </div>
        )}
      </div>

      {/* SECTION: Navigation*/}
      <div className="flex justify-between">
        <button onClick={onBack} className="btn-secondary px-8">← Back</button>
        <button onClick={onNext} className="btn-primary px-8">Next - Confirm →</button>
      </div>

    </div>
  )
}