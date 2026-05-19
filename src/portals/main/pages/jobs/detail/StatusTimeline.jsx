// ===============================================
// BODYSHOP OS - Job Status Timeline
// ===============================================

import { CheckCircle, Clock } from 'lucide-react'
import { getActionLabel, getActionColors } from '../../../../../lib/auditActions'

const STATUS_COLORS = {
  'job.status.changed': 'bg-brand-600',
  'job.created'       : 'bg-green-500',
  'job.created'       : 'bg-blue-500',
  'document.uploaded' : 'bg-purple-500',
  'note.added'        : 'bg-yellow-500',
}

export function StatusTimeline({ logs }) {
  
  // SECTION: Render Empty
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Clock size={28} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">No status history yet</p>
      </div>
    )
  }

  // SECTION: Render Timeline
  return (
    <div className="relative">

      {/* Vertical Line */}
      <div className="absolute left-4 top-4 bottom-0 w-0.5 bg-gray-100" />

      <div className="space-y-4">
        {logs.map((log, index) => {
          const isFirst     = index === 0
          const colors      = getActionColors(log.action)
          const actionLabel = getActionLabel(log.action)
            ?.replace(/\./g, ' → ')
            .replace(/\b\w/g, l => l.toUpperCase())

          return (
            <div key={log.id} className="flex gap-4 relative">

              {/* Dot */}
              <div className={`w-8 h-8 rounded-full flex items-center
                               justify-center shrink-0 z-10
                               ${isFirst ? colors.bg : 'bg-gray-100'}`}>
                <CheckCircle
                  size={14}
                  className={isFirst ? colors.text : 'text-gray-400'}
                />
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`text-sm font-semibold
                                  ${isFirst ? colors.text : 'text-gray-600'}`}>
                      {actionLabel}
                    </p>

                    {/* Status Change */}
                    {log.old_value?.status && log.new_value?.status && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        <span className="line-through text-gray-400">
                          {log.old_value.status.replace(/_/g, ' ')}
                        </span>
                        {' → '}
                        <span className="font-medium text-brand-600">
                          {log.new_value.status.replace(/_/g, ' ')}
                        </span>
                      </p>
                    )}

                    {/* Created */}
                    {log.new_value?.job_number && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Job {log.new_value.job_number} created as{' '}
                        <span className="font-medium">
                          {log.new_value.status?.replace(/_/g, ' ')}
                        </span>
                      </p>
                    )}

                    {/* User */}
                    {log.profiles?.full_name && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        By {log.profiles.full_name}
                      </p>
                    )}
                  </div>

                  {/* Timestamp */}
                  <p className="text-[10px] text-gray-400 whitesprace-nowrap shrink-0">
                    {new Date(log.created_at).toLocaleDateString('en-ZA', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                    {' '}
                    {new Date(log.created_at).toLocaleTimeString('en-ZA', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}