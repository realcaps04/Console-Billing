import { forwardRef } from 'react'
import { fmt, fmtDate, computeTotals } from '../utils'

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

  const { subtotal, total } = computeTotals(displayItems)
  const cur = state.currency || '₹'

  const fromLines = [state.fromCompany, state.fromAddress, state.fromEmail, state.fromPhone].filter(Boolean)
  const toLines = [state.toCompany, state.toAddress, state.toEmail, state.toPhone].filter(Boolean)

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
          {/* Accent header bar */}
          <div className="inv-accent-bar">
            <div className="inv-accent-logo">CP</div>
            <div className="inv-accent-tagline">Console Projects</div>
          </div>

          {/* Header */}
          <div className="inv-header">
            <div>
              <div className="inv-company-name">{state.fromCompany || 'Console Projects'}</div>
              <div className="inv-tagline">Precision Engineered Solutions</div>
            </div>
            <div className="inv-title-block">
              <div className="inv-title-text">INVOICE</div>
              <div className="inv-number-text"># {state.invoiceNumber || 'INV-001'}</div>
              <div>
                <span className={`status-badge status-${state.status}`}>
                  {STATUS_LABELS[state.status] || 'Unpaid'}
                </span>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="inv-meta-grid">
            <div className="inv-meta-block">
              <h4>From</h4>
              <p>{fromLines.join('\n').split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}</p>
            </div>
            <div className="inv-meta-block">
              <h4>Bill To</h4>
              <p>
                {toLines.length > 0
                  ? toLines.join('\n').split('\n').map((l, i) => <span key={i}>{l}<br /></span>)
                  : <span style={{ color: '#94a3b8' }}>—</span>}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="inv-dates-grid">
            <div className="inv-date-card">
              <div className="inv-date-card-label">Issue Date</div>
              <div className="inv-date-card-value">{fmtDate(state.issueDate)}</div>
            </div>
            <div className="inv-date-card">
              <div className="inv-date-card-label">Due Date</div>
              <div className="inv-date-card-value">{fmtDate(state.dueDate)}</div>
            </div>
          </div>

          {/* Table */}
          <table className="inv-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((item, idx) => {
                const amount = (Number(item.qty) || 0) * (Number(item.rate) || 0)
                return (
                  <tr key={item.id} style={item.isPlaceholder ? { opacity: 0.4, fontStyle: 'italic' } : {}}>
                    <td>{idx + 1}</td>
                    <td>{item.desc || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                    <td>{item.qty}</td>
                    <td>{fmt(item.rate, cur)}</td>
                    <td>{fmt(amount, cur)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div className="inv-totals">
            <div className="totals-box">
              <div className="total-row-item">
                <span className="tlabel">Subtotal</span>
                <span className="tvalue">{fmt(subtotal, cur)}</span>
              </div>

              <div className="total-row-item total-row-grand">
                <span className="tlabel">Total Due</span>
                <span className="tvalue">{fmt(total, cur)}</span>
              </div>
            </div>
          </div>

          {/* Notes footer */}
          {state.notes && (
            <div className="inv-footer">
              <div className="inv-notes-label">Notes &amp; Payment Terms</div>
              <div className="inv-notes-text">
                {state.notes.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}
              </div>
            </div>
          )}

          {/* Dark thank-you band - flush bottom */}
          <div className="inv-thank-you">✦ Thank you for your business ✦</div>
        </div>
      </div>
    </section>
  )
})

export default InvoicePreview
