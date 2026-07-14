import { computeTotalsWithDiscount, sanitizeInvoiceNumber } from '../utils'

function SectionLabel({ children }) {
  return <div className="section-label">{children}</div>
}

function FormGroup({ label, children, full }) {
  return (
    <div className={`form-group${full ? ' full' : ''}`}>
      <label>{label}</label>
      {children}
    </div>
  )
}

function addDays(dateStr, days) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function LineItem({ item, onUpdate, onRemove }) {
  const amount = (Number(item.qty) || 0) * (Number(item.rate) || 0)
  return (
    <div className="item-row">
      <input
        type="text"
        value={item.desc}
        placeholder="e.g. Web Development Service"
        onChange={e => onUpdate(item.id, 'desc', e.target.value)}
      />
      <input
        type="number"
        value={item.qty}
        min="1"
        onChange={e => onUpdate(item.id, 'qty', e.target.value)}
      />
      <input
        type="number"
        value={item.rate}
        min="0"
        onChange={e => onUpdate(item.id, 'rate', e.target.value)}
      />
      <div className="amount-display">{Number(amount).toLocaleString('en-IN')}</div>
      <button className="btn-remove" onClick={() => onRemove(item.id)} title="Remove item">×</button>
    </div>
  )
}

export default function FormPanel({ state, update, updateItem, addItem, removeItem, downloading, onDownload }) {
  const { subtotal, discount, total } = computeTotalsWithDiscount(state.items, state.discountType, state.discountValue)
  const paid = Number(state.amountPaid) || 0
  const balance = Math.max(0, total - paid)

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-icon">CP</div>
          <div className="brand-text">
            <div className="brand-name">Console Projects</div>
            <div className="brand-sub">Invoice Generator v1.0</div>
          </div>
        </div>
      </div>

      <div className="sidebar-body">
        {/* Invoice Details */}
        <div className="form-section">
          <SectionLabel>Invoice Details</SectionLabel>
          <div className="form-grid">
            <FormGroup label="Invoice Number">
              <input
                type="text"
                value={state.invoiceNumber}
                onChange={e => update('invoiceNumber', sanitizeInvoiceNumber(e.target.value))}
                placeholder="INV-001"
              />
            </FormGroup>
            <FormGroup label="Status">
              <select value={state.status} onChange={e => update('status', e.target.value)}>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="draft">Draft</option>
              </select>
            </FormGroup>
            <FormGroup label="Issue Date">
              <input
                type="date"
                value={state.issueDate}
                onChange={e => {
                  const nextIssue = e.target.value
                  update('issueDate', nextIssue)
                  update('dueDate', addDays(nextIssue, 7))
                }}
              />
            </FormGroup>
            <FormGroup label="Due Date">
              <input type="date" value={state.dueDate} onChange={e => update('dueDate', e.target.value)} />
            </FormGroup>
          </div>
        </div>

        {/* From */}
        <div className="form-section">
          <SectionLabel>From (Your Company)</SectionLabel>
          <div className="form-grid">
            <FormGroup label="Company Name" full>
              <input type="text" value={state.fromCompany} onChange={e => update('fromCompany', e.target.value)} />
            </FormGroup>
            <FormGroup label="Address" full>
              <textarea rows={2} value={state.fromAddress} onChange={e => update('fromAddress', e.target.value)} />
            </FormGroup>
            <FormGroup label="Email">
              <input type="email" value={state.fromEmail} onChange={e => update('fromEmail', e.target.value)} />
            </FormGroup>
            <FormGroup label="Phone">
              <input type="tel" value={state.fromPhone} onChange={e => update('fromPhone', e.target.value)} />
            </FormGroup>
          </div>
        </div>

        {/* Bill To */}
        <div className="form-section">
          <SectionLabel>Bill To (Client)</SectionLabel>
          <div className="form-grid">
            <FormGroup label="Client / Company Name" full>
              <input type="text" value={state.toCompany} placeholder="Client Company Ltd." onChange={e => update('toCompany', e.target.value)} />
            </FormGroup>
            <FormGroup label="Address" full>
              <textarea rows={2} value={state.toAddress} placeholder="Client address..." onChange={e => update('toAddress', e.target.value)} />
            </FormGroup>
            <FormGroup label="Email">
              <input type="email" value={state.toEmail} placeholder="client@email.com" onChange={e => update('toEmail', e.target.value)} />
            </FormGroup>
            <FormGroup label="Phone">
              <input type="tel" value={state.toPhone} placeholder="+91 00000 00000" onChange={e => update('toPhone', e.target.value)} />
            </FormGroup>
          </div>
        </div>

        {/* Line Items */}
        <div className="form-section">
          <SectionLabel>Line Items</SectionLabel>
          <div className="items-header">
            <span>Description</span>
            <span>Qty</span>
            <span>Rate (₹)</span>
            <span>Amt</span>
            <span></span>
          </div>
          {state.items.map(item => (
            <LineItem key={item.id} item={item} onUpdate={updateItem} onRemove={removeItem} />
          ))}
          <button className="btn-add-item" onClick={addItem}>
            ＋ Add Line Item
          </button>
        </div>

        {/* Settings & Notes */}
        <div className="form-section">
          <SectionLabel>Settings & Notes</SectionLabel>
          <div className="form-grid">
            <FormGroup label="Currency Symbol">
              <input type="text" value={state.currency} onChange={e => update('currency', e.target.value)} />
            </FormGroup>
            <FormGroup label="Already Paid Amount">
              <input
                type="number"
                min="0"
                value={state.amountPaid}
                onChange={e => update('amountPaid', e.target.value)}
              />
            </FormGroup>
            <FormGroup label="Discount Type">
              <select value={state.discountType} onChange={e => update('discountType', e.target.value)}>
                <option value="amount">Amount</option>
                <option value="percent">Percent (%)</option>
              </select>
            </FormGroup>
            <FormGroup label="Discount Value">
              <input
                type="number"
                min="0"
                value={state.discountValue}
                onChange={e => update('discountValue', e.target.value)}
              />
            </FormGroup>
            <FormGroup label="Payment Mode">
              <input
                type="text"
                value={state.paymentMode}
                onChange={e => update('paymentMode', e.target.value)}
                placeholder="Bank Transfer"
              />
            </FormGroup>
            <FormGroup label="UPI ID" full>
              <input
                type="text"
                value={state.upiId}
                onChange={e => update('upiId', e.target.value.trim().toLowerCase())}
                placeholder="name@bank"
              />
            </FormGroup>
            <FormGroup label="UPI Payee Name" full>
              <input
                type="text"
                value={state.upiPayeeName}
                onChange={e => update('upiPayeeName', e.target.value)}
                placeholder="Name registered with UPI/bank"
              />
            </FormGroup>
            <FormGroup label="Bank Details" full>
              <textarea rows={4} value={state.bankDetails} placeholder="Account name, number, IFSC..." onChange={e => update('bankDetails', e.target.value)} />
            </FormGroup>
            <FormGroup label="Notes" full>
              <textarea rows={2} value={state.extraNotes} placeholder="Thank you for your business." onChange={e => update('extraNotes', e.target.value)} />
            </FormGroup>
            <FormGroup label="Terms & Conditions" full>
              <textarea rows={3} value={state.terms} placeholder="Payment terms..." onChange={e => update('terms', e.target.value)} />
            </FormGroup>
          </div>
        </div>

        {/* Quick totals summary */}
        <div style={{
          background: 'var(--surface3)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '1rem',
          marginBottom: '1rem',
          fontSize: '0.8rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text2)', marginBottom: '0.4rem' }}>
            <span>Subtotal</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{state.currency} {subtotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text2)', marginBottom: '0.4rem' }}>
            <span>Discount</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{state.currency} {discount.toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text)', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', fontWeight: 700 }}>
            <span>Total</span>
            <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--success)' }}>{state.currency} {total.toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text2)', marginTop: '0.5rem' }}>
            <span>Paid</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{state.currency} {paid.toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text)', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem', fontWeight: 800 }}>
            <span>Balance Due</span>
            <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--gold)' }}>{state.currency} {balance.toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
          </div>
        </div>
      </div>

      {/* Download CTA */}
      <div className="sidebar-footer">
        <button className="btn-download-main" onClick={onDownload} disabled={downloading}>
          {downloading ? (
            <>⏳ Generating PDF…</>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download Invoice PDF
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
