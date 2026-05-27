// =============================================
// BODYSHOP OS — Workshop Home
// Job search with on-screen keyboard only
// =============================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { getWorkshopUser, setWorkshopUser } from '../WorkshopPortal'
import { Delete, Search, LogOut, Car, CornerDownLeft } from 'lucide-react'

// SECTION: Keyboard layout
const KB_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
]

// SECTION: On-Screen Keyboard Component
function OnScreenKeyboard({ onKey, onDelete, onSearch, disabled }) {
  return (
    <div className="space-y-2 mt-3">

      {/* Number row */}
      <div className="flex gap-1.5 justify-center">
        {[1,2,3,4,5,6,7,8,9,0].map(n => (
          <button
            key={n}
            onClick={() => onKey(String(n))}
            disabled={disabled}
            className="flex-1 h-11 rounded-xl bg-gray-700 hover:bg-gray-600
                       text-white font-bold text-sm active:scale-95
                       transition-all disabled:opacity-40 select-none"
          >
            {n}
          </button>
        ))}
      </div>

      {/* Alpha rows */}
      {KB_ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-1.5 justify-center">
          {row.map(k => (
            <button
              key={k}
              onClick={() => onKey(k)}
              disabled={disabled}
              className="flex-1 h-12 rounded-xl bg-gray-700 hover:bg-gray-600
                         text-white font-bold text-sm active:scale-95
                         transition-all disabled:opacity-40 select-none"
            >
              {k}
            </button>
          ))}
        </div>
      ))}

      {/* Bottom row: space, backspace, search */}
      <div className="flex gap-1.5">
        <button
          onClick={() => onKey(' ')}
          disabled={disabled}
          className="flex-1 h-12 rounded-xl bg-gray-700 hover:bg-gray-600
                     text-gray-400 font-bold text-sm active:scale-95
                     transition-all disabled:opacity-40 select-none"
        >
          SPACE
        </button>
        <button
          onClick={onDelete}
          disabled={disabled}
          className="px-5 h-12 rounded-xl bg-gray-600 hover:bg-gray-500
                     text-gray-300 active:scale-95 transition-all
                     disabled:opacity-40 select-none"
        >
          <Delete size={18} />
        </button>
        <button
          onClick={onSearch}
          disabled={disabled}
          className="px-5 h-12 rounded-xl bg-brand-600 hover:bg-brand-500
                     text-white active:scale-95 transition-all
                     disabled:opacity-40 select-none flex items-center gap-2"
        >
          <CornerDownLeft size={18} />
          <span className="font-bold text-sm">SEARCH</span>
        </button>
      </div>

    </div>
  )
}

