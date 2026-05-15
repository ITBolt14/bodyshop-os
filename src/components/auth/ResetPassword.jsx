// ===============================================
// BODYSHOP OS - Request Password Reset
// ===============================================

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { ArrowLeft } from 'lucide-react'

export function ResetPassword() {
  
  // SECTION: State
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const { resetPassword } = useAuth()

  // SECTION: Submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }

    setLoading(true)
    const { error } = await resetPassword(email.trim())
    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }
    
    setSubmitted(true)
  }

  // SECTION: Success State
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center
                            justify-center mx-auto">
              <span className="text-3xl">📧</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Check your email</h2>
            <p className="text-gray-500 text-sm">
              We sent a password reset link to <strong>{email}</strong>.
              Click the link in the email to set a new password.
            </p>
            <Link to="/login" classname="btn-secondary inline-flex items-center gap-2">
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // SECTION: Form State
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-700">BodyShopOS</h1>
          <p className="text-gray-500 mt-1 text-sm">Reset your password</p>
        </div>

        {/* Card */}
        <div className="card space-y-5">

          <p className="text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.name)}
                placeholder="you@example.com"
                autoComplete="email"
                className="input-field"
                disabled={loading}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            {/* Back */}
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm
                         text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={14} /> Back to Login
            </Link>

          </form>
        </div>
      </div>
    </div>
  )
}