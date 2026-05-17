// ===============================================
// BODYSHOP OS - Check-In Wizard: Step 1 - Vehicle
// ===============================================

import { useState } from 'react'
import { Search, Car, UserCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../../../../../lib/supabase'
import { useBranch } from '../../../../../hooks/useBranch'

const TRANSMISSION_OPTIONS = ['manual','automatic','other']
const FUEL_OPTIONS         = ['petrol','diesel','electric','hybrid','other']

export function StepVehicle({ data, onChange, onNext }) {
  
  // SECTION: State
  const [searchVin,     setSearchVin]       = useState('')
  const [searchReg,     setSearchReg]       = useState('')
  const [searching,     setSearching]       = useState(false)
  const [searchDone,    setSearchDone]      = useState(false)
  const [existingFound, setExistingFound]   = useState(false)
  const [errors,        setErrors]          = useState({})

  const { branchId } = useBranch()

  // SECTION: Search Handler
  const handleSearch = async () => {
    if (!searchVin.trim() && !searchReg.trim()) return
    setSearching(true)
    setSearchDone(false)
    setExistingFound(false)

    let query = supabase.from('vehicles').select('*')

    if (searchVin.trim()) {
      query = query.ilike('vin', searchVin.trim())
    } else {
      query = query.ilike('registration', searchReg.trim())
    }

    const { data: found } = await query.maybeSingle()

    if (found) {
      // Populate form with existing vehicle data
      onChange({
        ...found,
        // Reset mileage for new check-in
        mileage_in: '',
        existing_id: found.id,
      })
      setExistingFound(true)
    } else {
      // Pre-fill VIN or reg from search
      onChange({
        ...data,
        vin:            searchVin.trim() || data.vin || '',
        registration:    searchReg.trim() || data.registration || '',
        existing_id:    null,
      })
    }

    setSearchDone(true)
    setSearching(false)
  }

  // SECTION: Validation
  const validate = () => {
    const e = {}
    if (!data.vin?.trim())              e.vin           = 'VIN is required'
    if (!data.registration?.trim())      e.registration  = 'Registration is required'
    if (!data.make?.trim())             e.make          = 'Make is required'
    if (!data.model?.trim())            e.model         = 'Model is required'
    if (!data.owner_name?.trim())       e.owner_name    = 'Owner name is required'
    if (!data.mileage_in)               e.mileage_in    = 'Mileage is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (validate()) onNext()
  }

  // SECTION: Field Helper
  const field = (name, label, props = {}) => (
    <div>
      <label className="label">{label}</label>
      <input
        className={`input-field ${errors[name] ? 'border-red-400' : ''}`}
        value={data[name] ?? ''}
        onChange={e => {
          onChange({ ...data, [name]: e.target.value })
          if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
        }}
        {...props}
      />
      {errors[name] && (
        <p className="text-xs text-red-500 mt-1">{errors[name]}</p>
      )}
    </div>
  )

  // SECTION: Render
  return (
    <div className="space-y-6">
      
      {/* SECTION: Search */}
      <div className="card bg-brand-50 border-brand-200">
        <h3 className="font-semibold text-brand-700 mb-3 flex items-center gap-2">
          <Search size={16} /> Search Existing Vehicle
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Search by VIN</label>
            <input
              className="input-field"
              value={searchVin}
              onChange={e => setSearchVin(e.target.value)}
              placeholder="Enter VIN number"
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <label className="label">Or by Registration</label>
            <input
              className="input-field"
              value={searchReg}
              onChange={e => setSearchReg(e.target.value)}
              placeholder="e.g. GP 123-456"
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>
        <button
          onClick={handleSearch}
          disabled={searching}
          className="btn-primary mt-3"
        >
          {searching ? 'Searching...' : 'Search'}
        </button>

        {/* Search Result Banner */}
        {searchDone && (
          <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 text-sm
                           ${existingFound
                             ? 'bg-green-50 border border-green-200 text-green-700'
                             : 'bg-amber-50 border border-amber-200 text-amber-700'
                           }`}>
            <AlertCircle size={15} />
            {existingFound
              ? 'Existing vehicle found - details loaded below. Please verify and update mileage.'
              : 'No existing vehicle found - please complete the details below.'
            }
          </div>
        )}
      </div>

      {/* SECTION: Vehicle Details */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Car size={16} /> Vehicle Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('vin',             'VIN Number *',         { placeholder: 'e.g. WVWZZZ1JZ3W386752' })}
          {field('registration',    'Registration *',       { placeholder: 'e.g. GP 123-456' })}
          {field('make',            'Make *',               { placeholder: 'e.g. Volkswagen' })}
          {field('model',           'Model *',              { placeholder: 'e.g. Golf 7 GTI' })}
          {field('year',            'Year',                 { type: 'number', placeholder: '2021' })}
          {field('colour',          'Colour',               { placeholder: 'e.g. Pearl White' })}
          {field('engine_number',   'Engine Number',        { placeholder: 'e.g. CHHB123456' })}
          {field('mileage_in',      'Current Mileage *',    { type: 'number', placeholder: 'e.g. 45000' })}

          {/* Transmission */}
          <div>
            <label className="label">Transmission</label>
            <select
              className="input-field"
              value={data.transmission ?? ''}
              onChange={e => onChange({ ...data, transmission: e.target.value })}
            >
              <option value="">Select</option>
              {TRANSMISSION_OPTIONS.map(t => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Fuel Type */}
          <div>
            <label className="label">Fuel Type</label>
            <select
              className="input-field"
              value={data.fuel_type ?? ''}
              onChange={e => onChange({ ...data, fuel_type: e.target.value })}
            >
              <option value="">Select</option>
              {FUEL_OPTIONS.map(f => (
                <option key={f} value={f}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SECTION: Owner Details */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <UserCircle size={16} /> Owner Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('owner_name',          'Full Name *',          { placeholder: 'e.g. John Smith' })}
          {field('owner_phone',         'Phone Number',         { placeholder: 'e.g. 082 000 0000' })}
          {field('owner_email',         'Email Address',        { placeholder: 'e.g. john@email.com', type: 'email' })}
          {field('owner_id_number',     'ID / Passport',        { placeholder: 'e.g. 8001015009087' })}
        </div>
      </div>

      {/* SECTION: Next Button */}
      <div className="flex justify-end">
        <button onClick={handleNext} className="btn-primary px-8">
          Next - Job Details →
        </button>
      </div>

    </div>
  )
}