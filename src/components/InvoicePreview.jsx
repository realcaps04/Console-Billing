import { forwardRef } from 'react'
import { fmt, fmtDate, computeTotals } from '../utils'

const STATUS_LABELS = {
  unpaid: 'Unpaid',
  paid: 'Paid',
  overdue: 'Overdue',
  draft: 'Draft',
}

const WaveTop = () => (
  <div className="inv-wave-top">
    <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
      <path fill="rgba(59, 130, 246, 0.08)" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,165.3C960,149,1056,171,1152,186.7C1248,203,1344,213,1392,218.7L1440,224L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
      <path fill="url(#wave-gradient)" d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,96C672,96,768,128,864,133.3C960,139,1056,117,1152,106.7C1248,96,1344,96,1392,96L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
      <defs>
        <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
        </linearGradient>
      </defs>
    </svg>
  </div>
)

const WaveBottom = () => (
  <div className="inv-wave-bottom">
    <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
      <path fill="url(#wave-bottom-gradient)" d="M0,224L60,213.3C120,203,240,181,360,181.3C480,181,600,203,720,213.3C840,224,960,224,1080,213.3C1200,203,1320,181,1380,170.7L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
      <defs>
        <linearGradient id="wave-bottom-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  </div>
)

const InvoicePreview = forwardRef(function InvoicePreview({ state, onDownload, downloading }, ref) {
  const { subtotal, total } = computeTotals(state.items)
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
          <WaveTop />
          <WaveBottom />

          {/* Header */}
          <div className="inv-header">
            <div>
              <div className="inv-company-name">{state.fromCompany || 'Console Projects'}</div>
              <div className="inv-tagline">Precision Engineered Solutions</div>
            </div>
            <div className="inv-title-block">
              <div className="inv-title-text">Invoice</div>
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
              <div className="dlabel">Issue Date</div>
              <div className="dvalue">{fmtDate(state.issueDate)}</div>
            </div>
            <div className="inv-date-card">
              <div className="dlabel">Due Date</div>
              <div className="dvalue">{fmtDate(state.dueDate)}</div>
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
              {state.items.map((item, idx) => {
                const amount = (Number(item.qty) || 0) * (Number(item.rate) || 0)
                return (
                  <tr key={item.id}>
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

          {/* Footer */}
          <div className="inv-footer">
            {state.notes && (
              <>
                <div className="inv-notes-label">Notes & Payment Terms</div>
                <div className="inv-notes-text">
                  {state.notes.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}
                </div>
              </>
            )}
            <div className="inv-thank-you">✦ Thank you for your business ✦</div>
          </div>
        </div>
      </div>
    </section>
  )
})

export default InvoicePreview
