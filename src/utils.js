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
  // Time + random keeps back-to-back bills unique
  const timePart = Date.now().toString(36).toUpperCase().slice(-4)
  const rand = String(Math.floor(10 + Math.random() * 90))
  return `INV-${y}${m}${day}-${timePart}${rand}`
}

export function isValidEmail(value) {
  const email = String(value ?? '').trim()
  if (!email) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email)
}

export function getEmailError(value, { required = false } = {}) {
  const email = String(value ?? '').trim()
  if (!email) return required ? 'Email is required.' : ''
  if (!isValidEmail(email)) return 'Enter a valid email address.'
  return ''
}

/** Digits-only mobile: Indian 10-digit starting 6-9 */
export function extractIndianMobileDigits(value) {
  let raw = String(value ?? '').trim()
  // Strip display / pasted country code before digit extraction
  if (/^\+91/.test(raw) || /^91[\s-]/.test(raw)) {
    raw = raw.replace(/^\+?91[\s-]*/, '')
  }
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('91') && digits.length > 10) digits = digits.slice(2)
  else if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1)
  return digits.slice(0, 10)
}

export function formatIndianPhone(value) {
  const digits = extractIndianMobileDigits(value)
  if (!digits) return ''
  if (digits.length <= 5) return `+91 ${digits}`
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
}

export function isValidIndianPhone(value) {
  const digits = extractIndianMobileDigits(value)
  return /^[6-9]\d{9}$/.test(digits)
}

export function getIndianPhoneError(value, { required = false } = {}) {
  const raw = String(value ?? '').trim()
  if (!raw) return required ? 'Phone number is required.' : ''
  if (!isValidIndianPhone(raw)) return 'Enter a valid Indian mobile number (10 digits, starts with 6–9).'
  return ''
}

export function getContactValidationErrors(state) {
  const toCompany = String(state.toCompany ?? '').trim()
  return {
    toCompany: toCompany ? '' : 'Client / company name is required.',
    fromEmail: getEmailError(state.fromEmail, { required: true }),
    fromPhone: getIndianPhoneError(state.fromPhone, { required: true }),
    toEmail: getEmailError(state.toEmail, { required: false }),
    toPhone: getIndianPhoneError(state.toPhone, { required: false }),
  }
}

export function hasContactValidationErrors(state) {
  const errors = getContactValidationErrors(state)
  return Object.values(errors).some(Boolean)
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
