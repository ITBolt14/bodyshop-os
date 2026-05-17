// ===============================================
// BODYSHOP OS - Check-In Wizard Progress Bar
// ===============================================

import { Check } from 'lucide-react'

const STEPS = [
  { number: 1, label: 'Vehicle'     },
  { number: 2, label: 'Job'         },
  { number: 3, label: 'Claim'       },
  { number: 4, label: 'Confirm'    },
]

export function WizardProgress({ currentStep }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, index) => {
        const isComplete = currentStep > step.number
        const isActive   = currentStep === step.number
        const isLast     = index === STEPS.length - 1

        return (
          <div key={step.number} className="flex items-center">

            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center
                               justify-center font-bold text-sm transition-all
                               ${isComplete
                                 ? 'bg-green-500 text-white'
                                 : isActive
                                 ? 'bg-brand-600 text-white shadow-lg shadow-brand-200'
                                 : 'bg-gray-100 text-gray-400'
                               }`}>
                {isComplete
                  ? <Check size={16} />
                  : step.number
                }
              </div>
              <span className={`text-xs mt-1 font-medium
                                ${isActive
                                  ? 'text-brand-600'
                                  : isComplete
                                  ? 'text-green-500'
                                  : 'text-gray-400'
                                }`}>
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {!isLast && (
              <div className={`w-16 sm:w-24 h-0.5 mx-2 mb-4 transition-all
                               ${isComplete
                                 ? 'bg-green-400'
                                 : 'bg-gray-200'
                               }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}