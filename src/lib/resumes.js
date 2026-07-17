import { supabase, isSupabaseConfigured } from './supabase'
import { getEmailError, getIndianPhoneError } from '../utils'

export const RESUME_CATEGORIES = [
  'Banking',
  'IT',
  'Healthcare',
  'Education',
  'Marketing',
  'Finance',
  'Engineering',
  'Hospitality',
  'Government',
  'Other',
]

/** Footer declarations shown on the resume PDF, keyed by category. */
export const RESUME_DECLARATIONS = {
  Banking:
    'I hereby declare that the particulars furnished above are true and correct to the best of my knowledge. I understand that any false information may lead to rejection or termination of employment. I am willing to undergo background verification, credit checks, and KYC as required by the bank / financial institution.',
  IT:
    'I hereby declare that the information provided in this resume is true and complete to the best of my knowledge. I understand that any misrepresentation may result in disqualification or termination of employment. I am open to technical assessments and background verification as required.',
  Healthcare:
    'I hereby declare that the particulars given above are true and correct. I affirm that I will uphold patient confidentiality, professional ethics, and applicable healthcare regulations. I consent to credential verification and background checks as required by the employer.',
  Education:
    'I hereby declare that the information stated above is true and correct to the best of my knowledge. I affirm my commitment to professional teaching standards and am willing to undergo verification of academic credentials and character as required by the institution.',
  Marketing:
    'I hereby declare that the details furnished in this resume are true and accurate to the best of my knowledge. I understand that any false information may lead to rejection of my application or termination of employment if discovered later.',
  Finance:
    'I hereby declare that the information provided is true and correct to the best of my knowledge. I understand the importance of integrity in financial roles and consent to background verification, reference checks, and any regulatory screening required by the organization.',
  Engineering:
    'I hereby declare that the particulars furnished above are true and correct to the best of my knowledge. I am willing to undergo verification of qualifications, experience, and any technical assessments required for the engineering role applied for.',
  Hospitality:
    'I hereby declare that the information given above is true and correct. I affirm my commitment to guest service standards, workplace hygiene, and professional conduct, and consent to background verification as required by the employer.',
  Government:
    'I hereby declare that all the information furnished in this resume is true, complete, and correct to the best of my knowledge and belief. I understand that any willful misstatement or suppression of facts may render me liable for rejection of candidature or dismissal from service, if appointed.',
  Other:
    'I hereby declare that the information provided in this resume is true and correct to the best of my knowledge. I understand that any false or misleading information may lead to rejection of my application or termination of employment.',
}

export function getResumeDeclaration(category) {
  const key = String(category || '').trim()
  return RESUME_DECLARATIONS[key] || RESUME_DECLARATIONS.Other
}

function trim(value) {
  return String(value ?? '').trim()
}

function getRequiredError(value, label) {
  return trim(value) ? '' : `${label} is required.`
}

