import { supabase, isSupabaseConfigured } from './supabase'

/** Fallback catalog if Supabase table is missing / not configured */
export const FALLBACK_SERVICE_ITEMS = [
  { id: 'local-1', description: 'Udyam Registration', rate: 0, category: 'Business & Compliance' },
  { id: 'local-2', description: 'K-SWIFT (Kerala Single Window Interface for Fast and Transparent Clearances)', rate: 0, category: 'Business & Compliance' },
  { id: 'local-3', description: 'Startup India Portal', rate: 0, category: 'Business & Compliance' },
  { id: 'local-4', description: 'GeM (Government e-Marketplace)', rate: 0, category: 'Business & Compliance' },
  { id: 'local-5', description: 'GST Portal', rate: 0, category: 'Business & Compliance' },
  { id: 'local-6', description: 'Income Tax e-Filing Portal', rate: 0, category: 'Business & Compliance' },
  { id: 'local-7', description: 'MCA21 (Ministry of Corporate Affairs)', rate: 0, category: 'Business & Compliance' },
  { id: 'local-8', description: 'Shram Suvidha Portal', rate: 0, category: 'Business & Compliance' },
  { id: 'local-9', description: 'e-Way Bill System', rate: 0, category: 'Business & Compliance' },
  { id: 'local-10', description: 'Make in India Portal', rate: 0, category: 'Business & Compliance' },
  { id: 'local-11', description: 'JanSamarth Portal', rate: 0, category: 'Loans, Finance & Banking' },
  { id: 'local-12', description: 'PM-Vidyalaxmi', rate: 0, category: 'Loans, Finance & Banking' },
  { id: 'local-13', description: 'Vidya Lakshmi Portal (Education Loans)', rate: 0, category: 'Loans, Finance & Banking' },
  { id: 'local-14', description: 'Stand-Up India Portal', rate: 0, category: 'Loans, Finance & Banking' },
  { id: 'local-15', description: 'PM SVANidhi Portal', rate: 0, category: 'Loans, Finance & Banking' },
  { id: 'local-16', description: 'PSB Loans in 59 Minutes', rate: 0, category: 'Loans, Finance & Banking' },
  { id: 'local-17', description: 'Udyami Mitra (Mudra Loan Portal)', rate: 0, category: 'Loans, Finance & Banking' },
  { id: 'local-18', description: 'DigiLocker', rate: 0, category: 'Citizen Services & Identification' },
  { id: 'local-19', description: 'Parivahan Sewa (Vahan & Sarathi)', rate: 0, category: 'Citizen Services & Identification' },
  { id: 'local-20', description: 'Passport Seva', rate: 0, category: 'Citizen Services & Identification' },
  { id: 'local-21', description: 'UIDAI (Aadhaar Services) Portal', rate: 0, category: 'Citizen Services & Identification' },
  { id: 'local-22', description: "NVSP (National Voter's Service Portal)", rate: 0, category: 'Citizen Services & Identification' },
  { id: 'local-23', description: 'Civil Registration System (CRS - Birth/Death)', rate: 0, category: 'Citizen Services & Identification' },
  { id: 'local-24', description: 'e-Courts Services', rate: 0, category: 'Citizen Services & Identification' },
  { id: 'local-25', description: 'e-District (State-specific citizen services, e.g., e-District Kerala)', rate: 0, category: 'Citizen Services & Identification' },
  { id: 'local-26', description: 'National Scholarship Portal (NSP)', rate: 0, category: 'Education, Skills & Employment' },
  { id: 'local-27', description: 'Skill India Digital', rate: 0, category: 'Education, Skills & Employment' },
  { id: 'local-28', description: 'National Career Service (NCS)', rate: 0, category: 'Education, Skills & Employment' },
  { id: 'local-29', description: 'Apprenticeship India Portal', rate: 0, category: 'Education, Skills & Employment' },
  { id: 'local-30', description: 'SWAYAM Portal', rate: 0, category: 'Education, Skills & Employment' },
  { id: 'local-31', description: 'e-Shram Portal', rate: 0, category: 'Social Security & Welfare' },
  { id: 'local-32', description: 'UMANG', rate: 0, category: 'Social Security & Welfare' },
  { id: 'local-33', description: 'EPFO Member Portal', rate: 0, category: 'Social Security & Welfare' },
  { id: 'local-34', description: 'Jeevan Pramaan (Digital Life Certificate)', rate: 0, category: 'Social Security & Welfare' },
  { id: 'local-35', description: 'MyScheme Portal', rate: 0, category: 'Social Security & Welfare' },
  { id: 'local-36', description: 'PM-KISAN Portal', rate: 0, category: 'Agriculture & Rural Development' },
  { id: 'local-37', description: 'e-NAM (National Agriculture Market)', rate: 0, category: 'Agriculture & Rural Development' },
  { id: 'local-38', description: 'NREGA (MGNREGA) Portal', rate: 0, category: 'Agriculture & Rural Development' },
  { id: 'local-39', description: 'Kisan Suvidha', rate: 0, category: 'Agriculture & Rural Development' },
  { id: 'local-40', description: 'Ayushman Bharat (PM-JAY)', rate: 0, category: 'Health & Housing' },
  { id: 'local-41', description: 'CoWIN', rate: 0, category: 'Health & Housing' },
  { id: 'local-42', description: 'e-Sanjeevani', rate: 0, category: 'Health & Housing' },
  { id: 'local-43', description: 'PMAY (Pradhan Mantri Awas Yojana) Portal', rate: 0, category: 'Health & Housing' },
]

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

