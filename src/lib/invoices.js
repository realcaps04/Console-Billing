import { supabase, isSupabaseConfigured } from './supabase'
import { computeTotalsWithDiscount } from '../utils'

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env, then restart npm run dev.',
    )
  }
  return supabase
}

function mapRowToBill(row) {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    status: row.status,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    fromCompany: row.from_company,
    fromAddress: row.from_address,
    fromEmail: row.from_email,
    fromPhone: row.from_phone,
    toCompany: row.to_company,
    toAddress: row.to_address,
    toEmail: row.to_email,
    toPhone: row.to_phone,
    currency: row.currency,
    amountPaid: row.amount_paid,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    paymentMode: row.payment_mode,
    upiId: row.upi_id,
    upiPayeeName: row.upi_payee_name,
    bankDetails: row.bank_details,
    extraNotes: row.extra_notes,
    terms: row.terms,
    items: row.items || [],
    subtotal: Number(row.subtotal) || 0,
    discount: Number(row.discount) || 0,
    total: Number(row.total) || 0,
    balanceDue: Number(row.balance_due) || 0,
    createdAt: row.created_at,
  }
}

function mapStateToRow(state) {
  const { subtotal, discount, total } = computeTotalsWithDiscount(
    state.items,
    state.discountType,
    state.discountValue,
  )
  const paid = Number(state.amountPaid) || 0
  const balanceDue = Math.max(0, total - paid)

  return {
    invoice_number: state.invoiceNumber,
    status: state.status,
    issue_date: state.issueDate,
    due_date: state.dueDate,
    from_company: state.fromCompany,
    from_address: state.fromAddress,
    from_email: state.fromEmail,
    from_phone: state.fromPhone,
    to_company: state.toCompany,
    to_address: state.toAddress,
    to_email: state.toEmail,
    to_phone: state.toPhone,
    currency: state.currency,
    amount_paid: paid,
    discount_type: state.discountType,
    discount_value: Number(state.discountValue) || 0,
    payment_mode: state.paymentMode,
    upi_id: state.upiId,
    upi_payee_name: state.upiPayeeName,
    bank_details: state.bankDetails,
    extra_notes: state.extraNotes,
    terms: state.terms,
    items: state.items,
    subtotal,
    discount,
    total,
    balance_due: balanceDue,
  }
}

export async function fetchInvoices() {
  const client = requireSupabase()
  const { data, error } = await client
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(mapRowToBill)
}

export async function saveInvoice(state) {
  const client = requireSupabase()
  const row = mapStateToRow(state)
  const { data, error } = await client
    .from('invoices')
    .upsert(row, { onConflict: 'invoice_number' })
    .select()
    .single()

  if (error) throw error
  return mapRowToBill(data)
}
