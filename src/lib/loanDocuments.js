import { supabase, isSupabaseConfigured } from './supabase'
import { getEmailError, getIndianPhoneError } from '../utils'
import {
  buildCustomerProfile,
  createEmptyCustomerSections,
  mergeLegacyCustomerSections,
  resolveEnabledSectionIds,
} from './loanCustomerSections'

/** Quick-add suggestions when creating a new loan type */
export const LOAN_TYPE_SUGGESTIONS = [
  'JanSamarth Portal',
  'PM-Vidyalaxmi',
  'Vidya Lakshmi Portal (Education Loans)',
  'Stand-Up India Portal',
  'PM SVANidhi Portal',
  'PSB Loans in 59 Minutes',
  'Udyami Mitra (Mudra Loan Portal)',
]

export const LOAN_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'disbursed', label: 'Disbursed' },
]

export const DEFAULT_LOAN_EDIT_PASSWORD = '3455'

function trim(value) {
  return String(value ?? '').trim()
}


export function createEmptyLoanType() {
  return {
    id: null,
    name: '',
    description: '',
    portalUrl: '',
  }
}

export function createEmptyLoanDocument(loanTypeId = null) {
  const sections = createEmptyCustomerSections()
  const base = {
    id: null,
    loanTypeId: loanTypeId || null,
    customerName: '',
    loanReference: '',
    status: 'draft',
    notes: '',
    enabledSectionIds: [],
    ...sections,
    editPassword: DEFAULT_LOAN_EDIT_PASSWORD,
  }
  return {
    ...base,
    customerProfile: buildCustomerProfile(base),
  }
}

export function getLoanEditPassword(record) {
  const value = trim(record?.editPassword)
  return value || DEFAULT_LOAN_EDIT_PASSWORD
}

export function normalizeLoanType(record) {
  const empty = createEmptyLoanType()
  return {
    ...empty,
    ...record,
    name: trim(record?.name),
    description: trim(record?.description),
    portalUrl: trim(record?.portalUrl),
  }
}

export function normalizeLoanDocument(record) {
  const empty = createEmptyLoanDocument(record?.loanTypeId)
  const sections = mergeLegacyCustomerSections({
    customerProfile: record?.customerProfile,
    personalDetails: record?.personalDetails,
    kycDetails: record?.kycDetails,
    bankDetails: record?.bankDetails,
    loginCredentials: record?.loginCredentials,
  })

  const merged = {
    ...empty,
    ...record,
    ...sections,
    loanTypeId: record?.loanTypeId || null,
    status: LOAN_STATUSES.some((s) => s.value === trim(record?.status)) ? trim(record.status) : 'draft',
    editPassword: getLoanEditPassword(record),
  }

  const enabledSectionIds = resolveEnabledSectionIds({
    ...merged,
    customerProfile: record?.customerProfile,
    enabledSectionIds: record?.enabledSectionIds,
  })

  const withSections = {
    ...merged,
    enabledSectionIds,
  }

  return {
    ...withSections,
    customerProfile: buildCustomerProfile(withSections),
  }
}

export function serializeLoanDocumentForCompare(state) {
  const normalized = normalizeLoanDocument(state)
  return JSON.stringify({
    id: normalized.id ?? null,
    loanTypeId: normalized.loanTypeId ?? null,
    customerName: trim(normalized.customerName),
    loanReference: trim(normalized.loanReference),
    status: trim(normalized.status),
    notes: trim(normalized.notes),
    enabledSectionIds: normalized.enabledSectionIds,
    customerProfile: buildCustomerProfile(normalized),
    editPassword: trim(normalized.editPassword),
  })
}

export function getLoanTypeValidationErrors(state) {
  return {
    name: trim(state.name) ? '' : 'Loan type name is required.',
  }
}

export function hasLoanTypeValidationErrors(errors) {
  return Boolean(errors?.name)
}

