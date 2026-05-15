// ===============================================
// BODYSHOP OS - Password Input UI Component
// ===============================================

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder = 'Enter password',
  label,
  disabled = false,
  autoComplete = 'current-password',
}) {

  // SECTION: State
  const [show, setShow] = useState(false)

  // SECTION: Render
  return (
    <div>
      {/* Label */}
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}

      {/* Input Wrapper */}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className="input-field pr-10"
        />

        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => setShow(prev => !prev)}
          className="absolute inset-y-0 right-0 flex items-center pr-3
                     text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  )
}