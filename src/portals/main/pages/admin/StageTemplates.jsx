// ===============================================
// BODYSHOP OS - Admin: Stage Templates
// ===============================================

import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useAuth } from '../../../../hooks/useAuth'
import { useBranch } from '../../../../hooks/useBranch'
import { toast } from 'react-hot-toast'
import {
  Plus, Save, Trash2, GripVertical,
  Settings, ChevronUp, ChevronDown
} from 'lucide-react'

// SECTION: Colour options for stage badges
const COLOUR_OPTIONS = [
  { value: '6366f1', label: 'Indigo'    },
  { value: 'f59e0b', label: 'Amber'     },
  { value: 'ec4899', label: 'Pink'      },
  { value: '8b5cf6', label: 'Purple'    },
  { value: '3b82f6', label: 'Blue'      },
  { value: '22c55e', label: 'Green'     },
  { value: 'ef4444', label: 'Red'       },
  { value: '14b8a6', label: 'Teal'      },
  { value: 'f97316', label: 'Orange'    },
  { value: '6b7280', label: 'Gray'      },
]

// SECTION: Empty template factory
const emptyTemplate = (branchId, order) => ({
  id:               null,
  branch_id:        branchId,
  name:             '',
  description:      '',
  sort_order:       order,
  colour:           '6366f1',
  notify_customer:  false,
  active:           true,
  isNew:            true,
})