export function getLoanDocumentValidationErrors(state) {
  const contact = state.contactDetails || {}
  return {
    customerName: trim(state.customerName) ? '' : 'Customer name is required.',
    loanTypeId: trim(state.loanTypeId) ? '' : 'Loan type is required.',
    contactDetails: {
      email: getEmailError(contact.email),
      primaryMobile: getIndianPhoneError(contact.primaryMobile),
      alternateMobile: getIndianPhoneError(contact.alternateMobile),
      whatsappNumber: getIndianPhoneError(contact.whatsappNumber),
      emergencyContactNumber: getIndianPhoneError(contact.emergencyContactNumber),
    },
  }
}

export function hasLoanDocumentValidationErrors(errors) {
  if (!errors) return false
  if (errors.customerName || errors.loanTypeId) return true
  const contact = errors.contactDetails || {}
  return Object.values(contact).some(Boolean)
}

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      import.meta.env.PROD
        ? 'Supabase is not configured on this deploy. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel, then Redeploy.'
        : 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env, then restart npm run dev.',
    )
  }
  return supabase
}

function tableMissingError(error, tableLabel = 'Loan documents') {
  if (
    error?.code === 'PGRST205' ||
    String(error?.message || '').toLowerCase().includes('could not find the table') ||
    String(error?.message || '').toLowerCase().includes('schema cache')
  ) {
    return new Error(`${tableLabel} table not found. Run supabase/loan_documents.sql in the Supabase SQL Editor.`)
  }
  return null
}

