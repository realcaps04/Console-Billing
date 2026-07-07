import { forwardRef } from 'react'
import { fmt, fmtDate, computeTotalsWithDiscount } from '../utils'

const STATUS_LABELS = {
  unpaid: 'Unpaid',
  paid: 'Paid',
  overdue: 'Overdue',
  draft: 'Draft',
}



const InvoicePreview = forwardRef(function InvoicePreview({ state, onDownload, downloading }, ref) {
  const isInitialEmpty = state.items.length === 1 && !state.items[0].desc && state.items[0].qty === 1 && !state.items[0].rate;
  const displayItems = isInitialEmpty ? [
    { id: 'p1', desc: 'Web Development Service', qty: 1, rate: 50000, isPlaceholder: true },
    { id: 'p2', desc: 'UI/UX Design Package', qty: 2, rate: 15000, isPlaceholder: true },
  ] : state.items;

  const { subtotal, discount, total } = computeTotalsWithDiscount(displayItems, state.discountType, state.discountValue)
  const cur = state.currency || '₹'
  const paid = Number(state.amountPaid) || 0
  const balanceDue = Math.max(0, total - paid)

  const fromLines = [state.fromCompany, state.fromAddress, state.fromEmail, state.fromPhone].filter(Boolean)
  const notesLines = (state.notes || '').split('\n').map(s => s.trim()).filter(Boolean)
  const clientName = state.toCompany || '—'
  const clientOtherLines = [state.toPhone, state.toAddress, state.toEmail].filter(Boolean)

  return (
    <section className="preview-panel">
      {/* Topbar */}
      <div className="preview-topbar">
        <div className="preview-title">
          <span className="live-dot" />
          Live Preview
        </div>
        <button className="btn-download-main" style={{ width: 'auto', padding: '0.6rem 1.2rem', fontSize: '0.82rem' }} onClick={onDownload} disabled={downloading}>
          {downloading ? '⏳ Generating…' : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download PDF
            </>
          )}
        </button>
      </div>

      {/* Invoice card */}
      <div className="preview-body">
        <div className="invoice-card" ref={ref}>
          <div className="inv2">
            {/* Brand header */}
            <div className="inv2-brand">
              <div className="inv2-brand-logo" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2.4l7.8 4.5v10.2L12 21.6 4.2 17.1V6.9L12 2.4z" fill="#0f172a" opacity="0.12" />
                  <path d="M12 3.9l6.5 3.75v8.7L12 20.1l-6.5-3.75v-8.7L12 3.9z" fill="#0f172a" opacity="0.25" />
                  <path d="M12 6.2l4.5 2.6v6.4L12 17.8 7.5 15.2V8.8L12 6.2z" fill="#0f172a" />
                </svg>
              </div>
              <div className="inv2-brand-name">{state.fromCompany || 'Console Projects'}</div>
            </div>
            <div className="inv2-brand-sub">
              {(state.fromEmail || 'billing@consoleprojects.io')}{state.fromPhone ? ` / ${state.fromPhone}` : ''}
            </div>

            {/* Blue hero */}
            <div className="inv2-hero">
              <div className="inv2-hero-left">
                <div className="inv2-hero-label">INVOICE TO:</div>
                <div className="inv2-hero-name">{clientName}</div>
                <div className="inv2-hero-lines">
                  {clientOtherLines.length > 0
                    ? clientOtherLines.map((l, i) => <div key={i}>{l}</div>)
                    : <div style={{ opacity: 0.75 }}>—</div>}
                </div>
              </div>

              <div className="inv2-hero-right">
                <div className="inv2-due-card">
                  <div className="inv2-due-label">AMOUNT DUE</div>
                <div className="inv2-due-amount">{fmt(balanceDue, cur)}</div>
                  <div className="inv2-due-date">{fmtDate(state.dueDate)}</div>
                </div>
              </div>
            </div>

            {/* Meta strip */}
            <div className="inv2-meta">
              <div className="inv2-meta-cell">
                <div className="inv2-meta-label">INVOICE NUMBER:</div>
                <div className="inv2-meta-value">No: {state.invoiceNumber || 'INV-001'}</div>
              </div>
              <div className="inv2-meta-cell">
                <div className="inv2-meta-label">ISSUED:</div>
                <div className="inv2-meta-value">{fmtDate(state.issueDate)}</div>
              </div>
              <div className="inv2-meta-cell">
                <div className="inv2-meta-label">DUE DATE:</div>
                <div className="inv2-meta-value">{fmtDate(state.dueDate)}</div>
              </div>
            </div>

            {/* Items table */}
            <table className="inv2-table">
              <colgroup>
                <col style={{ width: '58%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '16%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="inv2-th-desc">DESCRIPTION</th>
                  <th className="inv2-th-num">QTY</th>
                  <th className="inv2-th-num">PRICE</th>
                  <th className="inv2-th-num">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item) => {
                  const qty = Number(item.qty) || 0
                  const rate = Number(item.rate) || 0
                  const amount = qty * rate
                  return (
                    <tr key={item.id} className={item.isPlaceholder ? 'inv2-row-placeholder' : ''}>
                      <td className="inv2-td-desc">{item.desc || '—'}</td>
                      <td className="inv2-td-num">{qty || '—'}</td>
                      <td className="inv2-td-num">{fmt(rate, cur)}</td>
                      <td className="inv2-td-num inv2-td-total">{fmt(amount, cur)}</td>
                    </tr>
                  )
                })}

                {/* Summary rows (inside same bordered table) */}
                <tr className="inv2-sum-row">
                  <td className="inv2-sum-label" colSpan={3}>Subtotal</td>
                  <td className="inv2-td-num inv2-sum-value">{fmt(subtotal, cur)}</td>
                </tr>
                <tr className="inv2-sum-row">
                  <td className="inv2-sum-label" colSpan={3}>Discount</td>
                  <td className="inv2-td-num inv2-sum-value">{fmt(discount, cur)}</td>
                </tr>
                <tr className="inv2-sum-row">
                  <td className="inv2-sum-label" colSpan={3}>Paid</td>
                  <td className="inv2-td-num inv2-sum-value">{fmt(paid, cur)}</td>
                </tr>
                <tr className="inv2-grand-row">
                  <td className="inv2-grand-label" colSpan={3}>Total amount:</td>
                  <td className="inv2-td-num inv2-grand-value">{fmt(balanceDue, cur)}</td>
                </tr>
              </tbody>
            </table>
            {/* (Total moved into table for proper borders) */}

            {/* Footer */}
            <table className="inv2-footer-table">
              <tbody>
                <tr>
                  <td>
                    <div className="inv2-footer-company">{state.fromCompany || 'Console Projects'}</div>
                    <div className="inv2-footer-lines">
                      {fromLines.filter(l => l !== state.fromCompany).map((l, i) => <div key={i}>{l}</div>)}
                    </div>
                  </td>
                  <td>
                    <div className="inv2-footer-company">Bank Details</div>
                    <div className="inv2-footer-lines">
                      {notesLines.length > 0
                        ? notesLines.map((l, i) => <div key={i}>{l}</div>)
                        : <div>—</div>}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* tiny status (kept, but understated) */}
            <div className="inv2-status">
              <span className={`status-badge status-${state.status}`}>
                {STATUS_LABELS[state.status] || 'Unpaid'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
})

export default InvoicePreview
