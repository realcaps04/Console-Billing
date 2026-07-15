import { fmt, fmtDateShort } from '../utils'

export default function PreviousBills({
  bills = [],
  loading = false,
  error = null,
  onNewInvoice,
  onRefresh,
  onOpenBill,
}) {
  return (
    <section className="bills-panel">
      <div className="bills-header">
        <div>
          <h1 className="bills-title">Previous Bills</h1>
          <p className="bills-sub">View and reopen past invoices from Supabase</p>
        </div>
        <div className="bills-header-actions">
          {onRefresh && (
            <button type="button" className="bills-refresh-btn" onClick={onRefresh} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          )}
          <button type="button" className="btn-download-main bills-new-btn" onClick={onNewInvoice}>
            + New Invoice
          </button>
        </div>
      </div>

      {loading && (
        <div className="bills-empty">
          <p>Loading bills…</p>
        </div>
      )}

      {!loading && error && (
        <div className="bills-empty bills-error">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && bills.length === 0 && (
        <div className="bills-empty">
          <p>No previous bills yet.</p>
          <p className="bills-empty-hint">Download a PDF from New Invoice to save it here.</p>
        </div>
      )}

      {!loading && !error && bills.length > 0 && (
        <div className="bills-table-wrap">
          <table className="bills-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id || bill.invoiceNumber}>
                  <td className="bills-mono">{bill.invoiceNumber || '—'}</td>
                  <td>{bill.toCompany || bill.clientName || '—'}</td>
                  <td>{fmtDateShort(bill.issueDate)}</td>
                  <td>{fmtDateShort(bill.dueDate)}</td>
                  <td>
                    <span className={`status-badge status-${bill.status || 'unpaid'}`}>
                      {(bill.status || 'unpaid').replace(/^\w/, (c) => c.toUpperCase())}
                    </span>
                  </td>
                  <td className="bills-mono bills-amount">
                    {fmt(bill.balanceDue ?? bill.total ?? 0, bill.currency || '₹')}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="bills-open-btn"
                      onClick={() => onOpenBill?.(bill)}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
