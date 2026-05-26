// =============================================
// BODYSHOP OS — Estimating List
// =============================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Search } from 'lucide-react'
import { supabase } from '../../../../lib/supabase'
import { useBranch } from '../../../../hooks/useBranch'

// SECTION: Constants
const STATUS_STYLES = {
  draft:               'bg-gray-100 text-gray-600',
  submitted:           'bg-blue-100 text-blue-700',
  approved:            'bg-green-100 text-green-700',
  partially_approved:  'bg-yellow-100 text-yellow-700',
  rejected:            'bg-red-100 text-red-700',
  supplementary:       'bg-purple-100 text-purple-700',
}

const fmt = (v) => `R ${Number(v || 0).toLocaleString('en-ZA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`

export function EstimatingList() {

  // SECTION: State
  // Fixed: was declared as 'estimating' but used as 'estimates' everywhere
  const [estimates, setEstimates] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')

  const { branchId } = useBranch()
  const navigate     = useNavigate()

  // SECTION: Fetch Estimates
  useEffect(() => {
    if (!branchId) return

    const fetchEstimates = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('estimates')
        .select(`
          id,
          status,
          quote_mode,
          version,
          total_incl_vat,
          created_at,
          updated_at,
          job_id,
          jobs (
            job_number,
            vehicles (
              registration,
              make,
              model,
              owner_name
            )
          )
        `)
        .eq('branch_id', branchId)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Estimates fetch error:', error.message)
      }

      if (data) setEstimates(data)
      setLoading(false)
    }

    fetchEstimates()
  }, [branchId])

  // SECTION: Search Filter
  const filtered = estimates.filter(e => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      e.jobs?.job_number?.toLowerCase().includes(q)              ||
      e.jobs?.vehicles?.registration?.toLowerCase().includes(q)  ||
      e.jobs?.vehicles?.owner_name?.toLowerCase().includes(q)
    )
  })

  // SECTION: Render
  return (
    <div className="max-w-5xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Estimates</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading
              ? 'Loading...'
              : `${estimates.length} estimate${estimates.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          className="input-field pl-9"
          placeholder="Search by job number, registration, owner name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-20 animate-pulse bg-gray-50" />
          ))}
        </div>

      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <FileText size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="font-semibold text-gray-500">No estimates yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Open a job and click the Estimating tab to create one
          </p>
        </div>

      ) : (
        <div className="space-y-2">
          {filtered.map(est => (
            <button
              key={est.id}
              onClick={() => navigate(`/main/estimating/${est.job_id}`)}
              className="w-full card text-left hover:shadow-md
                         transition-shadow duration-200"
            >
              <div className="flex items-center justify-between gap-4">

                {/* Left — Job info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-brand-700 text-sm">
                      {est.jobs?.job_number}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5
                                     rounded-full uppercase tracking-wide
                                     ${STATUS_STYLES[est.status]
                                       ?? 'bg-gray-100 text-gray-600'}`}>
                      {est.status?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase">
                      v{est.version} · {est.quote_mode}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {est.jobs?.vehicles?.make} {est.jobs?.vehicles?.model}
                    {est.jobs?.vehicles?.registration
                      ? ` · ${est.jobs.vehicles.registration}`
                      : ''
                    }
                    {est.jobs?.vehicles?.owner_name
                      ? ` · ${est.jobs.vehicles.owner_name}`
                      : ''
                    }
                  </p>
                </div>

                {/* Right — Total */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-800">
                    {fmt(est.total_incl_vat)}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    incl. VAT
                  </p>
                </div>

              </div>
            </button>
          ))}
        </div>
      )}

    </div>
  )
}