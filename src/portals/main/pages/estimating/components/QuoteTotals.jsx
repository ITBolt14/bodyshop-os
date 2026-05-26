// =============================================
// BODYSHOP OS - Quote Totals Panel
// =============================================

const fmt = (v) =>
  `R ${Number(v || 0).toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`

export function QuoteTotals({ totals, vatRate = 15, excessAmount = 0 }) {

  const {
    subtotal_labour             = 0,
    subtotal_strip              = 0,
    subtotal_paint              = 0,
    subtotal_parts              = 0,
    subtotal_sublet             = 0,
    subtotal_other              = 0,
    subtotal_excl_vat           = 0,
    vat_amount                  = 0,
    total_incl_vat              = 0,
    approved_total              = 0,
    pending_total               = 0,
  } = totals

  const net_insurer = Math.max(0, total_incl_vat - Number(excessAmount))

  // SECTION: Row Helper
  const row = (label, value, bold = false, color = '') => (
    <div className={`flex justify-between py-1.5
                     ${bold ? 'border-t border-gray-200 mt-1 pt-2' : ''}`}>
      <span className={`text-sm ${bold ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
        {label}
      </span>
      <span className={`text-sm font-semibold tabular-nums
                        ${bold ? 'text-gray-900' : ''}
                        ${color}`}>
        {fmt(value)}
      </span>
    </div>
  )

  // SECTION: Render
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-700 mb-3 text-sm
                     uppercase tracking-wider">
        Quote Summary
      </h3>

      {/* Category Subtotals */}
      <div className="space-y-0.5 mb-2">
        {subtotal_labour > 0 &&
          row('Labour',             subtotal_labour)}
        {subtotal_strip > 0 &&
          row('Strip & Assemble',   subtotal_strip)}
        {subtotal_paint > 0 &&
          row('Paint',              subtotal_paint)}
        {subtotal_parts > 0 &&
          row('Parts',              subtotal_parts)}
        {subtotal_sublet > 0 &&
          row('Sublet',             subtotal_sublet)}
        {subtotal_other > 0 &&
          row('Other',              subtotal_other)}
      </div>

      {/* Totals */}
      <div className="border-t border-gray-100 pt-2 space-y-0.5">
        {row('Subtotal (excl. VAT)',    subtotal_excl_vat)}
        {row(`VAT (${vatRate}%)`,        vat_amount)}
        {row('Total (incl. VAT)',       total_incl_vat, true)}
      </div>

      {/* Excess & Net */}
      {Number(excessAmount) > 0 && (
        <div className="border-t border-gray-100 mt-2 pt-2 space-y-0.5">
          {row('Less: Excess',          excessAmount,   false,  'text-red-500')}
          {row('Net to Insurer',        net_insurer,    true,   'text-brand-700')}
        </div>
      )}

      {/* Approved vs Pending */}
      {(approved_total > 0 || pending_total > 0) & (
        <div className="border-t border-gray-100 mt-2 pt-2 space-y-0.5">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
            Approval Status
          </p>
          {row('Approved Amount',       approved_total, false,  'text-green-600')}
          {row('Pending Amount',        pending_total,  false,  'text-amber-500')}
          <div className="flex justify-between py-1.5">
            <span className="text-xs text-gray-400">Difference</span>
            <span className={`text-xs font-semibold tabular-nums
                              ${total_incl_vat - approved_total > 0
                                ? 'text-red-500'
                                : 'text-green-600'
                              }`}>
              {fmt(total_incl_vat - approved_total)}
            </span>
          </div>
        </div>
      )}
      
    </div>
  )
}