// ===============================================
// BODYSHOP OS - Update Password (post reset link)
// ===============================================

import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { PasswordInput } from '../ui/PasswordInput'
import { PasswordStrength, validatePassword } from '../ui/PasswordStrength'

export function UpdatePassword() {

  // SECTION: State
  const [password,      setPassword]        = useState('')
  const [confirm,       setConfirm]         = useState('')
  const [loading,       setLoading]         = useState(false)
  const [validSession,  setValidSession]    = useState(false)
  const [checking,      setChecking]        = useState(true)

  const { updatePassword }  = useAuth()
  const navigate            = useNavigate()

  // SECTION: Validate Recovery Session
  // Only allow access if arriving via a Supabase password reset email link
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setValidSession(true)
      }
      setChecking(false)
    })

    // Listen for the PASSWORD_RECOVERY event from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setValidSession(true)
          setChecking(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // SECTION: Submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validatePassword(password)) {
      toast.error('Password does not meet the required policy')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    const { error } = await updatePassword(password)
    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Password updated successfully. Please sign in.')
    navigate('/login', { replace: true })
  }

  // SECTION: Guards
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent
                        rounded-full animate-spin" />
      </div>
    )
  }

  if (!validSession) return <Navigate to="/login" replace />

  // SECTION: Render
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-700">BodyShopOS</h1>
          <p className="text-gray-500 mt-1 text-sm">Set your new password</p>
        </div>

        {/* Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* New Password */}
            <div>
              <PasswordInput
                id="password"
                name="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                label="New Password"
                placeholder="Create a strong password"
                disabled={loading}
                autoComplete="new-password"
              />
              <PassWordStrength password={password} />
            </div>

            {/* Confirm Password */}
            <PasswordInput
              id="confirm"
              name="confirm"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              label="Confirm New Password"
              placeholder="Repeat your new password"
              disabled={loading}
              autoComplete="new-password"
            />

            {/* Submit */}
            <button
              type="submit"
              disabled={
                loading ||
                !validatePassword(password) ||
                password !== confirm
              }
              className="btn-primary w-full"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}
