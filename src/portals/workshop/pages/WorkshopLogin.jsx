// =============================================
// BODYSHOP OS — Workshop PIN Login
// 4-digit numeric PIN, on-screen keypad only
// =============================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { setWorkshopUser } from '../WorkshopPortal'
import { Delete, Wrench } from 'lucide-react'

// SECTION: PIN Dots Display
function PinDots({ filled }) {
  return (
    <div className="flex items-center justify-center gap-5 my-8">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className={`w-5 h-5 rounded-full border-2 transition-all duration-150
                      ${i < filled
                        ? 'bg-brand-500 border-brand-500 scale-110'
                        : 'bg-transparent border-gray-600'
                      }`}
        />
      ))}
    </div>
  )
}

// SECTION: Keypad Button
function KeypadBtn({ label, onClick, variant = 'default' }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center rounded-2xl
                  text-2xl font-bold transition-all duration-100
                  active:scale-95 select-none h-20
                  ${variant === 'delete'
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-800 hover:bg-gray-700 text-white'
                  }`}
    >
      {label}
    </button>
  )
}

export function WorkshopLogin() {

  // SECTION: State
  const [pin,      setPin]      = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [attempts, setAttempts] = useState(0)

  const navigate = useNavigate()

  // SECTION: Auto-submit when 4 digits entered
  useEffect(() => {
    if (pin.length === 4) {
      handleLogin(pin)
    }
  }, [pin])

  // SECTION: Keypad press
  const handleKey = (digit) => {
    if (loading) return
    if (pin.length >= 4) return
    setError('')
    setPin(prev => prev + digit)
  }

  // SECTION: Backspace
  const handleDelete = () => {
    if (loading) return
    setPin(prev => prev.slice(0, -1))
    setError('')
  }

  // SECTION: Login — looks up profile by PIN
  const handleLogin = async (enteredPin) => {
    if (loading) return
    setLoading(true)
    setError('')

    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        role,
        active,
        workshop_pin,
        workshop_role_id,
        branch_id,
        workshop_roles(id, name, colour)
      `)
      .eq('workshop_pin', enteredPin)
      .eq('active', true)
      .limit(1)

    if (fetchError) {
      setError('System error. Please try again.')
      setPin('')
      setLoading(false)
      return
    }

    const profile = profiles?.[0]

    if (!profile) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      if (newAttempts >= 5) {
        setAttempts(0)
        setError('Incorrect PIN. Please ask your manager to reset your pin.')
      } else {
        setError(
          `Incorrect PIN. ${5 - newAttempts} attempt${
            5 - newAttempts === 1 ? '' : 's'
          } remaining.`
        )
      }
      setPin('')
      setLoading(false)
      return
    }

    // Store workshop session in localStorage
    setWorkshopUser({
      id:               profile.id,
      full_name:        profile.full_name,
      role:             profile.role,
      workshop_role_id: profile.workshop_role_id,
      workshop_role:    profile.workshop_roles,
      branch_id:        profile.branch_id,
    })

    navigate('/workshop/home', { replace: true })
  }

  // SECTION: Render
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col
                    items-center justify-center px-6 select-none">

      {/* Logo */}
      <div className="mb-6 text-center">
        <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center
                        justify-center mx-auto mb-3 shadow-xl">
          <Wrench size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-wide">
          BODYSHOP OS
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Workshop Portal</p>
      </div>

      {/* PIN Card */}
      <div className="w-full max-w-xs bg-gray-800 rounded-3xl p-6 shadow-2xl">

        <p className="text-center text-gray-400 text-sm font-semibold
                      uppercase tracking-wider">
          Enter Your PIN
        </p>

        {/* PIN Dots */}
        <PinDots filled={pin.length} />

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-xl
                          px-4 py-2.5 mb-4 text-center">
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Loading spinner */}
        {loading && (
          <div className="flex justify-center mb-4">
            <div className="w-8 h-8 border-2 border-brand-500
                            border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <KeypadBtn
              key={n}
              label={String(n)}
              onClick={() => handleKey(String(n))}
            />
          ))}
          {/* Bottom row: blank, 0, delete */}
          <div />
          <KeypadBtn label="0" onClick={() => handleKey('0')} />
          <KeypadBtn
            label={<Delete size={24} />}
            onClick={handleDelete}
            variant="delete"
          />
        </div>

      </div>

      <p className="text-gray-700 text-xs mt-8">
        Enter your 4-digit PIN to continue
      </p>

    </div>
  )
}