// SECTION: Main Workshop Home Component
export function WorkshopHome() {

  const [search,    setSearch]    = useState('')
  const [searching, setSearching] = useState(false)
  const [results,   setResults]   = useState([])
  const [searched,  setSearched]  = useState(false)
  const [error,     setError]     = useState('')

  const navigate = useNavigate()
  const user     = getWorkshopUser()

  // SECTION: Sign out
  const handleSignOut = () => {
    setWorkshopUser(null)
    navigate('/workshop/login', { replace: true })
  }

  // SECTION: Keyboard input handlers
  const handleKey = (k) => {
    setSearch(prev => (prev + k).toUpperCase())
    setError('')
    setSearched(false)
  }

  const handleDelete = () => {
    setSearch(prev => prev.slice(0, -1))
    setError('')
    setSearched(false)
  }

  // SECTION: Search handler
  const handleSearch = async () => {
    const q = search.trim()
    if (!q) {
      setError('Please enter a job number or registration')
      return
    }

    setSearching(true)
    setResults([])
    setSearched(false)
    setError('')

    // Search by job number
    const { data: byJob } = await supabase
      .from('jobs')
      .select(`
        id, job_number, status, qr_token,
        vehicles(registration, make, model, owner_name)
      `)
      .ilike('job_number', `%${q}%`)
      .in('status', [
        'checked_in', 'awaiting_assessment', 'awaiting_authorization',
        'authorized', 'in_progress', 'quality_check', 'awaiting_parts',
      ])
      .eq('branch_id', user?.branch_id)
      .limit(5)

    // Search by vehicle registration
    const { data: byReg } = await supabase
      .from('jobs')
      .select(`
        id, job_number, status, qr_token,
        vehicles!inner(registration, make, model, owner_name)
      `)
      .filter('vehicles.registration', 'ilike', `%${q}%`)
      .in('status', [
        'checked_in', 'awaiting_assessment', 'awaiting_authorization',
        'authorized', 'in_progress', 'quality_check', 'awaiting_parts',
      ])
      .eq('branch_id', user?.branch_id)
      .limit(5)

    // Merge and deduplicate by job id
    const all   = [...(byJob ?? []), ...(byReg ?? [])]
    const dedup = all.filter(
      (j, i, arr) => arr.findIndex(x => x.id === j.id) === i
    )

    setResults(dedup)
    setSearched(true)
    setSearching(false)
  }

  const statusLabel = (s) =>
    s?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  // SECTION: Render
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">

      {/* Top Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-5 py-3
                      flex items-center justify-between shrink-0">
        <div>
          <p className="text-white font-bold leading-tight">
            {user?.full_name}
          </p>
          <p className="text-gray-500 text-xs">
            {user?.workshop_role?.name ?? user?.role}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-gray-500 hover:text-white
                     transition-colors text-sm py-2 px-3 rounded-xl
                     hover:bg-gray-700"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col px-4 py-4 max-w-2xl mx-auto w-full">

        {/* Search Bar — display only, typed via on-screen keyboard */}
        <div className={`bg-gray-800 border-2 rounded-2xl px-5 py-4
                         flex items-center gap-3 transition-colors
                         ${search ? 'border-brand-500' : 'border-gray-700'}`}>
          <Search size={20} className="text-gray-500 shrink-0" />
          <p className={`flex-1 text-xl font-bold tracking-widest
                         ${search ? 'text-white' : 'text-gray-600'}`}>
            {search || 'Job number or registration...'}
          </p>
          {searching && (
            <div className="w-5 h-5 border-2 border-brand-500
                            border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-red-400 text-sm text-center mt-2 font-medium">
            {error}
          </p>
        )}

        {/* No results */}
        {searched && results.length === 0 && !searching && (
          <div className="text-center py-6">
            <Car size={36} className="mx-auto text-gray-700 mb-2" />
            <p className="text-gray-500 font-semibold">No jobs found</p>
            <p className="text-gray-700 text-sm mt-1">
              Check the number and try again
            </p>
          </div>
        )}

        {/* Search Results */}
        {results.length > 0 && (
          <div className="mt-4 space-y-2">
            {results.map(job => (
              <button
                key={job.id}
                onClick={() => navigate(`/workshop/job/${job.qr_token}`)}
                className="w-full bg-gray-800 border border-gray-700
                           hover:border-brand-500 rounded-2xl p-4 text-left
                           transition-all active:scale-95"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-brand-400 font-black text-lg leading-tight">
                      {job.job_number}
                    </p>
                    <p className="text-white font-bold">
                      {job.vehicles?.registration}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {job.vehicles?.make} {job.vehicles?.model}
                      {job.vehicles?.owner_name && (
                        <> · {job.vehicles.owner_name}</>
                      )}
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-gray-700 text-gray-300
                                   px-3 py-1 rounded-full whitespace-nowrap
                                   shrink-0">
                    {statusLabel(job.status)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* On-Screen Keyboard — always visible at bottom */}
        <div className="mt-auto pt-4">
          <OnScreenKeyboard
            onKey={handleKey}
            onDelete={handleDelete}
            onSearch={handleSearch}
            disabled={searching}
          />
        </div>

      </div>
    </div>
  )
}