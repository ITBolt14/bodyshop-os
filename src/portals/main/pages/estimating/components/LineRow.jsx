// =============================================
// BODYSHOP OS — Quote Line Row
// =============================================

import { Trash2, ChevronDown } from 'lucide-react'

// SECTION: Input label per mode
const modeLabels = (mode) => ({
  money: { labour: 'R Labour',   strip: 'R Strip',   paint: 'R Paint'   },
  time:  { labour: 'Hrs Labour', strip: 'Hrs Strip', paint: 'Hrs Paint' },
  units: { labour: 'U Labour',   strip: 'U Strip',   paint: 'U Paint'   },
})[mode] ?? { labour: 'Labour', strip: 'Strip', paint: 'Paint' }

// SECTION: Number input — clean, no spinner arrows
function NumInput({ value, onChange, placeholder = '0' }) {
  return (
    <input
      type="number"
      className="w-full border border-gray-300 rounded-lg px-2 py-2
                 text-right text-sm focus:outline-none focus:ring-2
                 focus:ring-brand-500 focus:border-transparent
                 bg-white text-gray-800"
      value={value === 0 ? '' : value}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      placeholder={placeholder}
      min="0"
      step="any"
    />
  )
}

// SECTION: Format currency
const fmt = (v) => v > 0
  ? `R ${Number(v).toLocaleString('en-ZA', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    })}`
  : null

export function LineRow({
  line,
  operations,
  mode,
  rates,
  onChange,
  onDelete,
  index,
}) {

  // SECTION: Calculate totals when inputs change
  const calcTotals = (updated) => {
    const {
      labour_rate, strip_rate,
      paint_rate, paint_material_rate, unit_value
    } = rates

    let tLabour = 0
    let tStrip  = 0
    let tPaint  = 0

    if (mode === 'money') {
      tLabour = updated.input_labour         || 0
      tStrip  = updated.input_strip_assemble || 0
      tPaint  = updated.input_paint          || 0
    } else if (mode === 'time') {
      tLabour = (updated.input_labour         || 0) * (labour_rate || 0)
      tStrip  = (updated.input_strip_assemble || 0) * (strip_rate  || 0)
      tPaint  = (updated.input_paint          || 0) *
                ((paint_rate || 0) + (paint_material_rate || 0))
    } else if (mode === 'units') {
      const uv = unit_value || 0.1
      tLabour = (updated.input_labour         || 0) * uv * (labour_rate || 0)
      tStrip  = (updated.input_strip_assemble || 0) * uv * (strip_rate  || 0)
      tPaint  = (updated.input_paint          || 0) * uv *
                ((paint_rate || 0) + (paint_material_rate || 0))
    }

    const qty       = updated.quantity || 1
    const tParts    = updated.input_parts   || 0
    const tSublet   = updated.input_sublet  || 0
    const tOther    = updated.input_other   || 0
    const lineTotal = (tLabour + tStrip + tPaint + tParts + tSublet + tOther) * qty

    return {
      ...updated,
      total_labour:         tLabour,
      total_strip_assemble: tStrip,
      total_paint:          tPaint,
      total_parts:          tParts,
      total_sublet:         tSublet,
      total_other:          tOther,
      line_total:           lineTotal,
    }
  }

  const update = (name, value) => {
    const updated = { ...line, [name]: value }
    onChange(index, calcTotals(updated))
  }

  // SECTION: Render
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50 group align-top">

      {/* Operation */}
      <td className="px-2 py-2 min-w-[170px]">
        <div className="relative">
          <select
            className="w-full border border-gray-300 rounded-lg px-2 py-2
                       text-sm bg-white text-gray-800 appearance-none
                       focus:outline-none focus:ring-2 focus:ring-brand-500
                       focus:border-transparent pr-6"
            value={line.operation_id ?? ''}
            onChange={e => {
              const selectedId = e.target.value
              const op = operations.find(o => o.id === selectedId)
              const next = {
                ...line,
                operation_id:   selectedId || null,
                operation_name: op?.name   ?? '',
              }
              onChange(index, calcTotals(next))
            }}
          >
            <option value="">Select operation...</option>
            {['labour','strip_assemble','paint','parts','sublet','other'].map(cat => (
              <optgroup
                key={cat}
                label={cat.replace(/_/g, ' ')
                  .replace(/\b\w/g, l => l.toUpperCase())}
              >
                {operations
                  .filter(o => o.category === cat && o.active)
                  .map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="absolute right-2 top-1/2 -translate-y-1/2
                       text-gray-400 pointer-events-none"
          />
        </div>
      </td>

      {/* Description */}
      <td className="px-2 py-2 min-w-[160px]">
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-2 py-2
                     text-sm focus:outline-none focus:ring-2
                     focus:ring-brand-500 focus:border-transparent bg-white"
          value={line.description}
          onChange={e => update('description', e.target.value)}
          placeholder="e.g. L/F Fender"
        />
      </td>

      {/* Quantity */}
      <td className="px-2 py-2 w-16">
        <NumInput
          value={line.quantity}
          onChange={v => update('quantity', v)}
          placeholder="1"
        />
      </td>

      {/* Labour */}
      <td className="px-2 py-2 w-24">
        <NumInput
          value={line.input_labour}
          onChange={v => update('input_labour', v)}
        />
        {mode !== 'money' && line.total_labour > 0 && (
          <p className="text-[10px] text-brand-600 text-right mt-0.5 font-medium">
            {fmt(line.total_labour)}
          </p>
        )}
      </td>

      {/* Strip & Assemble */}
      <td className="px-2 py-2 w-24">
        <NumInput
          value={line.input_strip_assemble}
          onChange={v => update('input_strip_assemble', v)}
        />
        {mode !== 'money' && line.total_strip_assemble > 0 && (
          <p className="text-[10px] text-brand-600 text-right mt-0.5 font-medium">
            {fmt(line.total_strip_assemble)}
          </p>
        )}
      </td>

      {/* Paint */}
      <td className="px-2 py-2 w-24">
        <NumInput
          value={line.input_paint}
          onChange={v => update('input_paint', v)}
        />
        {mode !== 'money' && line.total_paint > 0 && (
          <p className="text-[10px] text-brand-600 text-right mt-0.5 font-medium">
            {fmt(line.total_paint)}
          </p>
        )}
      </td>

      {/* Parts */}
      <td className="px-2 py-2 w-24">
        <NumInput
          value={line.input_parts}
          onChange={v => update('input_parts', v)}
        />
      </td>

      {/* Sublet */}
      <td className="px-2 py-2 w-24">
        <NumInput
          value={line.input_sublet}
          onChange={v => update('input_sublet', v)}
        />
      </td>

      {/* Other */}
      <td className="px-2 py-2 w-24">
        <NumInput
          value={line.input_other}
          onChange={v => update('input_other', v)}
        />
      </td>

      {/* Line Total */}
      <td className="px-2 py-2 w-28 text-right align-middle">
        <span className="text-sm font-bold text-gray-800 tabular-nums">
          {fmt(line.line_total) ?? 'R 0,00'}
        </span>
      </td>

      {/* Delete */}
      <td className="px-2 py-2 w-8 align-middle">
        <button
          onClick={() => onDelete(index)}
          className="p-1 rounded text-gray-300 hover:text-red-500
                     hover:bg-red-50 transition-colors opacity-0
                     group-hover:opacity-100"
          title="Remove line"
        >
          <Trash2 size={14} />
        </button>
      </td>

    </tr>
  )
}