export function StageTemplates() {
  
  // SECTION: State
  const [templates, setTemplates] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [ saving,   setSaving]    = useState(false)
  const [dirty,     setDirty]     = useState(false)

  const { profile }  = useAuth()
  const { branchId } = useBranch()

  // SECTION: Detch Templates
  const fetchTemplates = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('stage_templates')
      .select('*')
      .eq('branch_id', branchId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Stage templates fetch error:', error.message)
    }
    if (data) setTemplates(data.map(t => ({ ...t, isNew: false })))
    setLoading(false)
  }

  useEffect(() => { if (branchId) fetchTemplates() }, [branchId])

  // SECTION: Field change handler
  const handleChange = (index, field, value) => {
    setTemplates(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
    setDirty(true)
  }

  // SECTION: Add new stage
  const handleAdd = () => {
    const maxOrder = templates.length > 0
      ? Math.max(...templates.map(t => t.sort_order)) + 1
      : 1
    setTemplates(prev => [...prev, emptyTemplate(branchId, maxOrder)])
    setDirty(true)
  }

  // SECTION: Move stage up or down
  const handleMove = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= templates.length) return

    setTemplates(prev => {
      const next = [...prev]
      const temp = next[index]
      next[index]    = { ...next[newIndex], sort_order: index + 1 }
      next[newIndex] = { ...temp,           sort_order: newIndex + 1 }
      return next
    })
    setDirty(true)
  }

  // SECTION: Toggle active
  const handleToggleActive = (index) => {
    handleChange(index, 'active', !templates[index].active)
  }

  // SECTION: Save all templates
  const handleSave = async () => {
    // Validate - every template must have a name
    const invalid = template.find(t => !t.name.trim())
    if (invalid) {
      toast.error('All stages must have a name')
      return
    }

    setSaving(true)

    try {
      // Reassign sort_order based on current array position
      const normalised = templates.map((t, i) => ({
        ...t,
        sort_order: i + 1,
      }))

      for (const t of normalised) {
        if (t.isNew) {
          // Insert new template
          const { error } = await supabase
            .from('stage_templates')
            .insert({
              branch_id:        branchId,
              name:             t.name.trim(),
              description:      t.description?.trim() || null,
              sort_order:       t.sort_order,
              colour:           t.colour,
              notify_customer:  t.notify_customer,
              active:           t.active,
            })
          if (error) throw new Error(`Insert failed: ${error.message}`)
        } else {
          // Update existing template
          const { error } = await supabase
            .from('stage_templates')
            .update({
              name:             t.name.trim(),
              description:      t.description?.trim() || null,
              sort_order:       t.sort_order,
              colour:           t.colour,
              notify_customer:  t.notify_customer,
              active:           t.active,
            })  
            .eq('id', t.id)
          if (error) throw new Error(`Update failed: ${error.message}`)
        }
      }

      // Audit log
      await supabase.from('audit_log').insert({
        branch_id:      branchId,
        user_id:        profile.id,
        portal:         'main',
        action:         'settings.updated',
        table_name:     'stage_templates',
        new_value:      { count: normalised.length },
      })

      toast.success('Stage templates saved successfully')
      setDirty(false)
      fetchTemplates()

    } catch (err) {
      console.error('Save error:', err)
      toast.error(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  // SECTION: Render
  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Stage Templates
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Define the workshop stages for this branch. These are automatically
            applied to every new job created.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAdd}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus size={15} /> Add Stage
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={15} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Warning if unsaved */}
      {dirty && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg
                        px-4 py-2.5 text-sm text-amber-700 font-medium">
          You have unsaved changes - click Save Changes to apply them.
        </div>
      )}

      {/* Templates List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card h-20 animate-pulse bg-gray-50" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="card text-center py-16">
          <Settings size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="font-semibold text-gray-500">No stage templates yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Click Add Stage to create your first workshop stage
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((t, index) => (
            <div
              key={t.id ?? `new-${index}`}
              className={`card transition-all
                          ${!t.active ? 'opacity-60 bg-gray-50' : ''}`}
            >
              <div className="flex items-start gap-3">

                {/* Order indicator */}
                <div className="flex flex-xol items-center gap-1 shrink-0 pt-1">
                  <span className="text-xs font-bold text-gray-400 w-5
                                   text-center">
                    {index + 1}
                  </span>
                  <button
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="p-0.5 text-gray-300 hover:text-gray-600
                               disabled:opacity-20 transition-colors"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === templates.length - 1}
                    className="p-0.5 text-gray-300 hover:text-gray-600
                               disabled:opacity-20 transition-colors"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                {/* Colour dot */}
                <div className="shrink-0 pt-2">
                  <div
                    className="w-4 h-4 rounded-full border border-white
                               shadow-sm"
                    style={{ backgroundColor: `#${t.colour}` }}
                  />
                </div>

                {/* Fields */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2
                                gap-3 min-w-0">

                  {/* Name */}
                  <div>
                    <label className="label">Stage Name</label>
                    <input
                      className="input-field"
                      value={t.name}
                      onChange={e => handleChange(index, 'name', e.target.value)}
                      placeholder="e.g. Panel Beating"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="label">Description</label>
                    <input
                      className="input-field"
                      value={t.description ?? ''}
                      onChange={e => handleChange(index, 'description', e.target.value)}
                      placeholder="Brief description of this stage"
                    />
                  </div>

                  {/* Colour */}
                  <div>
                    <label className="label">Badge Colour</label>
                    <select
                      className="input-field"
                      value={t.colour}
                      onChange={e => handleChange(index, 'colour', e.target.value)}
                    >
                      {COLOUR_OPTIONS.map(c => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Toggles */}
                  <div className="flex items-end gap-4 pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={t.active}
                        onChange={() => handleToggleActive(index)}
                        className="w-4 h-4 accent-brand-600"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={t.notify_customer}
                        onChange={e =>
                          handleChange(index, 'notify_customer', e.target.checked)
                        }
                        className="w-4 h-4 accent-brand-600"
                      />
                      <span className="text-sm text-gray-700">
                        Notify customer
                      </span>
                    </label>
                  </div>

                </div>

                {/* New badge */}
                {t.isNew && (
                  <span className="text-[10px] font-bold bg-green-100
                                   text-green-700 px-2 py-0.5 rounded-full
                                   shrink-0 mt-1">
                    NEW
                  </span>
                )}

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom save button */}
      {templates.length > 0 && (
        <div className="flex justify-end gap-2">
          <button
            onClick={handleAdd}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus size={15} /> Add Stage
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={15} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Note about existing jobs */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg
                      px-4 py-3 text-sm text-blue-700">
        <strong>Note:</strong> Changes to stage templates only apply to
        new jobs created after saving. Existing jobs keep their current
        stages and must be updated manually from the job detail page.
      </div>

    </div>
  )
}