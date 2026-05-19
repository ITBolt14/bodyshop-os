// =============================================
// BODYSHOP OS — Job Detail Tab: Full Audit Log
// =============================================

import { Clock } from 'lucide-react'
import { getActionLabel,
         getActionColors,
} from '../../../../../lib/auditActions'

export function TabAudit({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="card text-center py-16">
        <Clock size={40} className="mx-auto text-gray-200 mb-3" />
        <p className="text-gray-400 text-sm">No audit entries yet</p>
      </div>
    )
  }

  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold
                           text-gray-500 uppercase tracking-wider">
              Timestamp
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold
                           text-gray-500 uppercase tracking-wider">
              Action
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold
                           text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold
                           text-gray-500 uppercase tracking-wider">
              Details
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {logs.map(log => {
            const colors = getActionColors(log.action)
            return (
              <tr key={log.id} className="hover:bg-gray-50">

                {/* Timestamp */}
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleDateString('en-ZA', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                  {' '}
                  {new Date(log.created_at).toLocaleTimeString('en-ZA', {
                    hour: '2-digit', minute: '2-digit'
                  })}
                </td>

                {/* Action — friendly label with colour coding */}
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5
                                   rounded-full ${colors.bg} ${colors.text}`}>
                    {getActionLabel(log.action)}
                  </span>
                </td>

                {/* User */}
                <td className="px-4 py-3 text-xs text-gray-700">
                  {log.profiles?.full_name ?? '—'}
                </td>

                {/* Details — human readable */}
                <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                  {(() => {
                    const ov = log.old_value
                    const nv = log.new_value
                    if (ov?.status && nv?.status) {
                      return (
                        <span>
                          <span className="line-through text-gray-400">
                            {ov.status.replace(/_/g, ' ')}
                          </span>
                          {' → '}
                          <span className="font-medium text-brand-600">
                            {nv.status.replace(/_/g, ' ')}
                          </span>
                        </span>
                      )
                    }
                    if (nv?.job_number) {
                      return `Created as ${nv.status?.replace(/_/g, ' ') ?? ''}`
                    }
                    if (nv?.claim_number !== undefined) {
                      return `Claim no: ${nv.claim_number || 'not set'} · Status: ${nv.claim_status?.replace(/_/g, ' ') ?? '—'}`
                    }
                    if (nv) {
                      const keys = Object.keys(nv).slice(0, 2)
                      return keys
                        .map(k => `${k.replace(/_/g, ' ')}: ${nv[k] ?? '—'}`)
                        .join(' · ')
                    }
                    return '—'
                  })()}
                </td>

              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}