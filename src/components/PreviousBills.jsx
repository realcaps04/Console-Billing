import { fmt, fmtDateShort } from '../utils'

/**
 * Previous Bills view — wired for Supabase later.
 * Pass `bills` from your API once available.
 */
export default function PreviousBills({ bills = [], loading = false, error = null, onNewInvoice }) {
  return (
    <section className="bills-panel">
      <div className="bills-header">
        <div>
          <h1 className="bills-title">Previous Bills</h1>
          <p className="bills-sub">View and reopen past invoices</p>
        </div>
        <button type="button" className="btn-download-main bills-new-btn" onClick={onNewInvoice}>
          + New Invoice
        </button>
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
          <p className="bills-empty-hint">Saved invoices will appear here once Supabase is connected.</p>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
