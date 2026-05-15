// ===============================================
// BODYSHOP OS - Login Page
// ===============================================

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { PasswordInput } from '../ui/PasswordInput'

// SECTION: Constraints
const MAX_ATTEMPTS = 5

// SECTION: Portal Redirect Logic
const getPortalRoute = (role) => {
  switch (role) {
    case 'super_admin':
    case 'branch_admin':
    case 'manager':
    case 'estimator':
    case 'receptionist':  return '/main'
    case 'technician':    return '/workshop'
    case 'assessor':      return '/assessor'
    case 'customer':      return '/customer'
    default:              return '/login'
  }
}

export function Login() {
  
  // SECTION: State
  const [email,     setEmail]       = useState('')
  const [password,  setPassword]    = useState('')
  const [loading,   setLoading]     = useState(false)
  const [attempts,  setAttempts]    = useState(0)
  const [locked,    setLocked]      = useState(false)

  const { signIn, profile } = useAuth()
  const navigate            = useNavigate()

  //SECTION: Redirect Once Profile Loads
  // Uses profile from DB - not JWT metadata - so role is always current
  useEffect(() => {
    if (profile) {
      navigate(getPortalRoute(profile.role))
    }
  }, [profile])

  // SECTION: Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (locked) {
      toast.error('Too many failed attempts. Please try again later.')
      return
    }

    if (!email || !password) {
      toast.error('Please enter your email and password')
      return
    }

    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)

    if (error) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setLocked(true)
        toast.error('Too many failed attempts. Please try again later.')
        return
      }

      toast.error(
        `Invalid email or password. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts === 1 ? '' : 's'} remaining.`
      )
      return
    }
    // On success - useEffect above handles redirect once profile loads  
  }

  // SECTION: Render
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-700">BodyShopOS</h1>
          <p className="text-gray-500 mt-1 text-sm">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="card">

          {/* Lockout Banner */}
          {locked && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">
                Account temporarily locked due to too many failed attempts.
                Please contact your administrator or try again later.
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="input-field"
                disabled={loading || locked}
              />
            </div>

            {/* Password */}
            <PasswordInput
              id="password"
              name="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              label="Password"
              placeholder="Enter your password"
              disabled={loading || locked}
              autoComplete="current-password"
            />

            {/* Forget Password */}
            <div className="text-right">
              <Link
                to="/reset-password"
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                Forgot your password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || locked}
              className="btn-primary w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          BodyShopOS &copy; {new Date().getFullYear()}
        </p>

      </div>
    </div>
  )
}