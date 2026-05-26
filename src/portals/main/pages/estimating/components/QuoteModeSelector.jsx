// =============================================
// BODYSHOP OS - Quote Mode Selector
// =============================================

import { DollarSign, Clock, Hash } from 'lucide-react'

const MODES = [
  {
    value:          'money',
    label:          'Money',
    description:    'Enter rand values directly',
    icon:           DollarSign,
  },
  {
    value:          'time',
    label:          'Time',
    description:    'Enter hours - multiplied by rate',
    icon:           Clock,
  },
  {
    value:          'units',
    label:          'Units',
    description:    'Enter working units - like Audatex',
    icon:           Hash,
  },
]

export function QuoteModeSelector({ value, onChange, disabled }) {
  return (
    <div className="flex gap-2">
      {MODES.map(mode => {
        const Icon      = mode.icon
        const isActive  = value === mode.value
        return (
          <button
            key={mode.value}
            type="button"
            onClick={() => !disabled && onChange(mode.value)}
            disabled={disabled}
            title={mode.description}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg
                        border-2 text-sm font-semibold transition-all
                        ${isActive
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Icon size={15} />
            {mode.label}
          </button>
        )
      })}
    </div>
  )
}