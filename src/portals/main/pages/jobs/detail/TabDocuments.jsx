// ===============================================
// BODYSHOP OS - Job Detail Tab: Documents
// ===============================================

import { FolderOpen } from 'lucide-react'

export function TabDocuments() {
  return (
    <div className="card text-center py-16">
      <FolderOpen size={40} className="mx-auto text-gray-200 mb-3" />
      <p className="font-semibold text-gray-500">Documents</p>
      <p className="text-sm text-gray-400 mt-1">
        Document management coming in Phase 3
      </p>
    </div>
  )
}