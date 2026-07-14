import { forwardRef, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { fmt, fmtDateShort, computeTotalsWithDiscount, amountInWords, buildUpiPaymentUri, generateInvoiceNumber } from '../utils'

const STATUS_LABELS = {
  unpaid: 'Unpaid',
  paid: 'Paid',
  overdue: 'Overdue',
  draft: 'Draft',
}

const InvoicePreview = forwardRef(function InvoicePreview({ state, onDownload, downloading }, ref) {
  const displayItems = state.items

  const { subtotal, discount, total } = computeTotalsWithDiscount(displayItems, state.discountType, state.discountValue)
  const cur = state.currency || '₹'
  const paid = Number(state.amountPaid) || 0
  const balanceDue = Math.max(0, total - paid)

  const fromAddressLines = (state.fromAddress || '').split('\n').filter(Boolean)
  const bankLines = (state.bankDetails || '').split('\n').map(s => s.trim()).filter(Boolean)
  const termsLines = (state.terms || '').split('\n').map(s => s.trim()).filter(Boolean)
  const noteLines = (state.extraNotes || '').split('\n').map(s => s.trim()).filter(Boolean)

  const totalQty = displayItems.reduce((acc, it) => acc + (Number(it.qty) || 0), 0)
  const invoiceNo = state.invoiceNumber || generateInvoiceNumber(state.issueDate)
  const upiId = (state.upiId || 'shigybiju9562-1@oksbi').trim().toLowerCase()
  const upiPayeeName = state.upiPayeeName || 'Shyji Biju'
  const [upiQrDataUrl, setUpiQrDataUrl] = useState('/upi-qr-static.png')

  useEffect(() => {
    let cancelled = false
    const uri = buildUpiPaymentUri({
      vpa: upiId,
      payeeName: upiPayeeName,
      amount: balanceDue,
      note: `Invoice ${invoiceNo}`,
      txnRef: invoiceNo,
    })

    if (!uri) {
      setUpiQrDataUrl('/upi-qr-static.png')
      return undefined
    }

    QRCode.toDataURL(uri, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (!cancelled) setUpiQrDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setUpiQrDataUrl('/upi-qr-static.png')
      })

    return () => { cancelled = true }
  }, [upiId, upiPayeeName, balanceDue, invoiceNo])

  return (
    <section className="preview-panel">
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

      <div className="preview-body">
        <div className="invoice-card" ref={ref}>
          <div className="inv3">
            <div className="inv3-title">INVOICE</div>

            <table className="inv3-block">
              <tbody>
                <tr>
                  <td className="inv3-business">
                    <div className="inv3-business-head">
                      <div className="inv3-logo" aria-hidden="true">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                          <path d="M4 7h16v12H4z" stroke="#1d4ed8" strokeWidth="1.5"/>
                          <path d="M8 7V5.5A1.5 1.5 0 019.5 4h5A1.5 1.5 0 0116 5.5V7" stroke="#1d4ed8" strokeWidth="1.5"/>
                          <path d="M9 11h6M9 14h6" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div>
                        <div className="inv3-company">{state.fromCompany || 'Console Projects'}</div>
                        <div className="inv3-service-tag">Non-GST Service Invoice</div>
                      </div>
                    </div>
                    {fromAddressLines.map((line, i) => <div key={i} className="inv3-line">{line}</div>)}
                    <div className="inv3-line">Email: {state.fromEmail || '—'}</div>
                  </td>
                  <td className="inv3-meta">
                    <table className="inv3-meta-table">
                      <tbody>
                        <tr><td>Invoice #</td><td>{invoiceNo}</td></tr>
                        <tr><td>Invoice Date</td><td>{fmtDateShort(state.issueDate)}</td></tr>
                        <tr><td>Due Date</td><td>{fmtDateShort(state.dueDate)}</td></tr>
                        <tr><td>Payment Mode</td><td>{state.paymentMode || 'Bank Transfer'}</td></tr>
                        <tr><td>Status</td><td>{STATUS_LABELS[state.status] || 'Unpaid'}</td></tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            <table className="inv3-block">
              <thead>
                <tr>
                  <th className="inv3-section-head">Customer Details</th>
                  <th className="inv3-section-head">Service Details</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="inv3-party-cell">
                    <div className="inv3-party-name">{state.toCompany || '—'}</div>
                    {state.toAddress && <div className="inv3-line">{state.toAddress}</div>}
                    {state.toPhone && <div className="inv3-line">Phone: {state.toPhone}</div>}
                    {state.toEmail && <div className="inv3-line">Email: {state.toEmail}</div>}
                  </td>
                  <td className="inv3-party-cell">
                    <div className="inv3-line">Service Type: Professional Services (Non-GST)</div>
                    <div className="inv3-line">Payment Due: {fmtDateShort(state.dueDate)}</div>
                    <div className="inv3-line">Balance Due: {fmt(balanceDue, cur)}</div>
                  </td>
                </tr>
              </tbody>
            </table>

            <table className="inv3-block inv3-items">
              <colgroup>
                <col style={{ width: '6%' }} />
                <col style={{ width: '48%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '20%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Rate / Item</th>
                  <th>Qty</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item, idx) => {
                  const qty = Number(item.qty) || 0
                  const rate = Number(item.rate) || 0
                  const amount = qty * rate
                  return (
                    <tr key={item.id}>
                      <td className="inv3-center">{idx + 1}</td>
                      <td>{item.desc || '—'}</td>
                      <td className="inv3-right">{fmt(rate, cur)}</td>
                      <td className="inv3-center">{qty || '—'}</td>
                      <td className="inv3-right">{fmt(amount, cur)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <table className="inv3-block inv3-summary-wrap">
              <tbody>
                <tr>
                  <td className="inv3-items-count">
                    <div className="inv3-items-count-inner">
                      Total Items / Qty : {displayItems.length} / {totalQty.toFixed(2)}
                    </div>
                  </td>
                  <td className="inv3-totals-cell">
                    <table className="inv3-totals">
                      <tbody>
                        <tr><td>Amount</td><td>{fmt(subtotal, cur)}</td></tr>
                        <tr><td>Discount</td><td>{fmt(discount, cur)}</td></tr>
                        <tr><td>Sub Total</td><td>{fmt(total, cur)}</td></tr>
                        <tr><td>Total</td><td>{fmt(total, cur)}</td></tr>
                        <tr><td>Paid Amount</td><td>{fmt(paid, cur)}</td></tr>
                        <tr className="inv3-balance-row"><td>Balance</td><td>{fmt(balanceDue, cur)}</td></tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="inv3-words">
              Total amount (in words): <strong>{amountInWords(balanceDue)}</strong>
            </div>

            <table className="inv3-block">
              <tbody>
                <tr>
                  <td className="inv3-footer-box">
                    <div className="inv3-footer-title">Bank Details:</div>
                    {bankLines.length > 0
                      ? bankLines.map((line, i) => <div key={i} className="inv3-line">{line}</div>)
                      : <div className="inv3-line">—</div>}
                  </td>
                  <td className="inv3-footer-box inv3-upi-box">
                    <div className="inv3-footer-title">Pay using UPI:</div>
                    <div className="inv3-upi-content">
                      <img className="inv3-upi-qr" src={upiQrDataUrl} alt="UPI payment QR code" />
                      <div className="inv3-upi-meta">
                        <div className="inv3-line">UPI ID: {upiId}</div>
                        <div className="inv3-line">Payee: {upiPayeeName}</div>
                        <div className="inv3-line">Amount: {fmt(balanceDue, cur)}</div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="inv3-footer-box">
                    <div className="inv3-footer-title">Notes:</div>
                    {noteLines.length > 0
                      ? noteLines.map((line, i) => <div key={i} className="inv3-line">{line}</div>)
                      : <div className="inv3-line">—</div>}
                  </td>
                  <td className="inv3-footer-box" />
                </tr>
                <tr>
                  <td className="inv3-footer-box inv3-terms-cell" colSpan={2}>
                    <div className="inv3-footer-title">Terms and conditions:</div>
                    {termsLines.length > 0
                      ? termsLines.map((line, i) => <div key={i} className="inv3-line">{i + 1}. {line}</div>)
                      : <div className="inv3-line">—</div>}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="inv3-sign">
              <img className="inv3-sign-image" src="/signature.png" alt="Authorized signature" />
              <div className="inv3-sign-line" />
              <div className="inv3-sign-label">Authorized Signatory</div>
              <div className="inv3-sign-company">{state.fromCompany || 'Console Projects'}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
})

export default InvoicePreview