function getUrlError(value, label = 'URL') {
  const v = trim(value)
  if (!v) return ''
  try {
    const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`
    const u = new URL(withProto)
    if (!u.hostname || !u.hostname.includes('.')) return `Enter a valid ${label}.`
    return ''
  } catch {
    return `Enter a valid ${label}.`
  }
}

function getLinkedInError(value) {
  const v = trim(value)
  if (!v) return ''
  if (/^https?:\/\//i.test(v) && !/linkedin\.com/i.test(v)) {
    return 'Enter a LinkedIn profile URL.'
  }
  if (/linkedin\.com/i.test(v) && !/linkedin\.com\/in\//i.test(v)) {
    return 'Use a profile link like linkedin.com/in/your-name.'
  }
  return ''
}

function getYearError(value, { required = false, label = 'Year' } = {}) {
  const v = trim(value)
  if (!v) return required ? `${label} is required.` : ''
  if (!/^(19|20)\d{2}$/.test(v)) return 'Use a 4-digit year (e.g. 2024).'
  return ''
}

function entryHasContent(item, keys) {
  return keys.some((key) => trim(item?.[key]))
}

/**
 * Field-level validation for the resume builder.
 * Returns an object of error messages; empty string / missing key means valid.
 */
export function getResumeValidationErrors(state) {
  const errors = {
    fullName: getRequiredError(state.fullName, 'Full name'),
    category: RESUME_CATEGORIES.includes(trim(state.category))
      ? ''
      : 'Select a category.',
    headline: getRequiredError(state.headline, 'Headline'),
    email: getEmailError(state.email, { required: true }),
    phone: getIndianPhoneError(state.phone, { required: true }),
    location: getRequiredError(state.location, 'Location'),
    linkedin: getLinkedInError(state.linkedin),
    portfolio: getUrlError(state.portfolio, 'website URL'),
    summary: (() => {
      const v = trim(state.summary)
      if (!v) return 'Professional summary is required.'
      if (v.length < 30) return 'Summary should be at least 30 characters.'
      return ''
    })(),
    skills: {},
    experience: {},
    education: {},
    projects: {},
    certifications: {},
    languages: {},
  }

  const skills = Array.isArray(state.skills) ? state.skills : []
  const filledSkills = skills.map((s) => trim(s)).filter(Boolean)
  if (!filledSkills.length) {
    errors.skills._section = 'Add at least one skill.'
  }
  skills.forEach((skill, index) => {
    if (skills.length === 1 && !trim(skill)) {
      errors.skills[index] = 'Skill is required.'
    } else if (trim(skill) && trim(skill).length < 2) {
      errors.skills[index] = 'Enter a valid skill.'
    }
  })

  const experience = Array.isArray(state.experience) ? state.experience : []
  const filledExperience = experience.filter((item) =>
    entryHasContent(item, ['company', 'role', 'startDate', 'endDate', 'details']),
  )
  if (!filledExperience.length) {
    errors.experience._section = 'Add at least one experience entry.'
  }
  experience.forEach((item) => {
    const touched = entryHasContent(item, ['company', 'role', 'startDate', 'endDate', 'details']) || filledExperience.length === 0
    if (!touched && filledExperience.length) return
    const row = {
      company: getRequiredError(item.company, 'Company'),
      role: getRequiredError(item.role, 'Role'),
      startDate: getYearError(item.startDate, { required: true, label: 'Start year' }),
      endDate: item.current
        ? ''
        : getYearError(item.endDate, { required: true, label: 'End year' }),
      details: getRequiredError(item.details, 'Details'),
    }
    if (Object.values(row).some(Boolean)) errors.experience[item.id] = row
  })

  const education = Array.isArray(state.education) ? state.education : []
  const filledEducation = education.filter((item) =>
    entryHasContent(item, ['school', 'degree', 'year', 'details']),
  )
  if (!filledEducation.length) {
    errors.education._section = 'Add at least one education entry.'
  }
  education.forEach((item) => {
    const touched = entryHasContent(item, ['school', 'degree', 'year', 'details']) || filledEducation.length === 0
    if (!touched && filledEducation.length) return
    const row = {
      school: getRequiredError(item.school, 'School'),
      degree: getRequiredError(item.degree, 'Degree'),
      year: getYearError(item.year, { required: true, label: 'Year' }),
      details: '',
    }
    if (Object.values(row).some(Boolean)) errors.education[item.id] = row
  })

  const projects = Array.isArray(state.projects) ? state.projects : []
  projects.forEach((item) => {
    const touched = entryHasContent(item, ['name', 'link', 'details'])
    if (!touched) return
    const row = {
      name: getRequiredError(item.name, 'Project name'),
      link: getUrlError(item.link, 'project link'),
      details: getRequiredError(item.details, 'Details'),
    }
    if (Object.values(row).some(Boolean)) errors.projects[item.id] = row
  })

  const certifications = Array.isArray(state.certifications) ? state.certifications : []
  certifications.forEach((item, index) => {
    if (trim(item) && trim(item).length < 2) {
      errors.certifications[index] = 'Enter a valid certification.'
    }
  })

  const languages = Array.isArray(state.languages) ? state.languages : []
  const filledLanguages = languages.map((s) => trim(s)).filter(Boolean)
  if (!filledLanguages.length) {
    errors.languages._section = 'Add at least one language.'
  }
  languages.forEach((item, index) => {
    if (languages.length === 1 && !trim(item)) {
      errors.languages[index] = 'Language is required.'
    } else if (trim(item) && trim(item).length < 2) {
      errors.languages[index] = 'Enter a valid language.'
    }
  })

  return errors
}

export function hasResumeValidationErrors(errors) {
  if (!errors) return false
  const topKeys = ['fullName', 'category', 'headline', 'email', 'phone', 'location', 'linkedin', 'portfolio', 'summary']
  if (topKeys.some((key) => errors[key])) return true
  for (const section of ['skills', 'certifications', 'languages']) {
    const bag = errors[section] || {}
    if (Object.values(bag).some(Boolean)) return true
  }
  for (const section of ['experience', 'education', 'projects']) {
    const bag = errors[section] || {}
    if (bag._section) return true
    for (const row of Object.values(bag)) {
      if (row && typeof row === 'object' && Object.values(row).some(Boolean)) return true
    }
  }
  return false
}

export function createEmptyResume() {
  return {
    id: null,
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    portfolio: '',
    category: 'IT',
    headline: '',
    summary: '',
    skills: [''],
    experience: [
      { id: Date.now(), company: '', role: '', startDate: '', endDate: '', current: false, details: '' },
    ],
    education: [
      { id: Date.now() + 1, school: '', degree: '', year: '', details: '' },
    ],
    certifications: [''],
    languages: [''],
    projects: [
      { id: Date.now() + 2, name: '', link: '', details: '' },
    ],
  }
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

function cleanList(list) {
  return (Array.isArray(list) ? list : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
}

function mapRow(row) {
  return {
    id: row.id,
    fullName: row.full_name || '',
    email: row.email || '',
    phone: row.phone || '',
    location: row.location || '',
    linkedin: row.linkedin || '',
    portfolio: row.portfolio || '',
    category: row.category || 'IT',
    headline: row.headline || '',
    summary: row.summary || '',
    skills: Array.isArray(row.skills) && row.skills.length ? row.skills : [''],
    experience: Array.isArray(row.experience) && row.experience.length
      ? row.experience
      : createEmptyResume().experience,
    education: Array.isArray(row.education) && row.education.length
      ? row.education
      : createEmptyResume().education,
    certifications: Array.isArray(row.certifications) && row.certifications.length
      ? row.certifications
      : [''],
    languages: Array.isArray(row.languages) && row.languages.length
      ? row.languages
      : [''],
    projects: Array.isArray(row.projects) && row.projects.length
      ? row.projects
      : createEmptyResume().projects,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapStateToRow(state) {
  const fullName = String(state.fullName || '').trim()
  if (!fullName) throw new Error('Full name is required.')

  return {
    full_name: fullName,
    email: String(state.email || '').trim() || null,
    phone: String(state.phone || '').trim() || null,
    location: String(state.location || '').trim() || null,
    linkedin: String(state.linkedin || '').trim() || null,
    portfolio: String(state.portfolio || '').trim() || null,
    category: String(state.category || 'IT').trim() || 'IT',
    headline: String(state.headline || '').trim() || null,
    summary: String(state.summary || '').trim() || null,
    skills: cleanList(state.skills),
    experience: (Array.isArray(state.experience) ? state.experience : [])
      .map((item) => ({
        id: item.id || Date.now(),
        company: String(item.company || '').trim(),
        role: String(item.role || '').trim(),
        startDate: String(item.startDate || '').trim(),
        endDate: item.current ? '' : String(item.endDate || '').trim(),
        current: Boolean(item.current),
        details: String(item.details || '').trim(),
      }))
      .filter((item) => item.company || item.role || item.details),
    education: (Array.isArray(state.education) ? state.education : [])
      .map((item) => ({
        id: item.id || Date.now(),
        school: String(item.school || '').trim(),
        degree: String(item.degree || '').trim(),
        year: String(item.year || '').trim(),
        details: String(item.details || '').trim(),
      }))
      .filter((item) => item.school || item.degree),
    certifications: cleanList(state.certifications),
    languages: cleanList(state.languages),
    projects: (Array.isArray(state.projects) ? state.projects : [])
      .map((item) => ({
        id: item.id || Date.now(),
        name: String(item.name || '').trim(),
        link: String(item.link || '').trim(),
        details: String(item.details || '').trim(),
      }))
      .filter((item) => item.name || item.details),
    updated_at: new Date().toISOString(),
  }
}

function tableMissingError(error) {
  return (
    error?.code === 'PGRST205' ||
    String(error?.message || '').toLowerCase().includes('could not find the table') ||
    String(error?.message || '').toLowerCase().includes('schema cache')
  )
}

export async function fetchResumes({ category = 'all', limit = 50 } = {}) {
  const client = requireSupabase()
  let query = client
    .from('resumes')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error) {
    if (tableMissingError(error)) {
      throw new Error('Resumes table not found. Run supabase/resumes.sql in the Supabase SQL Editor.')
    }
    throw error
  }
  return (data || []).map(mapRow)
}

export async function saveResume(state) {
  const client = requireSupabase()
  const row = mapStateToRow(state)

  if (state.id) {
    const { data, error } = await client
      .from('resumes')
      .update(row)
      .eq('id', state.id)
      .select('*')
      .single()

    if (error) {
      if (tableMissingError(error)) {
        throw new Error('Resumes table not found. Run supabase/resumes.sql in the Supabase SQL Editor.')
      }
      throw error
    }
    return mapRow(data)
  }

  const { data, error } = await client
    .from('resumes')
    .insert(row)
    .select('*')
    .single()

  if (error) {
    if (tableMissingError(error)) {
      throw new Error('Resumes table not found. Run supabase/resumes.sql in the Supabase SQL Editor.')
    }
    throw error
  }
  return mapRow(data)
}

export async function deleteResume(id) {
  const client = requireSupabase()
  if (!id) throw new Error('Resume id is required.')

  const { data, error } = await client
    .from('resumes')
    .delete()
    .eq('id', id)
    .select('id')

  if (error) {
    if (tableMissingError(error)) {
      throw new Error('Resumes table not found. Run supabase/resumes.sql in the Supabase SQL Editor.')
    }
    throw error
  }
  if (!data?.length) throw new Error('Resume was not deleted.')
  return true
}
