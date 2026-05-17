// ===============================================
// BODYSHOP OS - Check-In Wizard: Step 4 - Confirm & Save
// ===============================================

import { useState } from 'react'
import { CheckCircle, Car, Briefcase, Shield } from 'lucide-react'

const FINAL_STATUSES = [
  {
    value: 'draft',
    label: 'Save as Draft',
    description: 'Job saved but not yet active. Complete details later.',
    color: 'border-gray-300 hover:border-gray-400',
    active: 'bg-gray-600 text-white border-gray-600',
  },
  {
    value: 'checked_in',
    label: 'Check In',
    description: 'Job is active and visible on the floor monitor immediately.',
    color: 'border-brand-300 hover:border-brand-500',
    active: 'bg-brand-600 text-white border-brand-600',
  },
  {
    value: 'awaiting_assessment',
    label: 'Awaiting Assessment',
    description: 'Vehicled checked in and waiting for assessor appointment.',
    color: 'border-purple-300 hover:border-purple-500',
    active: 'bg-purple-600 text-white border-purple-600',
  },
]

export function StepConfirm({
  vehicleData,
  jobData,
  claimData,
  onBack,
  onSave,
  saving,
}) {

   // SECTION: State
   const [selectedStatus, setSelectedStatus] = useState('checked_in')

   // Section: Summary Row Helper
   const row = (label, value) => value ? (
    <div className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-medium text-gray-800 text-right max-w-[60%]">
        {value}
      </span>
    </div>
   ) : null

   // SECTION: Render
   return (
    <div className="space-y-6">
        
      {/* SECTION: Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Vehicle Summary */}
        <div className="card">
          <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2 text-sm">
            <Car size={14} /> Vehicle
          </h4>
            {row('Registration',    vehicleData.registration)}
            {row('VIN',             vehicleData.vin)}
            {row('Make / Model',    `${vehicleData.make ?? ''} ${vehicleData.model ?? ''}`.trim())}
            {row('Year',            vehicleData.year)}
            {row('Colour',          vehicleData.colour)}
            {row('Mileage',         vehicleData.mileage_in ? `${vehicleData.mileage_in} km` : null)}
            {row('owner',           vehicleData.owner_name)}
            {row('Phone',           vehicleData.owner_phone)}
        </div>

        {/* Job Summary */}
        <div className="card">
          <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2 text-sm">
            <Briefcase size={14} /> Job
          </h4>
          {row('Type',          jobData.job_type?.replace(/_/g, ' '))}
          {row('Priority',      ['','Urgent','High','Normal','Low'][jobData.priority ?? 3])}
          {row('Est. Complete', jobData.estimated_completion)}
          {row('Check-In Date', jobData.check_in_date)}
          {row('Instructions',  jobData.special_instructions)}
        </div>

        {/* Claims Summary */}
        <div className="card">
          <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2 text-sm">
            <Shield size={14} /> Claim
          </h4>
          {jobData.job_type === 'insurance' ? (
            <>
              {row('Claim No.',     claimData.claim_number)}
              {row('Order No.',     claimData.order_number)}
              {row('Policy No.',    claimData.policy_number)}
              {row('Incident',      claimData.incident_type?.replace(/_/g, ' '))}
              {row('Date of Loss',  claimData.date_of_loss)}
              {row('Excess',        claimData.excess_amount
                ? `R ${Number(claimData.excess_amount).toFixed(2)}`
                : null
              )}
            </>
          ) : (
            <p className="text-xs text-gray-400">No claim details for this job type</p>
          )}
        </div>

      </div>

      {/* SECTION: Status Selection */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CheckCircle size={16} /> Set Initial Job Status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FINAL_STATUSES.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSelectedStatus(s.value)}
              className={`p-4 rounded-xl border-2 text-left transition-all
                          ${selectedStatus === s.value
                            ? s.active
                            : `bg-white ${s.color}`
                          }`}
            >
              <p className={`font-semibold text-sm mb-1
                             ${selectedStatus === s.value
                              ? 'text-white'
                              : 'text-gray-700'
                             }`}>
                {s.label}
              </p>
              <p className={`text-xs
                             ${selectedStatus === s.value
                              ? 'text-white/80'
                              : 'text-gray-400'
                             }`}>
                {s.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION: Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          disabled={saving}
          className="btn-secondary px-8"
        >
          ← Back
        </button>
        <button
          onClick={() => onSave(selectedStatus)}
          disabled={saving}
          className="btn-primary px-10"
        >
          {saving ? 'Saving...' : '✓ Save Job'}
        </button>
      </div>

    </div>
   )
}