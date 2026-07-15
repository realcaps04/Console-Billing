import { useEffect, useRef, useState } from 'react'
import { fmt, paymentStatusLabel, derivePaymentStatus, roundMoney, isEstimate } from '../utils'

const MAX_BILLS = 10

function getClientName(bill) {
  return String(bill.toCompany || bill.clientName || '').trim()
}

function matchesClientSearch(bill, query) {
  if (!query) return true
  const name = getClientName(bill).toLowerCase()
  return name.includes(query.toLowerCase())
}

function itemSummary(bill) {
  const items = Array.isArray(bill.items) ? bill.items : []
  const count = items.length
  const first = items.find((it) => it.desc)?.desc
  if (!count) return 'No line items'
  if (count === 1) return first || '1 item'
  return `${count} items${first ? ` · ${first}` : ''}`
}

function IconEdit() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )
}

function IconPdf() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M12 18v-6" />
      <path d="M9 15l3 3 3-3" />
    </svg>
  )
}

function IconPaid() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l2.5 2.5L16 9" />
    </svg>
  )
}

function IconDelete() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  )
}

export default function PreviousBills({
  bills = [],
  loading = false,
  error = null,
  onNewInvoice,
  onNewEstimate,
  onRefresh,
  onEditBill,
  onDeleteBill,
  onDownloadBill,
  onMarkPaidPdf,
  busyBillId = null,
  autoLoad = false,
}) {
  const loadedRef = useRef(false)
  const [clientSearch, setClientSearch] = useState('')
  const searchQuery = clientSearch.trim()

  const filteredBills = bills.filter((bill) => matchesClientSearch(bill, searchQuery))
  const visibleBills = filteredBills.slice(0, MAX_BILLS)

  useEffect(() => {
    if (!autoLoad || loadedRef.current) return
    loadedRef.current = true
    onRefresh?.()
  }, [autoLoad, onRefresh])

  const invoiceBills = visibleBills.filter((b) => !isEstimate(b))
  const estimateCount = visibleBills.filter((b) => isEstimate(b)).length

  const unpaidCount = invoiceBills.filter((b) => {
    const status = derivePaymentStatus(b.total, b.amountPaid)
    return status === 'unpaid'
  }).length
  const partialCount = invoiceBills.filter((b) => derivePaymentStatus(b.total, b.amountPaid) === 'partially_paid').length
  const paidCount = invoiceBills.filter((b) => derivePaymentStatus(b.total, b.amountPaid) === 'paid').length
  const totalOutstanding = invoiceBills.reduce((acc, b) => {
    const total = roundMoney(b.total)
    const paid = roundMoney(b.amountPaid)
    const balance = Math.max(0, total - paid)
    return acc + balance
  }, 0)

  const hasBills = bills.length > 0
  const initialLoading = loading && !hasBills
  const showStats = !error && visibleBills.length > 0
  const showTable = !error && visibleBills.length > 0

  return (
    <section className="bills-panel">
      <div className="bills-shell">
        <div className="bills-toolbar">
          <div className="bills-toolbar-left">
            <label className="bills-search">
              <svg className="bills-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" />
              </svg>
              <input
                type="search"
                className="bills-search-input"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Search by client name…"
                aria-label="Search by client name"
              />
              {clientSearch && (
                <button
                  type="button"
                  className="bills-search-clear"
                  onClick={() => setClientSearch('')}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </label>
          </div>
          <div className="bills-header-actions">
            {onRefresh && (
              <button type="button" className="bills-refresh-btn" onClick={onRefresh} disabled={loading}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                </svg>
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            )}
            <button type="button" className="bills-primary-btn" onClick={onNewInvoice}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Invoice
            </button>
            {onNewEstimate && (
              <button type="button" className="bills-secondary-btn" onClick={onNewEstimate}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M9 15h6" />
                  <path d="M9 11h6" />
                </svg>
                New Estimate
              </button>
            )}
          </div>
        </div>

        {showStats && (
          <div className={`bills-stats${loading ? ' bills-stats-refreshing' : ''}`}>
            <div className="bills-stat-card">
              <span className="bills-stat-label">Documents</span>
              <strong className="bills-stat-value">{visibleBills.length}</strong>
            </div>
            <div className="bills-stat-card">
              <span className="bills-stat-label">Estimates</span>
              <strong className="bills-stat-value">{estimateCount}</strong>
            </div>
            <div className="bills-stat-card">
              <span className="bills-stat-label">Unpaid</span>
              <strong className="bills-stat-value">{unpaidCount}</strong>
            </div>
            <div className="bills-stat-card">
              <span className="bills-stat-label">Partial</span>
              <strong className="bills-stat-value">{partialCount}</strong>
            </div>
            <div className="bills-stat-card">
              <span className="bills-stat-label">Paid</span>
              <strong className="bills-stat-value">{paidCount}</strong>
            </div>
            <div className="bills-stat-card">
              <span className="bills-stat-label">Outstanding</span>
              <strong className="bills-stat-value bills-stat-money">{fmt(totalOutstanding)}</strong>
            </div>
          </div>
        )}

        {initialLoading && (
          <div className="bills-state-card">
            <div className="bills-spinner" aria-hidden="true" />
            <h2 className="bills-state-title">Loading bills</h2>
            <p className="bills-state-copy">Fetching your saved invoices and estimates…</p>
          </div>
        )}

        {!loading && error && (
          <div className="bills-state-card bills-state-error">
            <div className="bills-state-icon" aria-hidden="true">!</div>
            <h2 className="bills-state-title">Unable to load bills</h2>
            <p className="bills-state-copy">{error}</p>
            {onRefresh && (
              <button type="button" className="bills-primary-btn" onClick={onRefresh}>
                Try again
              </button>
            )}
          </div>
        )}

        {!loading && !error && bills.length === 0 && (
          <div className="bills-state-card">
            <div className="bills-state-icon bills-state-icon-empty" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="13" y2="17" />
              </svg>
            </div>
            <h2 className="bills-state-title">No bills saved yet</h2>
            <p className="bills-state-copy">
              Create an invoice or estimate, then use <strong>Save Invoice</strong> or <strong>Save Estimate</strong> on the left panel to store it here.
            </p>
            <div className="bills-state-actions">
              <button type="button" className="bills-primary-btn" onClick={onNewInvoice}>
                Create your first invoice
              </button>
              {onNewEstimate && (
                <button type="button" className="bills-secondary-btn" onClick={onNewEstimate}>
                  Create your first estimate
                </button>
              )}
            </div>
          </div>
        )}

        {!loading && !error && bills.length > 0 && filteredBills.length === 0 && (
          <div className="bills-state-card">
            <div className="bills-state-icon bills-state-icon-empty" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" />
              </svg>
            </div>
            <h2 className="bills-state-title">No matching clients</h2>
            <p className="bills-state-copy">
              No bills found for <strong>{searchQuery}</strong>. Try a different client name.
            </p>
            <button type="button" className="bills-primary-btn" onClick={() => setClientSearch('')}>
              Clear search
            </button>
          </div>
        )}

        {showTable && (
          <div className="bills-table-wrap">
            <table className="bills-table">
              <thead>
                <tr>
                  <th className="bills-col-invoice">Document</th>
                  <th className="bills-col-client">Client</th>
                  <th className="bills-col-details">Details</th>
                  <th className="bills-col-amounts">Amounts</th>
                  <th className="bills-col-status">Status</th>
                  <th className="bills-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleBills.map((bill) => {
                  const rowId = bill.id || bill.invoiceNumber
                  const busy = busyBillId === rowId
                  const estimate = isEstimate(bill)
                  const total = roundMoney(bill.total)
                  const paidAmt = roundMoney(bill.amountPaid)
                  const balance = Math.max(0, roundMoney(bill.balanceDue ?? (total - paidAmt)))
                  const status = estimate ? 'draft' : derivePaymentStatus(total, paidAmt)
                  const isPaid = status === 'paid'
                  return (
                    <tr key={rowId}>
                      <td className="bills-col-invoice">
                        <div className="bills-invoice-cell">
                          <span className={`doc-type-badge doc-type-${estimate ? 'estimate' : 'invoice'}`}>
                            {estimate ? 'Estimate' : 'Invoice'}
                          </span>
                          <span className="bills-mono bills-invoice-no">{bill.invoiceNumber || '—'}</span>
                        </div>
                      </td>
                      <td className="bills-col-client">
                        <div className="bills-client-cell">
                          <span className="bills-client">{bill.toCompany || bill.clientName || 'Untitled client'}</span>
                          {bill.toEmail && <span className="bills-row-meta">{bill.toEmail}</span>}
                          {bill.toPhone && <span className="bills-row-meta">{bill.toPhone}</span>}
                        </div>
                      </td>
                      <td className="bills-col-details">
                        <span className="bills-row-detail">{itemSummary(bill)}</span>
                      </td>
                      <td className="bills-col-amounts">
                        <div className="bills-amounts-cell">
                          <span className="bills-amount-line">
                            <span className="bills-amount-label">Total</span>
                            <span className="bills-mono">{fmt(total, bill.currency || '₹')}</span>
                          </span>
                          {!estimate && (
                            <span className="bills-amount-line bills-amount-balance">
                              <span className="bills-amount-label">Balance</span>
                              <span className="bills-mono bills-amount">{fmt(balance, bill.currency || '₹')}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="bills-col-status">
                        <span className={`status-badge status-${status}`}>
                          {paymentStatusLabel(status)}
                        </span>
                      </td>
                      <td className="bills-col-actions bills-actions-cell">
                        <div className="bills-row-actions">
                          <button
                            type="button"
                            className="bills-action-btn bills-action-edit"
                            onClick={() => onEditBill?.(bill)}
                            disabled={busy}
                            title="Edit"
                            aria-label="Edit"
                          >
                            <IconEdit />
                          </button>
                          <button
                            type="button"
                            className="bills-action-btn bills-action-download"
                            onClick={() => onDownloadBill?.(bill)}
                            disabled={busy}
                            title="Download PDF"
                            aria-label="Download PDF"
                          >
                            <IconPdf />
                          </button>
                          {!estimate && (
                            <button
                              type="button"
                              className="bills-action-btn bills-action-paid"
                              onClick={() => onMarkPaidPdf?.(bill)}
                              disabled={busy}
                              title={isPaid ? 'Download PDF with PAID stamp' : 'Mark as paid and download stamped PDF'}
                              aria-label={isPaid ? 'Download paid PDF' : 'Mark as paid'}
                            >
                              <IconPaid />
                            </button>
                          )}
                          <button
                            type="button"
                            className="bills-action-btn bills-action-delete"
                            onClick={() => onDeleteBill?.(bill)}
                            disabled={busy}
                            title="Delete"
                            aria-label="Delete"
                          >
                            <IconDelete />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="bills-table-footer">
              <span className="bills-table-count">
                {searchQuery
                  ? `Showing ${visibleBills.length} of ${filteredBills.length} match${filteredBills.length === 1 ? '' : 'es'}`
                  : `Showing ${visibleBills.length} of max ${MAX_BILLS}`}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