function mapLoanTypeRow(row, customerCount = 0) {
  return {
    id: row.id,
    name: row.name || '',
    description: row.description || '',
    portalUrl: row.portal_url || '',
    customerCount: Number(customerCount) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapCustomerRow(row) {
  return normalizeLoanDocument({
    id: row.id,
    loanTypeId: row.loan_type_id || null,
    customerName: row.customer_name || '',
    loanReference: row.loan_reference || '',
    status: row.status || 'draft',
    notes: row.notes || '',
    customerProfile: row.customer_profile || {},
    personalDetails: row.personal_details || {},
    kycDetails: row.kyc_details || {},
    bankDetails: row.bank_details || {},
    loginCredentials: row.login_credentials || {},
    editPassword: trim(row.edit_password) || DEFAULT_LOAN_EDIT_PASSWORD,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

function mapLoanTypeToRow(state) {
  const name = trim(state.name)
  if (!name) throw new Error('Loan type name is required.')
  return {
    name,
    description: trim(state.description) || null,
    portal_url: trim(state.portalUrl) || null,
    updated_at: new Date().toISOString(),
  }
}

function mapCustomerToRow(state) {
  const customerName = trim(state.customerName)
  if (!customerName) throw new Error('Customer name is required.')

  const loanTypeId = trim(state.loanTypeId)
  if (!loanTypeId) throw new Error('Loan type is required.')

  const normalized = normalizeLoanDocument(state)
  const profile = buildCustomerProfile(normalized)

  return {
    loan_type_id: loanTypeId,
    customer_name: customerName,
    loan_reference: trim(state.loanReference) || null,
    status: LOAN_STATUSES.some((s) => s.value === trim(state.status)) ? trim(state.status) : 'draft',
    notes: trim(state.notes) || null,
    customer_profile: profile,
    personal_details: profile.personalDetails,
    kyc_details: profile.kycDetails,
    bank_details: profile.bankDetails,
    login_credentials: profile.loginCredentials,
    edit_password: trim(state.editPassword) || DEFAULT_LOAN_EDIT_PASSWORD,
    updated_at: new Date().toISOString(),
  }
}

function withLegacyLoanPortal(row, loanTypeName) {
  return {
    ...row,
    loan_portal: trim(loanTypeName) || 'General',
  }
}

function isLoanPortalConstraintError(error) {
  const msg = String(error?.message || '').toLowerCase()
  return msg.includes('loan_portal')
}

async function resolveLoanTypeName(client, state, loanTypeName) {
  const provided = trim(loanTypeName)
  if (provided) return provided

  const loanTypeId = trim(state.loanTypeId)
  if (!loanTypeId) return ''

  const { data } = await client
    .from('loan_types')
    .select('name')
    .eq('id', loanTypeId)
    .maybeSingle()

  return trim(data?.name)
}

async function persistLoanDocumentRow(client, state, row, loanTypeName) {
  const portalName = await resolveLoanTypeName(client, state, loanTypeName)
  const write = (payload) => {
    if (state.id) {
      return client
        .from('loan_documents')
        .update(payload)
        .eq('id', state.id)
        .select('*')
        .single()
    }
    return client
      .from('loan_documents')
      .insert(payload)
      .select('*')
      .single()
  }

  let { data, error } = await write(row)
  if (error && isLoanPortalConstraintError(error)) {
    ;({ data, error } = await write(withLegacyLoanPortal(row, portalName)))
  }

  return { data, error }
}

export async function fetchLoanTypes({ limit = 100 } = {}) {
  const client = requireSupabase()
  const { data, error } = await client
    .from('loan_types')
    .select('*, loan_documents(count)')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw tableMissingError(error, 'Loan types') || error
  }

  return (data || []).map((row) => {
    const count = Array.isArray(row.loan_documents)
      ? row.loan_documents[0]?.count
      : row.loan_documents?.count
    return mapLoanTypeRow(row, count)
  })
}

export async function saveLoanType(state) {
  const client = requireSupabase()
  const row = mapLoanTypeToRow(state)

  if (state.id) {
    const { data, error } = await client
      .from('loan_types')
      .update(row)
      .eq('id', state.id)
      .select('*')
      .single()

    if (error) {
      if (String(error.message || '').toLowerCase().includes('duplicate')) {
        throw new Error('A loan type with this name already exists.')
      }
      throw tableMissingError(error, 'Loan types') || error
    }
    return mapLoanTypeRow(data)
  }

  const { data, error } = await client
    .from('loan_types')
    .insert(row)
    .select('*')
    .single()

  if (error) {
    if (String(error.message || '').toLowerCase().includes('duplicate')) {
      throw new Error('A loan type with this name already exists.')
    }
    throw tableMissingError(error, 'Loan types') || error
  }
  return mapLoanTypeRow(data)
}

export async function deleteLoanType(id) {
  const client = requireSupabase()
  if (!id) throw new Error('Loan type id is required.')

  const { data, error } = await client
    .from('loan_types')
    .delete()
    .eq('id', id)
    .select('id')

  if (error) {
    throw tableMissingError(error, 'Loan types') || error
  }
  if (!data?.length) throw new Error('Loan type was not deleted.')
  return true
}

export async function fetchLoanCustomers({ loanTypeId, limit = 200 } = {}) {
  const client = requireSupabase()
  if (!loanTypeId) throw new Error('Loan type id is required.')

  const { data, error } = await client
    .from('loan_documents')
    .select('*')
    .eq('loan_type_id', loanTypeId)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw tableMissingError(error) || error
  }
  return (data || []).map(mapCustomerRow)
}

function collectSearchValues(value, out = []) {
  if (value == null) return out
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = String(value).trim()
    if (text) out.push(text)
    return out
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectSearchValues(item, out))
    return out
  }
  if (typeof value === 'object') {
    Object.values(value).forEach((item) => collectSearchValues(item, out))
  }
  return out
}

/** Match a customer record against any saved field (name, KYC, bank, login, notes, etc.). */
export function customerMatchesSearch(record, query, loanTypeName = '') {
  const q = trim(query).toLowerCase()
  if (!q) return true

  const haystack = [
    loanTypeName,
    getLoanStatusLabel(record?.status),
    ...collectSearchValues(record),
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(q)
}

/** Short label for what matched in search results. */
export function getCustomerSearchMatchHint(record, query, loanTypeName = '') {
  const q = trim(query).toLowerCase()
  if (!q) return ''

  const candidates = [
    ['Customer', record?.customerName],
    ['Reference', record?.loanReference],
    ['Loan type', loanTypeName],
    ['Phone', record?.contactDetails?.primaryMobile],
    ['Email', record?.contactDetails?.email],
    ['PAN', record?.kycDetails?.pan],
    ['Aadhaar', record?.kycDetails?.aadhaar],
    ['Account no.', record?.bankDetails?.accountNumber],
    ['IFSC', record?.bankDetails?.ifsc],
    ['Username', record?.loginCredentials?.username],
    ['Notes', record?.notes],
  ]

  for (const [label, value] of candidates) {
    if (String(value || '').toLowerCase().includes(q)) {
      return `${label}: ${value}`
    }
  }

  return 'Matched saved details'
}

/** Search all customers across every loan type and every stored field. */
export async function searchAllLoanCustomers({ query, limit = 100 } = {}) {
  const q = trim(query)
  if (!q) return []

  const client = requireSupabase()
  const { data, error } = await client
    .from('loan_documents')
    .select('*, loan_types(id, name, description, portal_url, created_at, updated_at)')
    .order('updated_at', { ascending: false })
    .limit(1000)

  if (error) {
    throw tableMissingError(error) || error
  }

  return (data || [])
    .map((row) => {
      const loanType = row.loan_types ? mapLoanTypeRow(row.loan_types) : null
      const customer = mapCustomerRow(row)
      return {
        ...customer,
        loanType,
        loanTypeName: loanType?.name || '',
      }
    })
    .filter((record) => customerMatchesSearch(record, q, record.loanTypeName))
    .slice(0, limit)
}

export async function saveLoanDocument(state, { loanTypeName = '' } = {}) {
  const client = requireSupabase()
  const row = mapCustomerToRow(state)
  const { data, error } = await persistLoanDocumentRow(client, state, row, loanTypeName)

  if (error) {
    throw tableMissingError(error) || error
  }
  return mapCustomerRow(data)
}

export async function deleteLoanDocument(id) {
  const client = requireSupabase()
  if (!id) throw new Error('Record id is required.')

  const { data, error } = await client
    .from('loan_documents')
    .delete()
    .eq('id', id)
    .select('id')

  if (error) {
    throw tableMissingError(error) || error
  }
  if (!data?.length) throw new Error('Record was not deleted.')
  return true
}

export function getLoanStatusLabel(status) {
  return LOAN_STATUSES.find((s) => s.value === status)?.label || status || '—'
}

const LOAN_TYPE_THEME_BY_NAME = {
  'JanSamarth Portal': 'jansamarth',
  'PM-Vidyalaxmi': 'vidyalaxmi',
  'Vidya Lakshmi Portal (Education Loans)': 'vidya-lakshmi',
  'Stand-Up India Portal': 'stand-up-india',
  'PM SVANidhi Portal': 'pm-svanidhi',
  'PSB Loans in 59 Minutes': 'psb-59',
  'Udyami Mitra (Mudra Loan Portal)': 'udyami-mitra',
}

const LOAN_TYPE_FALLBACK_THEMES = ['ocean', 'forest', 'copper', 'plum', 'steel', 'wine']

export function getLoanTypeTheme(name) {
  const key = trim(name)
  if (LOAN_TYPE_THEME_BY_NAME[key]) return LOAN_TYPE_THEME_BY_NAME[key]

  const matched = Object.entries(LOAN_TYPE_THEME_BY_NAME).find(
    ([label]) => label.toLowerCase() === key.toLowerCase(),
  )
  if (matched) return matched[1]

  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i)
    hash |= 0
  }
  return LOAN_TYPE_FALLBACK_THEMES[Math.abs(hash) % LOAN_TYPE_FALLBACK_THEMES.length]
}

export function getLoanTypeInitials(name) {
  const words = trim(name).split(/[\s/()-]+/).filter(Boolean)
  if (!words.length) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase()
}
