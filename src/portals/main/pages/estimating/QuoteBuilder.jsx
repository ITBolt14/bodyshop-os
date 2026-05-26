// =============================================
// BODYSHOP OS — Quote Builder
// =============================================

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, Send, ArrowLeft, RefreshCw } from 'lucide-react'
import { supabase } from '../../../../lib/supabase'
import { useAuth } from '../../../../hooks/useAuth'
import { useBranch } from '../../../../hooks/useBranch'
import { toast } from 'react-hot-toast'
import { QuoteModeSelector } from './components/QuoteModeSelector'
import { QuoteLines, emptyLine } from './components/QuoteLines'
import { QuoteTotals } from './components/QuoteTotals'

const VAT_RATE = 15

export function QuoteBuilder() {

  const { jobId }    = useParams()
  const navigate     = useNavigate()
  const { profile }  = useAuth()
  const { branchId } = useBranch()

  // SECTION: State
  const [job,          setJob]          = useState(null)
  const [estimate,     setEstimate]     = useState(null)
  const [lines,        setLines]        = useState([])
  const [operations,   setOperations]   = useState([])
  const [rateCards,    setRateCards]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)

  // Estimate header fields
  const [mode,          setMode]         = useState('money')
  const [rateCardId,    setRateCardId]   = useState(null)
  const [unitValue,     setUnitValue]    = useState(0.1)
  const [vatInclusive,  setVatInclusive] = useState(false)
  const [internalNotes, setInternalNotes]= useState('')
  const [insurerNotes,  setInsurerNotes] = useState('')
  const [versionNotes,  setVersionNotes] = useState('')
  const [source,        setSource]       = useState('manual')

  // SECTION: Active Rate Card
  const activeRateCard = useMemo(() =>
    rateCards.find(rc => rc.id === rateCardId) ?? rateCards[0] ?? null,
    [rateCards, rateCardId]
  )

  const rates = useMemo(() => ({
    labour_rate:         activeRateCard?.labour_rate         ?? 0,
    strip_rate:          activeRateCard?.strip_rate          ?? 0,
    paint_rate:          activeRateCard?.paint_rate          ?? 0,
    paint_material_rate: activeRateCard?.paint_material_rate ?? 0,
    unit_value:          unitValue,
  }), [activeRateCard, unitValue])

  // SECTION: Fetch All Data
  const fetchData = useCallback(async () => {
    setLoading(true)

    // Fetch job
    const { data: jobData } = await supabase
      .from('jobs')
      .select('*, insurers(id, name)')
      .eq('id', jobId)
      .single()

    if (!jobData) {
      navigate('/main/estimating')
      return
    }
    setJob(jobData)

    // Fetch existing estimate
    const { data: estData } = await supabase
      .from('estimates')
      .select('*')
      .eq('job_id', jobId)
      .maybeSingle()

    // Fetch operations
    const { data: opsData } = await supabase
      .from('estimate_operations')
      .select('*')
      .or(`branch_id.is.null,branch_id.eq.${branchId}`)
      .eq('active', true)
      .order('category')
      .order('sort_order')

    if (opsData) setOperations(opsData)

    // Fetch rate cards for this branch
    const { data: rcData } = await supabase
      .from('rate_cards')
      .select('*')
      .eq('branch_id', branchId)
      .eq('active', true)
      .order('effective_from', { ascending: false })

    if (rcData) setRateCards(rcData)

    if (estData) {
      // Load existing estimate
      setEstimate(estData)
      setMode(estData.quote_mode         ?? 'money')
      setRateCardId(estData.rate_card_id ?? null)
      setUnitValue(estData.unit_value    ?? 0.1)
      setVatInclusive(estData.vat_inclusive ?? false)
      setInternalNotes(estData.internal_notes ?? '')
      setInsurerNotes(estData.insurer_notes   ?? '')
      setSource(estData.source               ?? 'manual')

      // Fetch existing lines
      const { data: linesData } = await supabase
        .from('estimate_lines')
        .select('*')
        .eq('estimate_id', estData.id)
        .order('sort_order')

      if (linesData) {
        setLines(linesData.map(l => ({ ...l, _key: l.id })))
      }
    } else {
      // New estimate — pick best rate card
      if (rcData && rcData.length > 0) {
        const insurerCard = rcData.find(rc => rc.insurer_id === jobData.insurer_id)
        const defaultCard = rcData.find(rc => !rc.insurer_id)
        const best = insurerCard ?? defaultCard ?? rcData[0]
        setRateCardId(best.id)
      }
    }

    setLoading(false)
  }, [jobId, branchId])

  useEffect(() => { fetchData() }, [fetchData])

  // SECTION: Recalculate lines when unit value changes (units mode only)
  useEffect(() => {
    if (mode !== 'units') return
    setLines(prev => prev.map(line => {
      const { labour_rate, strip_rate, paint_rate, paint_material_rate } = rates
      const uv = unitValue || 0.1

      const tLabour = (line.input_labour         || 0) * uv * (labour_rate || 0)
      const tStrip  = (line.input_strip_assemble || 0) * uv * (strip_rate  || 0)
      const tPaint  = (line.input_paint          || 0) * uv *
                      ((paint_rate || 0) + (paint_material_rate || 0))

      const qty = line.quantity || 1
      const lineTotal = (
        tLabour + tStrip + tPaint +
        (line.input_parts  || 0) +
        (line.input_sublet || 0) +
        (line.input_other  || 0)
      ) * qty

      return {
        ...line,
        total_labour:         tLabour,
        total_strip_assemble: tStrip,
        total_paint:          tPaint,
        total_parts:          line.input_parts  || 0,
        total_sublet:         line.input_sublet || 0,
        total_other:          line.input_other  || 0,
        line_total:           lineTotal,
      }
    }))
  }, [unitValue])

  // SECTION: Calculate Totals
  const totals = useMemo(() => {
    const subtotal_labour = lines.reduce((s, l) => s + (l.total_labour         || 0), 0)
    const subtotal_strip  = lines.reduce((s, l) => s + (l.total_strip_assemble || 0), 0)
    const subtotal_paint  = lines.reduce((s, l) => s + (l.total_paint          || 0), 0)
    const subtotal_parts  = lines.reduce((s, l) => s + (l.total_parts          || 0), 0)
    const subtotal_sublet = lines.reduce((s, l) => s + (l.total_sublet         || 0), 0)
    const subtotal_other  = lines.reduce((s, l) => s + (l.total_other          || 0), 0)

    const subtotal_excl_vat = vatInclusive
      ? (subtotal_labour + subtotal_strip + subtotal_paint +
         subtotal_parts + subtotal_sublet + subtotal_other) / (1 + VAT_RATE / 100)
      : subtotal_labour + subtotal_strip + subtotal_paint +
        subtotal_parts + subtotal_sublet + subtotal_other

    const vat_amount     = subtotal_excl_vat * (VAT_RATE / 100)
    const total_incl_vat = subtotal_excl_vat + vat_amount

    const approved_total = lines
      .filter(l => l.approved === true)
      .reduce((s, l) => s + (l.approved_total || l.line_total || 0), 0)

    const pending_total = lines
      .filter(l => l.approved === null || l.approved === undefined)
      .reduce((s, l) => s + (l.line_total || 0), 0)

    return {
      subtotal_labour,
      subtotal_strip,
      subtotal_paint,
      subtotal_parts,
      subtotal_sublet,
      subtotal_other,
      subtotal_excl_vat,
      vat_amount,
      total_incl_vat,
      approved_total,
      pending_total,
    }
  }, [lines, vatInclusive])

  // SECTION: Line Handlers
  const handleLineChange = (index, updated) => {
    setLines(prev => {
      const next = [...prev]
      next[index] = updated
      return next
    })
  }

  const handleLineDelete = (index) => {
    setLines(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddLine = () => {
    setLines(prev => [...prev, emptyLine()])
  }

  // SECTION: Mode Switch Handler
  // Converts input values to their equivalent in the new mode
  // so the rand value of the quote stays the same
  const handleModeChange = (m) => {
    setMode(m)
    setLines(prev => prev.map(line => {
      const {
        labour_rate, strip_rate,
        paint_rate, paint_material_rate
      } = rates
      const uv = unitValue || 0.1

      // Step 1 — Calculate what current inputs are worth in rands
      // using the CURRENT mode (before the switch)
      let currentLabourRand = 0
      let currentStripRand  = 0
      let currentPaintRand  = 0

      if (mode === 'money') {
        currentLabourRand = line.input_labour         || 0
        currentStripRand  = line.input_strip_assemble || 0
        currentPaintRand  = line.input_paint          || 0
      } else if (mode === 'time') {
        currentLabourRand = (line.input_labour         || 0) * (labour_rate || 0)
        currentStripRand  = (line.input_strip_assemble || 0) * (strip_rate  || 0)
        currentPaintRand  = (line.input_paint          || 0) *
                            ((paint_rate || 0) + (paint_material_rate || 0))
      } else if (mode === 'units') {
        currentLabourRand = (line.input_labour         || 0) * uv * (labour_rate || 0)
        currentStripRand  = (line.input_strip_assemble || 0) * uv * (strip_rate  || 0)
        currentPaintRand  = (line.input_paint          || 0) * uv *
                            ((paint_rate || 0) + (paint_material_rate || 0))
      }

      // Step 2 — Convert those rand values into the NEW mode's input format
      let newInputLabour = 0
      let newInputStrip  = 0
      let newInputPaint  = 0

      if (m === 'money') {
        // Target money — inputs are rand values directly
        newInputLabour = currentLabourRand
        newInputStrip  = currentStripRand
        newInputPaint  = currentPaintRand
      } else if (m === 'time') {
        // Target time — inputs are hours (rand / rate)
        newInputLabour = labour_rate > 0
          ? currentLabourRand / labour_rate : 0
        newInputStrip  = strip_rate > 0
          ? currentStripRand / strip_rate : 0
        newInputPaint  = (paint_rate + paint_material_rate) > 0
          ? currentPaintRand / (paint_rate + paint_material_rate) : 0
      } else if (m === 'units') {
        // Target units — inputs are working units (rand / uv / rate)
        newInputLabour = (labour_rate * uv) > 0
          ? currentLabourRand / (labour_rate * uv) : 0
        newInputStrip  = (strip_rate * uv) > 0
          ? currentStripRand / (strip_rate * uv) : 0
        newInputPaint  = ((paint_rate + paint_material_rate) * uv) > 0
          ? currentPaintRand / ((paint_rate + paint_material_rate) * uv) : 0
      }

      // Step 3 — Round to sensible decimal places
      const round = (v, d) => Math.round(v * 10 ** d) / 10 ** d
      if (m === 'money' || m === 'time') {
        newInputLabour = round(newInputLabour, 2)
        newInputStrip  = round(newInputStrip,  2)
        newInputPaint  = round(newInputPaint,  2)
      } else {
        newInputLabour = round(newInputLabour, 4)
        newInputStrip  = round(newInputStrip,  4)
        newInputPaint  = round(newInputPaint,  4)
      }

      // Step 4 — Recalculate totals using new inputs and new mode
      let tLabour = 0, tStrip = 0, tPaint = 0

      if (m === 'money') {
        tLabour = newInputLabour
        tStrip  = newInputStrip
        tPaint  = newInputPaint
      } else if (m === 'time') {
        tLabour = newInputLabour * (labour_rate || 0)
        tStrip  = newInputStrip  * (strip_rate  || 0)
        tPaint  = newInputPaint  * ((paint_rate || 0) + (paint_material_rate || 0))
      } else {
        tLabour = newInputLabour * uv * (labour_rate || 0)
        tStrip  = newInputStrip  * uv * (strip_rate  || 0)
        tPaint  = newInputPaint  * uv * ((paint_rate || 0) + (paint_material_rate || 0))
      }

      const qty = line.quantity || 1
      const lineTotal = (
        tLabour + tStrip + tPaint +
        (line.input_parts  || 0) +
        (line.input_sublet || 0) +
        (line.input_other  || 0)
      ) * qty

      return {
        ...line,
        input_labour:         newInputLabour,
        input_strip_assemble: newInputStrip,
        input_paint:          newInputPaint,
        total_labour:         tLabour,
        total_strip_assemble: tStrip,
        total_paint:          tPaint,
        total_parts:          line.input_parts  || 0,
        total_sublet:         line.input_sublet || 0,
        total_other:          line.input_other  || 0,
        line_total:           lineTotal,
      }
    }))
  }

  // SECTION: Save Handler
  const handleSave = async (newStatus = null) => {
    if (lines.length === 0) {
      toast.error('Add at least one line before saving')
      return
    }

    setSaving(true)

    try {
      const estimatePayload = {
        branch_id:            branchId,
        job_id:               jobId,
        insurer_id:           job.insurer_id || null,
        rate_card_id:         rateCardId     || null,
        source,
        quote_mode:           mode,
        unit_value:           unitValue,
        status:               newStatus ?? estimate?.status ?? 'draft',
        submitted_at:         newStatus === 'submitted'
          ? new Date().toISOString()
          : (estimate?.submitted_at ?? null),
        labour_rate:          rates.labour_rate,
        paint_rate:           rates.paint_rate,
        paint_material_rate:  rates.paint_material_rate,
        strip_rate:           rates.strip_rate,
        subtotal_labour:      totals.subtotal_labour,
        subtotal_strip:       totals.subtotal_strip,
        subtotal_paint:       totals.subtotal_paint,
        subtotal_parts:       totals.subtotal_parts,
        subtotal_sublet:      totals.subtotal_sublet,
        subtotal_other:       totals.subtotal_other,
        subtotal_excl_vat:    totals.subtotal_excl_vat,
        vat_amount:           totals.vat_amount,
        vat_rate:             VAT_RATE,
        vat_inclusive:        vatInclusive,
        total_incl_vat:       totals.total_incl_vat,
        excess_amount:        0,
        net_insurer_amount:   totals.total_incl_vat,
        approved_pending_diff: totals.approved_total > 0
          ? totals.total_incl_vat - totals.approved_total
          : 0,
        internal_notes:       internalNotes || null,
        insurer_notes:        insurerNotes  || null,
        version:              (estimate?.version ?? 0) + 1,
        version_notes:        versionNotes  || null,
        created_by:           profile.id,
      }

      let estimateId = estimate?.id

      if (!estimateId) {
        // Create new estimate
        const { data: newEst, error: estErr } = await supabase
          .from('estimates')
          .insert(estimatePayload)
          .select('id')
          .single()

        if (estErr) throw new Error(`Estimate save failed: ${estErr.message}`)
        estimateId = newEst.id
      } else {
        // Update existing estimate
        const { error: estErr } = await supabase
          .from('estimates')
          .update(estimatePayload)
          .eq('id', estimateId)

        if (estErr) throw new Error(`Estimate update failed: ${estErr.message}`)
      }

      // Delete existing lines and reinsert fresh
      await supabase
        .from('estimate_lines')
        .delete()
        .eq('estimate_id', estimateId)

      const linePayload = lines.map((line, index) => ({
        estimate_id:          estimateId,
        branch_id:            branchId,
        sort_order:           index,
        operation_id:         line.operation_id         || null,
        operation_name:       line.operation_name       || '',
        description:          line.description          || '',
        quantity:             line.quantity             || 1,
        input_labour:         line.input_labour         || 0,
        input_strip_assemble: line.input_strip_assemble || 0,
        input_paint:          line.input_paint          || 0,
        input_parts:          line.input_parts          || 0,
        input_sublet:         line.input_sublet         || 0,
        input_other:          line.input_other          || 0,
        total_labour:         line.total_labour         || 0,
        total_strip_assemble: line.total_strip_assemble || 0,
        total_paint:          line.total_paint          || 0,
        total_parts:          line.total_parts          || 0,
        total_sublet:         line.total_sublet         || 0,
        total_other:          line.total_other          || 0,
        line_total:           line.line_total           || 0,
        approved:             line.approved             ?? null,
        panel_name:           line.panel_name           || null,
        audatex_code:         line.audatex_code         || null,
        notes:                line.notes                || null,
      }))

      const { error: linesErr } = await supabase
        .from('estimate_lines')
        .insert(linePayload)

      if (linesErr) throw new Error(`Lines save failed: ${linesErr.message}`)

      // Save version snapshot to history
      await supabase.from('estimate_history').insert({
        estimate_id:    estimateId,
        branch_id:      branchId,
        version:        estimatePayload.version,
        quote_mode:     mode,
        total_incl_vat: totals.total_incl_vat,
        notes:          versionNotes || null,
        snapshot:       { ...estimatePayload, lines },
        created_by:     profile.id,
      })

      // Audit log
      await supabase.from('audit_log').insert({
        branch_id:  branchId,
        user_id:    profile.id,
        portal:     'main',
        action:     estimate ? 'estimate.revised' : 'estimate.created',
        table_name: 'estimates',
        record_id:  estimateId,
        new_value:  {
          total_incl_vat: totals.total_incl_vat,
          version:        estimatePayload.version,
          status:         estimatePayload.status,
        },
      })

      toast.success(
        newStatus === 'submitted'
          ? 'Estimate submitted to insurer'
          : 'Estimate saved successfully'
      )

      fetchData()

    } catch (err) {
      console.error('Estimate save error:', err)
      toast.error(err.message || 'Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // SECTION: Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-600
                          border-t-transparent rounded-full
                          animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Loading estimate...</p>
        </div>
      </div>
    )
  }

  // SECTION: Render
  return (
    <div className="max-w-[1400px] mx-auto space-y-4">

      {/* SECTION: Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">

        {/* Left — Back + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/main/jobs/${jobId}`)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600
                       hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Estimate — {job?.job_number}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {job?.insurers?.name ?? 'Private'} ·{' '}
              {estimate
                ? `Version ${estimate.version} · ${estimate.status
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase())}`
                : 'New Estimate'
              }
            </p>
          </div>
        </div>

        {/* Right — Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchData}
            className="btn-secondary p-2"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="btn-secondary flex items-center gap-2"
          >
            <Save size={15} />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave('submitted')}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <Send size={15} />
            Submit to Insurer
          </button>
        </div>

      </div>

      {/* SECTION: Settings Row — Mode, Rate Card, Unit Value, VAT */}
      <div className="card">
        <div className="flex items-center justify-between gap-4 flex-wrap">

          {/* Quote Mode */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
              Quote Mode
            </p>
            <QuoteModeSelector
              value={mode}
              onChange={handleModeChange}
            />
          </div>

          {/* Rate Card */}
          <div className="flex-1 min-w-[200px] max-w-xs">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
              Rate Card
            </p>
            <select
              className="input-field text-sm"
              value={rateCardId ?? ''}
              onChange={e => setRateCardId(e.target.value || null)}
            >
              <option value="">No rate card</option>
              {rateCards.map(rc => (
                <option key={rc.id} value={rc.id}>
                  {rc.name} — Labour: R{rc.labour_rate}/hr
                </option>
              ))}
            </select>
          </div>

          {/* Unit Value — only shown in units mode */}
          {mode === 'units' && (
            <div className="w-40">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                Unit Value (R)
              </p>
              <input
                type="number"
                className="input-field text-sm"
                value={unitValue}
                onChange={e => setUnitValue(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.0001"
                placeholder="0.1"
              />
            </div>
          )}

          {/* VAT Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="vat_inclusive"
              checked={vatInclusive}
              onChange={e => setVatInclusive(e.target.checked)}
              className="w-4 h-4 accent-brand-600"
            />
            <label htmlFor="vat_inclusive" className="text-sm text-gray-700">
              Prices VAT Inclusive
            </label>
          </div>

        </div>

        {/* Active Rate Card Rate Summary */}
        {activeRateCard && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex gap-6
                          text-xs text-gray-500 flex-wrap">
            <span>
              Labour:{' '}
              <strong className="text-gray-700">
                R{activeRateCard.labour_rate}/hr
              </strong>
            </span>
            <span>
              Strip &amp; Assemble:{' '}
              <strong className="text-gray-700">
                R{activeRateCard.strip_rate}/hr
              </strong>
            </span>
            <span>
              Paint:{' '}
              <strong className="text-gray-700">
                R{activeRateCard.paint_rate}/hr
              </strong>
            </span>
            <span>
              Paint Materials:{' '}
              <strong className="text-gray-700">
                R{activeRateCard.paint_material_rate}/hr
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* SECTION: Main Content — Lines + Totals side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">

        {/* Quote Lines — 3/4 width */}
        <div className="xl:col-span-3">
          <QuoteLines
            lines={lines}
            operations={operations}
            mode={mode}
            rates={rates}
            onChange={handleLineChange}
            onDelete={handleLineDelete}
            onAddLine={handleAddLine}
          />
        </div>

        {/* Totals + Notes — 1/4 width */}
        <div className="space-y-4">

          {/* Quote Summary */}
          <QuoteTotals
            totals={totals}
            vatRate={VAT_RATE}
            excessAmount={0}
          />

          {/* Notes */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-gray-700 text-sm
                           uppercase tracking-wider">
              Notes
            </h3>
            <div>
              <label className="label">Internal Notes</label>
              <textarea
                className="input-field resize-none text-sm"
                rows={2}
                value={internalNotes}
                onChange={e => setInternalNotes(e.target.value)}
                placeholder="Internal notes..."
              />
            </div>
            <div>
              <label className="label">Insurer Notes</label>
              <textarea
                className="input-field resize-none text-sm"
                rows={2}
                value={insurerNotes}
                onChange={e => setInsurerNotes(e.target.value)}
                placeholder="Notes visible to insurer..."
              />
            </div>
            <div>
              <label className="label">Version Notes</label>
              <textarea
                className="input-field resize-none text-sm"
                rows={2}
                value={versionNotes}
                onChange={e => setVersionNotes(e.target.value)}
                placeholder="What changed in this version..."
              />
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}