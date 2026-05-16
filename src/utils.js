// Helper to format currency amounts
export function fmt(amount, symbol = '₹') {
  const n = Number(amount) || 0
  return `${symbol} ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Format date string to readable form
export function fmtDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
}

// Compute subtotal from items array
export function computeTotals(items) {
  const subtotal = items.reduce((acc, it) => acc + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0)
  return { subtotal, total: subtotal }
}
