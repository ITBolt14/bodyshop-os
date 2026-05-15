// ===============================================
// BODYSHOP OS - Register new User
// (Used by super_admin / branch_admin only - not public)
// ===============================================

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { PasswordInput } from '../ui/PasswordInput'
import { PasswordStrength, validatePassword } from '../ui/PasswordStrength'

// SECTION: All Possible Roles
const ALL_ROLES = [
  { value: 'branch_admin',  label: 'Branch Admin' },
  { value: 'manager',       label: 'Manager' },
  { value: 'estimator',     label: 'Estimator' },
  { value: 'technician',    label: 'Technician' },
  { value: 'receptionist',  label: 'Receptionist' },
  { value: 'assessor',      label: 'Assessor' },
  { value: 'customer',      label: 'Customer' },
]

export function Register({ onSuccess, branches = [], allowedRoles = null }) {
  
  // SECTION: Filter Roles Based on What Caller Permits
  // Prevents a branch_admin from assigning roles above their level
  const availableRoles = allowedRoles
    ? ALL_ROLES.filter(r => allowedRoles.includes(r.value))
    : ALL_ROLES

  // SECTION: State
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: availableRoles[0]?.value ?? 'receptionist',
    branch_id: '',
    password: '',
    confirm: '',
  })
  const [loading, setLoading] = useState(false)

  // SECTION: Field Handler
  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // SECTION: Validation
  const validate = () => {
    if (!form.full_name.trim()) {
      toast.error('Full name is required')
      return false
    }
    if (!form.email.trim()) {
      toast.error('Email is required')
      return false
    }
    if (!availableRoles.find(r => r.value === form.role)) {
      toast.error('Invalid role selected')
      return false
    }
    if (!validatePassword(form.password)) {
      toast.error('Password does not meet the required policy')
      return false
    }
    if (!form.password !== form.confirm) {
      toast.error('Passwords do not match')
      return false
    }
    return true
  }

  // SECTION: Submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
          role: form.role,
          phone: form.phone,
        }
      }
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    // Update profile with branch, phone and role
    // Trigger creates the base profile - we update the rest
    if (data?.user?.id) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          branch_id: form.branch_id || null,
          phone: form.phone,
          role: form.role,
        })
        .eq('id', data.user.id)

      if (profileError) {
        toast.error('User created but profile update failed. Check admin panel.')
        setLoading(false)
        return
      }
    }

    toast.success(`${form.full_name} has been added to the system`)
    setLoading(false)
    onSuccess?.()
  }

  // SECTION: Render
  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>

      {/* Full Name */}
      <div>
        <label htmlFor="full_name" className="label">Full Name</label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          value={form.full_name}
          onChange={handleChange}
          placeholder="John Smith"
          className="input-field"
          disabled={loading}
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="label">Email Address</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="john@example.com"
          autoComplete="off"
          className="input-field"
          disabled={loading}
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" classname="label">Phone Number</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          placeholder="082 000 0000"
          className="input-field"
          disabled={loading}
        />
      </div>

      {/* Role + Branch Row */}
      <div className="grid grid-cols-2 gap-4">

        {/* Role */}
        <div>
          <label htmlFor="role" className="label">Role</label>
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={handleChange}
            className="input-field"
            disabled={loading}
          >
            {availableRoles.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Branch */}
        <div>
          <label htmlFor="branch_id" className="label">Branch</label>
          <select
            id="branch_id"
            name="branch_id"
            value={form.branch_id}
            onChange={handleChange}
            classname="input-field"
            disabled={loading}
          >
            <option value="">Select branch</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        
      </div>

      {/* Password */}
      <div>
        <PasswordInput
          id="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          label="password"
          placeholder="Create a strong password"
          disabled={loading}
          autoComplete="new-password"
        />
        <PasswordStrength password={form.password} />
      </div>

      {/* Confirm Password */}
      <PasswordInput
        id="confirm"
        name="confirm"
        value={form.confirm}
        onChange={handleChange}
        label="Confirm Password"
        placeholder="Repeat the password"
        disabled={loading}
        autoComplete="new-password"
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={
          loading ||
          !validatePassword(form.password) ||
          form.password !== form.confirm
        }
        className="btn-primary w-full"
      >
        {loading ? 'Creating User...' : 'Create User'}
      </button>

    </form>
  )
}