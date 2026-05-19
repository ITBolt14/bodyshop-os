// ===============================================
// BODYSHOP OS - Job Details Tab: Notes
// ===============================================

import { MessageSquare } from 'lucide-react'

export function TabNotes() {
  return (
    <div className="card text-center py-16">
      <MessageSquare size={40} className="mx-auto text-gray-200 mb-3" />
      <p className="font-semibold text-gray-500">Notes</p>
      <p className="text-sm text-gray-400 mt-1">
        Notes & communications coming in Phase 3
      </p>
    </div>
  )
}