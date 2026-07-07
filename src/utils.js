// Helper to format currency amounts
export function fmt(amount, symbol = '₹') {
  const n = Number(amount) || 0
  return `${symbol} ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function sanitizeInvoiceNumber(input) {
  const raw = String(input ?? '')
  const cleaned = raw
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/[^A-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return cleaned
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
  return { subtotal, discount: 0, total: subtotal }
}

export function computeTotalsWithDiscount(items, discountType, discountValue) {
  const { subtotal } = computeTotals(items)
  const v = Number(discountValue) || 0
  const discount =
    discountType === 'percent'
      ? Math.max(0, Math.min(subtotal, (subtotal * v) / 100))
      : Math.max(0, Math.min(subtotal, v))
  const total = Math.max(0, subtotal - discount)
  return { subtotal, discount, total }
}
