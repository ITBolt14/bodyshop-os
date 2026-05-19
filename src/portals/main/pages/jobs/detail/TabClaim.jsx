// =============================================
// BODYSHOP OS — Job Detail Tab: Claim Details
// =============================================

import { useState } from 'react'
import { Save, Shield } from 'lucide-react'
import { supabase } from '../../../../../lib/supabase'
import { useAuth } from '../../../../../hooks/useAuth'
import { useBranch } from '../../../../../hooks/useBranch'
import { toast } from 'react-hot-toast'

// SECTION: Constants
const INCIDENT_TYPES = [
  'accident','theft','hail','flood',
  'fire','vandalism','hit_and_run','other'
]

const CLAIM_STATUSES = [
  'open','submitted','queried','authorized',
  'partially_authorized','rejected','closed'
]

const EXCESS_PAID_BY = ['insured','third_party','insurer','waived']

// SECTION: Label + Value display — used in view mode only
// Single responsibility: show ONE label and ONE value, no duplication
function ViewValue({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase
                    tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-medium">
        {value || <span className="text-gray-300 font-normal">—</span>}
      </p>
    </div>
  )
}

export function TabClaim({ claim, jobId, jobType, editMode, onSaved }) {

  // SECTION: No Claim For Non-Insurance
  if (jobType !== 'insurance') {
    return (
      <div className="card text-center py-16">
        <Shield size={40} className="mx-auto text-gray-200 mb-3" />
        <p className="text-gray-400 text-sm">
          No claim details for non-insurance jobs
        </p>
      </div>
    )
  }

  // SECTION: No Claim Record Yet
  if (!claim) {
    return (
      <div className="card text-center py-16">
        <Shield size={40} className="mx-auto text-gray-200 mb-3" />
        <p className="text-gray-400 text-sm">No claim details captured yet</p>
      </div>
    )
  }

  // SECTION: State
  const [form,   setForm]   = useState({ ...claim })
  const [saving, setSaving] = useState(false)

  const { profile }  = useAuth()
  const { branchId } = useBranch()

  const fc = (name, value) =>
    setForm(prev => ({ ...prev, [name]: value }))

  // SECTION: Save Handler
  const handleSave = async () => {
    setSaving(true)

    const { error } = await supabase
      .from('job_claims')
      .update({
        claim_number:               form.claim_number               || null,
        order_number:               form.order_number               || null,
        audatex_reference:          form.audatex_reference          || null,
        policy_number:              form.policy_number              || null,
        internal_reference:         form.internal_reference         || null,
        policy_holder_name:         form.policy_holder_name         || null,
        policy_holder_phone:        form.policy_holder_phone        || null,
        policy_holder_email:        form.policy_holder_email        || null,
        policy_holder_id_number:    form.policy_holder_id_number    || null,
        date_of_loss:               form.date_of_loss               || null,
        date_reported_to_insurer:   form.date_reported_to_insurer   || null,
        incident_description:       form.incident_description       || null,
        incident_location:          form.incident_location          || null,
        incident_type:              form.incident_type              || null,
        third_party_involved:       form.third_party_involved       ?? false,
        third_party_name:           form.third_party_name           || null,
        third_party_phone:          form.third_party_phone          || null,
        third_party_vehicle_reg:    form.third_party_vehicle_reg    || null,
        third_party_insurer:        form.third_party_insurer        || null,
        excess_amount:              form.excess_amount              || 0,
        excess_waived:              form.excess_waived              ?? false,
        excess_waiver_reason:       form.excess_waiver_reason       || null,
        excess_paid_by:             form.excess_paid_by             || null,
        excess_collected:           form.excess_collected           ?? false,
        excess_collected_date:      form.excess_collected_date      || null,
        excess_receipt_number:      form.excess_receipt_number      || null,
        authorized_amount:          form.authorized_amount          || null,
        authorized_by:              form.authorized_by              || null,
        authorized_date:            form.authorized_date            || null,
        authorization_notes:        form.authorization_notes        || null,
        claim_status:               form.claim_status               || 'open',
        query_reason:               form.query_reason               || null,
        rejection_reason:           form.rejection_reason           || null,
        supplementary_submitted:    form.supplementary_submitted    ?? false,
        supplementary_amount:       form.supplementary_amount       || null,
        supplementary_approved:     form.supplementary_approved     ?? false,
        supplementary_notes:        form.supplementary_notes        || null,
      })
      .eq('id', claim.id)

    if (error) {
      toast.error('Failed to save claim details')
      setSaving(false)
      return
    }

    await supabase.from('audit_log').insert({
      branch_id:  branchId,
      user_id:    profile.id,
      portal:     'main',
      action:     'job_claim.updated',
      table_name: 'job_claims',
      record_id:  claim.id,
      new_value:  {
        claim_number: form.claim_number,
        claim_status: form.claim_status,
      },
    })

    toast.success('Claim details updated')
    setSaving(false)
    onSaved()
  }

  // SECTION: Field Helpers
  // These render ONE label + either an input (edit) or plain text (view)
  // Never call ViewValue from inside these — that would double the label

  const textField = (name, label, props = {}) => (
    <div>
      <label className="label">{label}</label>
      {editMode ? (
        <input
          className="input-field"
          value={form[name] ?? ''}
          onChange={e => fc(name, e.target.value)}
          {...props}
        />
      ) : (
        <p className="text-sm text-gray-800 font-medium">
          {claim[name] || <span className="text-gray-300 font-normal">—</span>}
        </p>
      )}
    </div>
  )

  const dateField = (name, label) => (
    <div>
      <label className="label">{label}</label>
      {editMode ? (
        <input
          type="date"
          className="input-field"
          value={form[name] ?? ''}
          onChange={e => fc(name, e.target.value)}
        />
      ) : (
        <p className="text-sm text-gray-800 font-medium">
          {claim[name]
            ? new Date(claim[name]).toLocaleDateString('en-ZA', {
                day: '2-digit', month: 'short', year: 'numeric'
              })
            : <span className="text-gray-300 font-normal">—</span>
          }
        </p>
      )}
    </div>
  )

  const amountField = (name, label) => (
    <div>
      <label className="label">{label}</label>
      {editMode ? (
        <input
          type="number"
          className="input-field"
          value={form[name] ?? ''}
          onChange={e => fc(name, e.target.value)}
          min="0"
          step="0.01"
        />
      ) : (
        <p className="text-sm text-gray-800 font-medium">
          {claim[name]
            ? `R ${Number(claim[name]).toFixed(2)}`
            : <span className="text-gray-300 font-normal">—</span>
          }
        </p>
      )}
    </div>
  )

  const checkField = (name, label) => (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id={name}
        checked={editMode ? (form[name] ?? false) : (claim[name] ?? false)}
        onChange={e => editMode && fc(name, e.target.checked)}
        disabled={!editMode}
        className="w-4 h-4 accent-brand-600"
      />
      <label htmlFor={name} className="text-sm text-gray-700">{label}</label>
    </div>
  )

  // SECTION: Render
  return (
    <div className="space-y-6">

      {/* SECTION: Reference Numbers */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4 text-sm
                       uppercase tracking-wider flex items-center gap-2">
          <Shield size={14} /> Reference Numbers
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {textField('claim_number',       'Claim Number')}
          {textField('order_number',       'Order Number')}
          {textField('policy_number',      'Policy Number')}
          {textField('audatex_reference',  'Audatex Reference')}
          {textField('internal_reference', 'Internal Reference')}

          {/* Claim Status — select in edit, plain text in view */}
          <div>
            <label className="label">Claim Status</label>
            {editMode ? (
              <select
                className="input-field"
                value={form.claim_status ?? 'open'}
                onChange={e => fc('claim_status', e.target.value)}
              >
                {CLAIM_STATUSES.map(s => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-800 font-medium">
                {claim.claim_status
                  ? claim.claim_status.replace(/_/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())
                  : <span className="text-gray-300 font-normal">—</span>
                }
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION: Policy Holder */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4 text-sm
                       uppercase tracking-wider">
          Policy Holder
          <span className="text-xs text-gray-400 font-normal normal-case
                           tracking-normal ml-2">
            (if different from vehicle owner)
          </span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {textField('policy_holder_name',      'Full Name')}
          {textField('policy_holder_phone',     'Phone')}
          {textField('policy_holder_email',     'Email', { type: 'email' })}
          {textField('policy_holder_id_number', 'ID / Passport')}
        </div>
      </div>

      {/* SECTION: Incident Details */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4 text-sm
                       uppercase tracking-wider">
          Incident Details
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

          {/* Incident Type — buttons in edit, plain text in view */}
          <div className="col-span-2 sm:col-span-3">
            <label className="label">Incident Type</label>
            {editMode ? (
              <div className="grid grid-cols-4 gap-2">
                {INCIDENT_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => fc('incident_type', t)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium
                                transition-all
                                ${form.incident_type === t
                                  ? 'bg-brand-600 text-white border-brand-600'
                                  : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400'
                                }`}
                  >
                    {t.replace(/_/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-800 font-medium">
                {claim.incident_type
                  ? claim.incident_type.replace(/_/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())
                  : <span className="text-gray-300 font-normal">—</span>
                }
              </p>
            )}
          </div>

          {dateField('date_of_loss',             'Date of Loss')}
          {dateField('date_reported_to_insurer', 'Date Reported')}
          {textField('incident_location',        'Incident Location')}

          {/* Incident Description — textarea in edit, plain text in view */}
          <div className="col-span-2 sm:col-span-3">
            <label className="label">Incident Description</label>
            {editMode ? (
              <textarea
                className="input-field resize-none"
                rows={3}
                value={form.incident_description ?? ''}
                onChange={e => fc('incident_description', e.target.value)}
                placeholder="Describe the incident as reported to the insurer..."
              />
            ) : (
              <p className="text-sm text-gray-800 font-medium">
                {claim.incident_description ||
                  <span className="text-gray-300 font-normal">—</span>
                }
              </p>
            )}
          </div>

        </div>
      </div>

      {/* SECTION: Excess Details */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4 text-sm
                       uppercase tracking-wider">
          Excess Details
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

          {amountField('excess_amount', 'Excess Amount (R)')}

          {/* Excess Paid By — select in edit, plain text in view */}
          <div>
            <label className="label">Excess Paid By</label>
            {editMode ? (
              <select
                className="input-field"
                value={form.excess_paid_by ?? ''}
                onChange={e => fc('excess_paid_by', e.target.value)}
              >
                <option value="">Select...</option>
                {EXCESS_PAID_BY.map(v => (
                  <option key={v} value={v}>
                    {v.replace(/_/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-800 font-medium">
                {claim.excess_paid_by
                  ? claim.excess_paid_by.replace(/_/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())
                  : <span className="text-gray-300 font-normal">—</span>
                }
              </p>
            )}
          </div>

          <div className="col-span-2 sm:col-span-3 space-y-2">
            {checkField('excess_waived',    'Excess waived')}
            {checkField('excess_collected', 'Excess collected')}
          </div>

          {(editMode ? form.excess_waived : claim.excess_waived) && (
            textField('excess_waiver_reason', 'Waiver Reason')
          )}

          {(editMode ? form.excess_collected : claim.excess_collected) && (
            <>
              {dateField('excess_collected_date', 'Collection Date')}
              {textField('excess_receipt_number', 'Receipt Number')}
            </>
          )}

        </div>
      </div>

      {/* SECTION: Authorization */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4 text-sm
                       uppercase tracking-wider">
          Authorization
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {amountField('authorized_amount',  'Authorized Amount (R)')}
          {textField('authorized_by',        'Authorized By')}
          {dateField('authorized_date',      'Authorization Date')}
          <div className="col-span-2 sm:col-span-3">
            {textField('authorization_notes', 'Authorization Notes')}
          </div>
          {(claim.claim_status === 'queried' ||
            (editMode && form.claim_status === 'queried')) && (
            <div className="col-span-2 sm:col-span-3">
              {textField('query_reason', 'Query Reason')}
            </div>
          )}
          {(claim.claim_status === 'rejected' ||
            (editMode && form.claim_status === 'rejected')) && (
            <div className="col-span-2 sm:col-span-3">
              {textField('rejection_reason', 'Rejection Reason')}
            </div>
          )}
        </div>
      </div>

      {/* SECTION: Third Party */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          {checkField('third_party_involved', 'Third Party Involved')}
        </div>
        {(editMode ? form.third_party_involved : claim.third_party_involved) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {textField('third_party_name',        'Name')}
            {textField('third_party_phone',       'Phone')}
            {textField('third_party_vehicle_reg', 'Vehicle Reg')}
            {textField('third_party_insurer',     'Their Insurer')}
          </div>
        )}
      </div>

      {/* SECTION: Supplementary Claim */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4 text-sm
                       uppercase tracking-wider">
          Supplementary Claim
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="col-span-2 sm:col-span-3 space-y-2">
            {checkField('supplementary_submitted', 'Supplementary claim submitted')}
            {checkField('supplementary_approved',  'Supplementary claim approved')}
          </div>
          {amountField('supplementary_amount', 'Supplementary Amount (R)')}
          <div className="col-span-2 sm:col-span-3">
            {textField('supplementary_notes', 'Supplementary Notes')}
          </div>
        </div>
      </div>

      {/* SECTION: Save Button */}
      {editMode && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={15} />
            {saving ? 'Saving...' : 'Save Claim Details'}
          </button>
        </div>
      )}

    </div>
  )
}