function mapRow(row) {
  return {
    id: row.id,
    description: row.description,
    rate: Number(row.rate) || 0,
    category: row.category || '',
  }
}

function tableMissingError(error) {
  return (
    error?.code === 'PGRST205' ||
    String(error?.message || '').toLowerCase().includes('could not find the table') ||
    String(error?.message || '').toLowerCase().includes('schema cache')
  )
}

export async function fetchServiceItems({ allowFallback = true } = {}) {
  if (!isSupabaseConfigured || !supabase) {
    if (allowFallback) return FALLBACK_SERVICE_ITEMS
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase
    .from('service_items')
    .select('id, description, rate, category')
    .order('category', { ascending: true })
    .order('description', { ascending: true })

  if (error) {
    if (allowFallback) {
      console.warn('service_items fetch failed, using fallback catalog:', error.message)
      return FALLBACK_SERVICE_ITEMS
    }
    if (tableMissingError(error)) {
      throw new Error('Services table not found. Run supabase/service_items.sql in the Supabase SQL Editor.')
    }
    throw error
  }

  return (data || []).map(mapRow)
}

export async function createServiceItem({ description, rate = 0, category = '' }) {
  const client = requireSupabase()
  const desc = String(description || '').trim()
  if (!desc) throw new Error('Description is required.')

  const payload = {
    description: desc,
    rate: Math.max(0, Number(rate) || 0),
    category: String(category || '').trim() || null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await client
    .from('service_items')
    .insert(payload)
    .select('id, description, rate, category')
    .single()

  if (error) {
    if (tableMissingError(error)) {
      throw new Error('Services table not found. Run supabase/service_items.sql in the Supabase SQL Editor.')
    }
    if (error.code === '23505' || String(error.message || '').toLowerCase().includes('duplicate')) {
      throw new Error('A service with this description already exists.')
    }
    throw error
  }

  return mapRow(data)
}

export async function updateServiceItem(id, { description, rate, category }) {
  const client = requireSupabase()
  if (!id) throw new Error('Service id is required.')

  const desc = String(description || '').trim()
  if (!desc) throw new Error('Description is required.')

  const payload = {
    description: desc,
    rate: Math.max(0, Number(rate) || 0),
    category: String(category || '').trim() || null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await client
    .from('service_items')
    .update(payload)
    .eq('id', id)
    .select('id, description, rate, category')
    .single()

  if (error) {
    if (tableMissingError(error)) {
      throw new Error('Services table not found. Run supabase/service_items.sql in the Supabase SQL Editor.')
    }
    if (error.code === '23505' || String(error.message || '').toLowerCase().includes('duplicate')) {
      throw new Error('A service with this description already exists.')
    }
    throw error
  }

  return mapRow(data)
}

export async function deleteServiceItem(id) {
  const client = requireSupabase()
  if (!id) throw new Error('Service id is required.')

  const { data, error } = await client
    .from('service_items')
    .delete()
    .eq('id', id)
    .select('id')

  if (error) {
    if (tableMissingError(error)) {
      throw new Error('Services table not found. Run supabase/service_items.sql in the Supabase SQL Editor.')
    }
    throw error
  }

  if (!data?.length) {
    throw new Error('Service was not deleted. Check delete permissions in Supabase.')
  }

  return true
}

export async function deleteServiceItems(ids = []) {
  const client = requireSupabase()
  const uniqueIds = [...new Set((ids || []).filter(Boolean))]
  if (!uniqueIds.length) throw new Error('No services selected.')

  const { data, error } = await client
    .from('service_items')
    .delete()
    .in('id', uniqueIds)
    .select('id')

  if (error) {
    if (tableMissingError(error)) {
      throw new Error('Services table not found. Run supabase/service_items.sql in the Supabase SQL Editor.')
    }
    throw error
  }

  if (!data?.length) {
    throw new Error('Services were not deleted. Check delete permissions in Supabase.')
  }

  return data.map((row) => row.id)
}

/** Persist rate for an existing catalog description (no-op if table missing). */
export async function updateServiceItemRate(description, rate) {
  if (!isSupabaseConfigured || !supabase) return null
  const desc = String(description || '').trim()
  if (!desc) return null

  const numericRate = Math.max(0, Number(rate) || 0)

  const { data: existing, error: findError } = await supabase
    .from('service_items')
    .select('id')
    .ilike('description', desc)
    .limit(1)

  if (findError) {
    console.warn('service_items lookup failed:', findError.message)
    return null
  }

  if (!existing?.length) return null

  const { data, error } = await supabase
    .from('service_items')
    .update({ rate: numericRate, updated_at: new Date().toISOString() })
    .eq('id', existing[0].id)
    .select('id, description, rate, category')
    .single()

  if (error) {
    console.warn('service_items rate update failed:', error.message)
    return null
  }

  return mapRow(data)
}
