// =============================================
// BODYSHOP OS - Quote Lines Table
// =============================================

import { Plus } from 'lucide-react'
import { LineRow } from './LineRow'

// SECTION: Empty Line factory
export const emptyLine = () => ({
  _key:                     crypto.randomUUID(),
  operation_id:             null,
  operation_name:           '',
  description:              '',
  quantity:                 1,
  input_labour:             0,
  input_strip_assemble:     0,
  input_paint:              0,
  input_parts:              0,
  input_sublet:             0,
  input_other:              0,
  total_labour:             0,
  total_strip_assemble:     0,
  total_paint:              0,
  total_parts:              0,
  total_sublet:             0,
  total_other:              0,
  line_total:               0,
  approved:                 null,
  notes:                    null,
})

const MODE_LABELS = {
  money:    { labour: 'R Labour',   strip: 'R Strip & Ass.',    paint: 'R paint'    },
  time:     { labour: 'Hrs Labour', strip: 'Hrs Strip & Ass.',  paint: 'Hrs Paint'  },
  units:    { labour: 'U Labour',   strip: 'U Strip & Ass.',    paint: 'U Paint'    },
}

export function QuoteLines({ lines, operations, mode, rates, onChange, onDelete, onAddLine }) {
  
  const labels = MODE_LABELS[mode] ?? MODE_LABELS.money
  
  return (
    <div className="card p-0 overflow-hidden">

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-3 py-2.5 text-xs font-semibold
                             text-gray-500 uppercase tracking-wider min-w-[160px]">
                Operation
              </th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold
                             text-gray-500 uppercase tracking-wider min-w-[160px]">
                Description
              </th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold
                             text-gray-500 uppercase tracking-wider w-20">
                Qty
              </th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold
                             text-gray-500 uppercase tracking-wider w-28">
                {labels.labour}
              </th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold
                             text-gray-500 uppercase tracking-wider w-28">
                {labels.strip}
              </th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold
                             text-gray-500 uppercase tracking-wider w-28">
                {labels.paint}
              </th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold
                             text-gray-500 uppercase tracking-wider w-28">
                R Parts
              </th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold
                             text-gray-500 uppercase tracking-wider w-28">
                R Sublet
              </th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold
                             text-gray-500 uppercase tracking-wider w-28">
                R Other
              </th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold
                             text-gray-500 uppercase tracking-wider w-32">
                Line Total
              </th>
              <th className="w-10" />
            </tr>
          </thead>

          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-12 text-gray-400">
                  <p className="text-sm">No lines yet - click Add Line to start</p>
                </td>
              </tr>
            ) : (
              lines.map((line, index) => (
                <LineRow
                  key={line._key ?? line.id}
                  line={line}
                  operations={operations}
                  mode={mode}
                  rates={rates}
                  onChange={onChange}
                  onDelete={onDelete}
                  index={index}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Line Button */}
      <div className="border-t border-gray-100 px-4 py-3">
        <button
          onClick={onAddLine}
          className="flex items-center gap-2 text-sm text-brand-600
                     hover:text-brand-700 font-medium transition-colors"
        >
          <Plus size={15} /> Add Line
        </button>
      </div>
      
    </div>
  )
}