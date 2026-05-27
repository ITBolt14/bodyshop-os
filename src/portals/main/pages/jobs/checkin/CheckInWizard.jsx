// =============================================
// BODYSHOP OS — Check-In Wizard
// Fixed: return moved outside handleSave
// Fixed: debug console.logs removed
// =============================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { supabase } from '../../../../../lib/supabase'
import { useAuth } from '../../../../../hooks/useAuth'
import { useBranch } from '../../../../../hooks/useBranch'
import { WizardProgress } from './WizardProgress'
import { StepVehicle }   from './StepVehicle'
import { StepJob }       from './StepJob'
import { StepClaim }     from './StepClaim'
import { StepConfirm }   from './StepConfirm'

export function CheckInWizard() {

  // SECTION: State
  const [step,        setStep]       = useState(1)
  const [vehicleData, setVehicleData] = useState({
    job_type: 'insurance',
    priority: 3,
  })
  const [jobData, setJobData] = useState({
    job_type:      'insurance',
    priority:      3,
    check_in_date: new Date().toISOString().split('T')[0],
  })
  const [claimData, setClaimData] = useState({
    third_party_involved: false,
    excess_waived:        false,
    excess_amount:        0,
  })
  const [saving, setSaving] = useState(false)

  const { profile }  = useAuth()
  const { branchId } = useBranch()
  const navigate     = useNavigate()

  // SECTION: Save Handler
  const handleSave = async (finalStatus) => {
    setSaving(true)

    try {
      // STEP 1 — Upsert vehicle
      let vehicleId = vehicleData.existing_id ?? null

      if (vehicleId) {
        const { error: vErr } = await supabase
          .from('vehicles')
          .update({
            registration:    vehicleData.registration,
            make:            vehicleData.make,
            model:           vehicleData.model,
            year:            vehicleData.year            || null,
            colour:          vehicleData.colour          || null,
            vin:             vehicleData.vin,
            engine_number:   vehicleData.engine_number   || null,
            transmission:    vehicleData.transmission    || null,
            fuel_type:       vehicleData.fuel_type       || null,
            mileage_in:      vehicleData.mileage_in      || null,
            owner_name:      vehicleData.owner_name,
            owner_phone:     vehicleData.owner_phone     || null,
            owner_email:     vehicleData.owner_email     || null,
            owner_id_number: vehicleData.owner_id_number || null,
          })
          .eq('id', vehicleId)

        if (vErr) throw new Error(`Vehicle update failed: ${vErr.message}`)

      } else {
        const { data: newVehicle, error: vErr } = await supabase
          .from('vehicles')
          .insert({
            branch_id:       branchId,
            registration:    vehicleData.registration,
            make:            vehicleData.make,
            model:           vehicleData.model,
            year:            vehicleData.year            || null,
            colour:          vehicleData.colour          || null,
            vin:             vehicleData.vin,
            engine_number:   vehicleData.engine_number   || null,
            transmission:    vehicleData.transmission    || null,
            fuel_type:       vehicleData.fuel_type       || null,
            mileage_in:      vehicleData.mileage_in      || null,
            owner_name:      vehicleData.owner_name,
            owner_phone:     vehicleData.owner_phone     || null,
            owner_email:     vehicleData.owner_email     || null,
            owner_id_number: vehicleData.owner_id_number || null,
          })
          .select('id')
          .single()

        if (vErr) throw new Error(`Vehicle insert failed: ${vErr.message}`)
        vehicleId = newVehicle.id
      }

      // STEP 2 — Generate job number
      const { data: jobNumData, error: jnErr } = await supabase
        .rpc('generate_job_number', { p_branch_id: branchId })

      if (jnErr) throw new Error(`Job number failed: ${jnErr.message}`)

      // STEP 3 — Insert job
      const { data: newJob, error: jobErr } = await supabase
        .from('jobs')
        .insert({
          branch_id:            branchId,
          job_number:           jobNumData,
          vehicle_id:           vehicleId,
          insurer_id:           jobData.insurer_id           || null,
          job_type:             jobData.job_type             || 'insurance',
          status:               finalStatus,
          priority:             jobData.priority             || 3,
          check_in_date:        jobData.check_in_date        || new Date().toISOString(),
          estimated_completion: jobData.estimated_completion || null,
          special_instructions: jobData.special_instructions || null,
          internal_notes:       jobData.internal_notes       || null,
          created_by:           profile.id,
        })
        .select('id, job_number')
        .single()

      if (jobErr) throw new Error(`Job insert failed: ${jobErr.message}`)

      // STEP 4 — Insert claim details (insurance jobs only)
      if (jobData.job_type === 'insurance') {
        const { error: claimErr } = await supabase
          .from('job_claims')
          .insert({
            job_id:                   newJob.id,
            branch_id:                branchId,
            insurer_id:               jobData.insurer_id                 || null,
            claim_number:             claimData.claim_number             || null,
            order_number:             claimData.order_number             || null,
            audatex_reference:        claimData.audatex_reference        || null,
            policy_number:            claimData.policy_number            || null,
            internal_reference:       claimData.internal_reference       || null,
            policy_holder_name:       claimData.policy_holder_name       || null,
            policy_holder_phone:      claimData.policy_holder_phone      || null,
            policy_holder_email:      claimData.policy_holder_email      || null,
            policy_holder_id_number:  claimData.policy_holder_id_number  || null,
            date_of_loss:             claimData.date_of_loss             || null,
            date_reported_to_insurer: claimData.date_reported_to_insurer || null,
            incident_description:     claimData.incident_description     || null,
            incident_location:        claimData.incident_location        || null,
            incident_type:            claimData.incident_type            || null,
            third_party_involved:     claimData.third_party_involved     ?? false,
            third_party_name:         claimData.third_party_name         || null,
            third_party_phone:        claimData.third_party_phone        || null,
            third_party_vehicle_reg:  claimData.third_party_vehicle_reg  || null,
            third_party_insurer:      claimData.third_party_insurer      || null,
            excess_amount:            claimData.excess_amount            || 0,
            excess_waived:            claimData.excess_waived            ?? false,
            excess_waiver_reason:     claimData.excess_waiver_reason     || null,
            excess_paid_by:           claimData.excess_paid_by           || null,
            excess_collected:         false,
            claim_status:             'open',
            created_by:               profile.id,
          })

        if (claimErr) throw new Error(`Claim insert failed: ${claimErr.message}`)
      }

      // STEP 5 — Write audit log
      await supabase.from('audit_log').insert({
        branch_id:  branchId,
        user_id:    profile.id,
        portal:     'main',
        action:     'job.created',
        table_name: 'jobs',
        record_id:  newJob.id,
        new_value:  { job_number: newJob.job_number, status: finalStatus },
      })

      toast.success(`Job ${newJob.job_number} created successfully`)
      navigate('/main/jobs')

    } catch (err) {
      console.error('Check-in error:', err)
      toast.error(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // SECTION: Render
  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Vehicle Check-In</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Complete all steps to create a new job card
        </p>
      </div>

      {/* Progress */}
      <WizardProgress currentStep={step} />

      {/* Steps */}
      {step === 1 && (
        <StepVehicle
          data={vehicleData}
          onChange={setVehicleData}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <StepJob
          data={jobData}
          onChange={setJobData}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <StepClaim
          data={claimData}
          onChange={setClaimData}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
          jobType={jobData.job_type}
        />
      )}
      {step === 4 && (
        <StepConfirm
          vehicleData={vehicleData}
          jobData={jobData}
          claimData={claimData}
          onBack={() => setStep(3)}
          onSave={handleSave}
          saving={saving}
        />
      )}

    </div>
  )
}