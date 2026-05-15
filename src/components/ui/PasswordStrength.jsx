// ===============================================
// BODYSHOP OS - Password Strength Validator
// ===============================================

import { Check, X } from 'lucide-react'

const rules = [
  { key: 'length',      label: 'At least 8 characters',             test: (p) => p.length >= 8 },
  { key: 'upper',       label: 'At least one uppercase letter',     test: (p) => /[A-Z]/.test(p) },
  { key: 'lower',       label: 'At least one lowercase letter',     test: (p) => /[a-z]/.test(p) },
  { key: 'number',      label: 'At least one number',               test: (p) => /[0-9]/.test(p) },
  { key: 'special',     label: 'At least one special character',    test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
]

export function PasswordStrength({ password }) {
  
    // SECTION: Render Nothing If Empty
    if (!password) return null
    
    // SECTION: Render Rules
    return (
      <ul className="mt-2 space-y-1">
        {rules.map(rule => {
          const passed = rule.test(password)
          return (
            <li
              key={rule.key}
              className={`flex items-center gap-2 text-xs transition-colors
                ${passed ? 'text-green-600' : 'text-red-500'}`}
            >
              {passed
                ? <Check size={12} className="shrink-0" />
                : <X     size={12} className="shrink-0" />
              }
              {rule.label}
            </li>
          )
        })}
      </ul>
    )
}

// Export the rules so forms can validate before submitting
export function validatePassword(password) {
  return rules.every(rule => rule.test(password))
}