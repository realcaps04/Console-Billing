import { supabase, isSupabaseConfigured } from './supabase'
import { computeTotalsWithDiscount, withDerivedPaymentFields, roundMoney } from '../utils'

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      import.meta.env.PROD
        ? 'Supabase is not configured on this deploy. In Vercel → Project → Settings → Environment Variables, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then Redeploy.'
        : 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env, then restart npm run dev.',
    )
  }
  return supabase
}

function mapRowToBill(row) {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    documentType: row.document_type || 'invoice',
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
  const derived = withDerivedPaymentFields(state)
  const { subtotal, discount, total } = computeTotalsWithDiscount(
    derived.items,
    derived.discountType,
    derived.discountValue,
  )
  const isEstimate = (derived.documentType || 'invoice') === 'estimate'
  const paid = isEstimate ? 0 : Math.max(0, roundMoney(derived.amountPaid))
  const balanceDue = isEstimate ? 0 : Math.max(0, roundMoney(total - paid))

  return {
    invoice_number: derived.invoiceNumber,
    document_type: derived.documentType || 'invoice',
    status: derived.status,
    issue_date: derived.issueDate,
    due_date: derived.dueDate,
    from_company: derived.fromCompany,
    from_address: derived.fromAddress,
    from_email: derived.fromEmail,
    from_phone: derived.fromPhone,
    to_company: derived.toCompany,
    to_address: derived.toAddress,
    to_email: derived.toEmail,
    to_phone: derived.toPhone,
    currency: derived.currency,
    amount_paid: paid,
    discount_type: derived.discountType,
    discount_value: Number(derived.discountValue) || 0,
    payment_mode: isEstimate ? '' : derived.paymentMode,
    upi_id: isEstimate ? '' : derived.upiId,
    upi_payee_name: isEstimate ? '' : derived.upiPayeeName,
    bank_details: isEstimate ? '' : derived.bankDetails,
    extra_notes: derived.extraNotes,
    terms: derived.terms,
    items: derived.items,
    subtotal,
    discount,
    total,
    balance_due: balanceDue,
  }
}

export async function fetchInvoices({ limit = 10 } = {}) {
  const client = requireSupabase()
  const { data, error } = await client
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

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

export async function deleteInvoice(bill) {
  const client = requireSupabase()
  const id = bill?.id
  const invoiceNumber = bill?.invoiceNumber

  if (!id && !invoiceNumber) {
    throw new Error('Missing invoice id.')
  }

  // Prefer uuid id; fall back to invoice_number. .select() verifies a row was removed
  // (Supabase/RLS can return no error while deleting 0 rows if delete policy is missing).
  let query = client.from('invoices').delete().select('id, invoice_number')
  if (id) {
    query = query.eq('id', id)
  } else {
    query = query.eq('invoice_number', invoiceNumber)
  }

  const { data, error } = await query
  if (error) throw error

  if (!data || data.length === 0) {
    // Retry by invoice number if id-based delete matched nothing
    if (id && invoiceNumber) {
      const { data: byNumber, error: byNumberError } = await client
        .from('invoices')
        .delete()
        .eq('invoice_number', invoiceNumber)
        .select('id, invoice_number')

      if (byNumberError) throw byNumberError
      if (byNumber && byNumber.length > 0) return byNumber[0]
    }

    throw new Error(
      'Invoice was not deleted in Supabase. Run the delete policy in supabase/invoices.sql (SQL Editor), then try again.',
    )
  }

  return data[0]
}
