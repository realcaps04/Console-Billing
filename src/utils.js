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

export function generateInvoiceNumber(dateStr = new Date().toISOString().split('T')[0]) {
  const d = new Date(`${dateStr}T00:00:00`)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const rand = String(Math.floor(10000 + Math.random() * 90000))
  return `INV-${y}${m}${day}-${rand}`
}

// Format date string to readable form
export function fmtDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function fmtDateShort(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
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

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function twoDigits(n) {
  if (n < 20) return ONES[n]
  return `${TENS[Math.floor(n / 10)]}${ONES[n % 10] ? ` ${ONES[n % 10]}` : ''}`.trim()
}

function threeDigits(n) {
  if (n < 100) return twoDigits(n)
  return `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${twoDigits(n % 100)}` : ''}`.trim()
}

function integerToWords(n) {
  if (n === 0) return 'Zero'
  const parts = []
  const crore = Math.floor(n / 10000000)
  const lakh = Math.floor((n % 10000000) / 100000)
  const thousand = Math.floor((n % 100000) / 1000)
  const rest = n % 1000

  if (crore) parts.push(`${threeDigits(crore)} Crore`)
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`)
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`)
  if (rest) parts.push(threeDigits(rest))

  return parts.join(' ')
}

export function amountInWords(amount) {
  const n = Math.round((Number(amount) || 0) * 100)
  const rupees = Math.floor(n / 100)
  const paise = n % 100
  let words = `${integerToWords(rupees)} Rupees`
  if (paise) words += ` and ${twoDigits(paise)} Paise`
  return `${words} only`
}

export function buildUpiPaymentUri({ vpa, payeeName, amount, note, txnRef }) {
  const normalizedVpa = String(vpa ?? '').trim().toLowerCase()
  if (!normalizedVpa.includes('@')) return ''

  const pn = String(payeeName || 'Payee').trim().slice(0, 20)
  const amt = Math.max(0, Number(amount) || 0)
  const parts = [
    `pa=${encodeURIComponent(normalizedVpa)}`,
    `pn=${encodeURIComponent(pn)}`,
  ]

  if (txnRef) {
    parts.push(`tr=${encodeURIComponent(String(txnRef).trim().slice(0, 35))}`)
  }

  const cleanNote = String(note ?? '')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50)
  if (cleanNote) {
    parts.push(`tn=${encodeURIComponent(cleanNote)}`)
  }

  if (amt > 0) {
    parts.push(`am=${encodeURIComponent(amt.toFixed(2))}`)
    parts.push('cu=INR')
  }

  return `upi://pay?${parts.join('&')}`
}
