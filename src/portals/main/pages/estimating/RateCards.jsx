// =============================================
// BODYSHOP OS - Rate Cards Setup
// =============================================

import { useState, useEffect } from 'react'
import { Plus, Edit2, Save, X, DollarSign } from 'lucide-react'
import { supabase } from '../../../../lib/supabase'
import { useAuth } from '../../../../hooks/useAuth'
import { useBranch } from '../../../../hooks/useBranch'
import { toast } from 'react-hot-toast'

// SECTION: Empty Rate Card
const emptyCard = (branchId, profileId) => ({
  branch_id:                branchId,
  insurer_id:               null,
  name:                     '',
  labour_rate:              0,
  paint_rate:               0,
  paint_material_rate:      0,
  strip_rate:               0,
  effective_from:           new Date().toISOString().split('T')[0],
  effective_to:             null,
  active:                   true,
  created_by:               profileId,
})

// SECTION: Rate Card Form
function RateCardForm({ card, insurers, onSave, onCancel, saving }) {
  const [form, setForm] = useState({ ...card })

  const fc = (name, value) =>
    setForm(prev => ({ ...prev, [name]: value }))

  return (
    <div className="card border-brand-200 bg-brand-50">
      <h3 className="font-semibold text-brand-700 mb-4 text-sm">
        {card.id ? 'Edit Rate Card' : 'New Rate Card'}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Name */}
        <div className="sm:col-span-2">
            <label className="label">Rate Card Name</label>
            <input
              className="input-field"
              value={form.name}
              onChange={e => fc('name', e.target.value)}
              placeholder="e.g. Branch Default 2026 or Discovery Agreed Rates 2026"
            />
        </div>

        {/* Insurer */}
        <div>
          <label className="label">Insurer</label>
          <select
            className="input-field"
            value={form.insurer_id ?? ''}
            onChange={e => fc('insurer_id', e.target.value || null)}
          >
            <option value="">Branch Default (no insurer)</option>
            {insurers.map(i => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Leave blank to set this as the branch default rate card
          </p>
        </div>

        {/* Effective From */}
        <div>
          <label className="label">Effective From</label>
          <input
            type="date"
            className="input-field"
            value={form.effective_from ?? ''}
            onChange={e => fc('effective_from', e.target.value)}
          />
        </div>

        {/* Rate Fields */}
        <div>
          <label className="label">Labour Rate (R per hour)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2
                             text-gray-400 text-sm font-medium">R</span>
            <input
              type="number"
              className="input-field pl-7"
              value={form.labour_rate}
              onChange={e => fc('labour_rate', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="label">Strip & Assemble Rate (R per hour)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2
                             text-gray-400 text-sm font-medium">R</span>
            <input
              type="number"
              className="input-field pl-7"
              value={form.strip_rate}
              onChange={e => fc('strip_rate', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="label">Paint Rate (R per hour)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2
                             text-gray-400 text-sm font-medium">R</span>
            <input
              type="number"
              className="input-field pl-7"
              value={form.paint_rate}
              onChange={e => fc('paint_rate', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="label">Paint Mateiral Rate (R per hour)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2
                             text-gray-400 text-sm font-medium">R</span>
            <input
              type="number"
              className="input-field pl-7"
              value={form.paint_material_rate}
              onChange={e => fc('paint_material_rate', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Active Toggle */}
        <div className="sm:col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="rc_active"
            checked={form.active}
            onChange={e => fc('active', e.target.checked)}
            className="w-4 h-4 accent-brand-600"
          />
          <label htmlFor="rc_active" className="text-sm text-gray-700">
            Active
          </label>
        </div>

      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onCancel}
          className="btn-secondary flex items-center gap-2"
        >
          <X size={14} /> Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.name.trim()}
          className="btn-primary flex items-center gap-2"
        >
          <Save size={14} />
            {saving ? 'Saving...' : 'Save Rate Card'}
        </button>
      </div>
    </div>
  )
}

// SECTION: Main Rate Cards Component
export function RateCards() {
  
  const [rateCards,         setRateCards]       = useState([])
  const [insurers,          setInsurers]        = useState([])
  const [loading,           setLoading]         = useState(true)
  const [showForm,          setShowForm]        = useState(false)
  const [editingCard,       setEditingCard]     = useState(null)
  const [saving,            setSaving]          = useState(false)

  const { profile }  = useAuth()
  const { branchId } = useBranch()

  // SECTION: Fetch Data
  const fetchData = async () => {
    setLoading(true)

    const [{ data: cards }, { data: ins }] = await Promise.all([
      supabase
        .from('rate_cards')
        .select('*, insurers(name)')
        .eq('branch_id', branchId)
        .order('effective_from', { ascending: false }),
      supabase
        .from('insurers')
        .select('id, name')
        .eq('active', true)
        .order('name'),
    ])

    if (cards) setRateCards(cards)
    if (ins)   setInsurers(ins)
    setLoading(false)
  }

  useEffect(() => { if (branchId) fetchData() }, [branchId])

  // SECTION: Save Handler
  const handleSave = async (form) => {
    setSaving(true)

    const isNew = !form.id

    const payload = {
      branch_id:            form.branch_id,
      insurer_id:           form.insurer_id             || null,
      name:                 form.name,
      labour_rate:          form.labour_rate            || 0,
      paint_rate:           form.paint_rate             || 0,
      paint_material_rate:  form.paint_material_rate    || 0,
      strip_rate:           form.strip_rate             || 0,
      effective_from:       form.effective_from,
      effective_to:         form.effective_to           || null,
      active:               form.active,
      created_by:           profile.id,
    }

    const { error } = isNew
      ? await supabase.from('rate_cards').insert(payload)
      : await supabase.from('rate_cards').update(payload).eq('id', form.id)

    if (error) {
      toast.error(error.message)
      setSaving(false)
      return
    }

    await supabase.from('audit_log').insert({
      branch_id:    branchId,
      user_id:      profile.id,
      portal:       'main',
      action:       isNew ? 'rate_card.created' : 'rate_card.updated',
      table_name:   'rate_cards',
      new_value:    { name: form.name, labour_rate: form.labour_rate },
    })

    toast.success(isNew ? 'Rate card created' : 'Rate card updated')
    setSaving(false)
    setShowForm(false)
    setEditingCard(null)
    fetchData()
  }

  // SECTION: Format Currency
  const fmt = (v) => `R ${Number(v).toFixed(2)}`

  // SECTION: Render
  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rate Cards</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Set labour, strip & assemble, and paint rates per insurer
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setEditingCard(emptyCard(branchId, profile.id))
              setShowForm(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} /> New Rate Card
          </button>
        )}
      </div>

      {/* New / Edit Form */}
      {showForm && editingCard && (
        <RateCardForm
          card={editingCard}
          insurers={insurers}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingCard(null) }}
          saving={saving}
        />
      )}

      {/* Rate Cards List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-gray-50" />
          ))}
        </div>
      ) : rateCards.length === 0 ? (
        <div className="card text-center py-16">
          <DollarSign size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="font-semibold text-gray-500">No rate cards yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Create a branch default card to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rateCards.map(card => (
            <div key={card.id} className="card">

              {/* Edit form inline */}
              {editingCard?.id === card.id && showForm ? (
                <RateCardForm
                  card={editingCard}
                  insurers={insurers}
                  onSave={handleSave}
                  onCancel={() => { setShowForm(false); setEditingCard(null) }}
                  saving={saving}
                />
              ) : (
                <div className="flex items-start justify-between gap-4">

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-800">
                        {card.name}
                      </h3>
                      {!card.insurer_id && (
                        <span className="text-[10px] font-bold uppercase
                                         bg-brand-100 text-brand-700
                                         px-2 py-0.5 rounded-full">
                          Branch Default
                        </span>
                      )}
                      {card.insurers?.name && (
                        <span className="text-[10px] font-bold uppercase
                                         bg-purple-100 text-purple-700
                                         px-2 py-0.5 rounded-full">
                          {card.insurers.name}
                        </span>
                      )}
                      {!card.active && (
                        <span className="text-[10px] font-bold uppercase
                                         bg-red-100 text-red-600
                                         px-2 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div> 

                    <p className="text-xs text-gray-400 mt-1">
                      Effective from {new Date(card.effective_from)
                        .toLocaleDateString('en-ZA', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                    </p>

                    {/* Rates Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase
                                      tracking-wider">Labour</p>
                        <p className="text-sm font-bold text-gray-800">
                          {fmt(card.labour_rate)}/hr
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase
                                      tracking-wider">Strip & Assemble</p>
                        <p className="text-sm font-bold text-gray-800">
                          {fmt(card.strip_rate)}/hr
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase
                                      tracking-wider">Paint</p>
                        <p className="text-sm font-bold text-gray-800">
                          {fmt(card.paint_rate)}/hr
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase
                                      tracking-wider">Paint Materials</p>
                        <p className="text-sm font-bold text-gray-800">
                          {fmt(card.paint_material_rate)}/hr
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => {
                      setEditingCard({ ...card })
                      setShowForm(true)
                    }}
                    className="btn-seconday p-2"
                    title="Edit Rate Card"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>              
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}