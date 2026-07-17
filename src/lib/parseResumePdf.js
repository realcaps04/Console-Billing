import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { createEmptyResume } from './resumes'
import { formatIndianPhone, extractIndianMobileDigits } from '../utils'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\/?/i
const URL_RE = /(?:https?:\/\/)?(?:www\.)?[A-Za-z0-9][-A-Za-z0-9.]*\.[A-Za-z]{2,}(?:\/[^\s|]*)?/i
const PHONE_RE = /(?:\+?91[\s-]*)?(?:\d[\s-]*){10}|\+?\d[\d\s().-]{8,}\d/
const YEAR_RE = /\b((?:19|20)\d{2})\b/g

const SECTION_ALIASES = [
  { key: 'summary', labels: ['professional summary', 'career summary', 'profile', 'about me', 'objective', 'summary'] },
  { key: 'skills', labels: ['technical skills', 'key skills', 'core competencies', 'skills', 'technologies', 'tech stack'] },
  { key: 'experience', labels: ['work experience', 'professional experience', 'employment history', 'experience', 'work history'] },
  { key: 'projects', labels: ['personal projects', 'key projects', 'projects', 'project experience'] },
  { key: 'education', labels: ['academic background', 'education', 'academics', 'qualifications'] },
  { key: 'certifications', labels: ['certifications', 'certificates', 'licenses', 'achievements'] },
  { key: 'languages', labels: ['languages', 'language proficiency'] },
  { key: 'declaration', labels: ['declaration', 'disclaimer'] },
]

function normalizeLines(text) {
  return String(text || '')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function looksLikeSectionHeader(line) {
  const cleaned = line.replace(/[:|•\-–—]+$/g, '').trim()
  if (!cleaned || cleaned.length > 48) return null
  const lower = cleaned.toLowerCase()
  for (const section of SECTION_ALIASES) {
    for (const label of section.labels) {
      if (lower === label || lower === `${label}:`) return section.key
    }
  }
  // ALL CAPS short headers
  if (/^[A-Z][A-Z\s/&-]{2,40}$/.test(cleaned)) {
    const lowerCaps = cleaned.toLowerCase()
    for (const section of SECTION_ALIASES) {
      for (const label of section.labels) {
        if (lowerCaps === label) return section.key
      }
    }
  }
  return null
}

function splitSections(lines) {
  const sections = { header: [], summary: [], skills: [], experience: [], projects: [], education: [], certifications: [], languages: [] }
  let current = 'header'
  for (const line of lines) {
    const key = looksLikeSectionHeader(line)
    if (key) {
      if (key === 'declaration') {
        current = null
        continue
      }
      current = key
      continue
    }
    if (!current) continue
    sections[current].push(line)
  }
  return sections
}

function uniqueNonEmpty(list) {
  const seen = new Set()
  const out = []
  for (const item of list) {
    const v = String(item || '').trim()
    if (!v) continue
    const key = v.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(v)
  }
  return out
}

function extractContacts(text, lines) {
  const emailMatch = text.match(EMAIL_RE)
  const linkedinMatch = text.match(LINKEDIN_RE)

  let phone = ''
  const phoneMatches = text.match(new RegExp(PHONE_RE.source, 'g')) || []
  for (const candidate of phoneMatches) {
    const digits = extractIndianMobileDigits(candidate)
    if (/^[6-9]\d{9}$/.test(digits)) {
      phone = formatIndianPhone(digits)
      break
    }
  }

  let portfolio = ''
  const urlMatches = text.match(new RegExp(URL_RE.source, 'gi')) || []
  for (const raw of urlMatches) {
    if (/linkedin\.com/i.test(raw) || EMAIL_RE.test(raw)) continue
    portfolio = raw.replace(/[),.;]+$/g, '')
    break
  }

  // Location: header line with city-like text, no email/phone
  let location = ''
  for (const line of lines.slice(0, 8)) {
    if (EMAIL_RE.test(line) || LINKEDIN_RE.test(line) || /@/.test(line)) continue
    if (PHONE_RE.test(line) && extractIndianMobileDigits(line).length >= 10) continue
    if (/skills|experience|education|summary/i.test(line)) continue
    if (/,/.test(line) && line.length < 60 && /[A-Za-z]{3,}/.test(line)) {
      location = line.replace(/[|•]+/g, ',').replace(/\s*,\s*/g, ', ').trim()
      break
    }
  }

  return {
    email: emailMatch?.[0] || '',
    phone,
    linkedin: linkedinMatch?.[0]?.replace(/\/$/, '') || '',
    portfolio,
    location,
  }
}

function guessNameAndHeadline(headerLines, contacts) {
  const skip = (line) =>
    !line ||
    EMAIL_RE.test(line) ||
    LINKEDIN_RE.test(line) ||
    URL_RE.test(line) ||
    (PHONE_RE.test(line) && extractIndianMobileDigits(line).length >= 10) ||
    line === contacts.location

  const candidates = headerLines.filter((line) => !skip(line))
  let fullName = ''
  let headline = ''

  for (const line of candidates.slice(0, 4)) {
    const words = line.split(/\s+/).filter(Boolean)
    const isNameLike =
      words.length >= 2 &&
      words.length <= 5 &&
      words.every((w) => /^[A-Za-z][A-Za-z'.-]*$/.test(w)) &&
      line.length <= 48
    if (!fullName && isNameLike) {
      fullName = line
      continue
    }
    if (fullName && !headline && line.length <= 80) {
      headline = line
      break
    }
  }

  if (!fullName && candidates[0]) fullName = candidates[0].slice(0, 60)
  if (!headline && candidates[1] && candidates[1] !== fullName) headline = candidates[1].slice(0, 80)

  return { fullName, headline }
}

function parseListItems(lines) {
  const joined = lines.join('\n')
  const byBullet = joined
    .split(/(?:^|\n)\s*[-•●▪◦*]+\s+|,\s+(?=[A-Z])|\||;/)
    .map((s) => s.trim())
    .filter((s) => s && s.length < 60)
  if (byBullet.length >= 2) return uniqueNonEmpty(byBullet)

  const byComma = lines
    .join(' ')
    .split(/[,|•]/)
    .map((s) => s.trim())
    .filter((s) => s && s.length < 40)
  return uniqueNonEmpty(byComma.length ? byComma : lines)
}

function parseExperienceBlocks(lines) {
  if (!lines.length) return []
  const blocks = []
  let current = []

  const startsNew = (line) => {
    const years = [...line.matchAll(YEAR_RE)].map((m) => m[1])
    if (years.length >= 1 && /[-–—]|to|present|current/i.test(line) && line.length < 90) return true
    if (/^[A-Z][\w .,&/-]{2,50}$/.test(line) && current.length >= 2) return true
    return false
  }

  for (const line of lines) {
    if (current.length && startsNew(line) && current.length >= 2) {
      blocks.push(current)
      current = [line]
    } else {
      current.push(line)
    }
  }
  if (current.length) blocks.push(current)

  return blocks.slice(0, 6).map((block, index) => {
    const dateLine = block.find((l) => YEAR_RE.test(l) && /[-–—]|to|present|current/i.test(l)) || ''
    const years = [...dateLine.matchAll(YEAR_RE)].map((m) => m[1])
    const currentRole = /present|current/i.test(dateLine)
    const titleLines = block.filter((l) => l !== dateLine).slice(0, 2)
    const details = block
      .filter((l) => l !== dateLine && !titleLines.includes(l))
      .join('\n')
      .trim()

    return {
      id: Date.now() + index,
      company: titleLines[1] || titleLines[0] || '',
      role: titleLines[0] || '',
      startDate: years[0] || '',
      endDate: currentRole ? '' : years[1] || years[0] || '',
      current: currentRole,
      dateMode: 'year',
      details,
    }
  })
}

function parseEducationBlocks(lines) {
  if (!lines.length) return []
  const blocks = []
  let current = []
  for (const line of lines) {
    if (current.length && (/university|college|school|institute|bachelor|master|b\.?tech|m\.?tech|degree/i.test(line) || YEAR_RE.test(line)) && current.length >= 2) {
      blocks.push(current)
      current = [line]
    } else {
      current.push(line)
    }
  }
  if (current.length) blocks.push(current)

  return blocks.slice(0, 4).map((block, index) => {
    const yearLine = block.find((l) => YEAR_RE.test(l)) || ''
    const years = [...yearLine.matchAll(YEAR_RE)].map((m) => m[1])
    const others = block.filter((l) => l !== yearLine)
    return {
      id: Date.now() + 100 + index,
      school: others[1] || others[0] || '',
      degree: others[0] || '',
      year: years[years.length - 1] || '',
      details: others.slice(2).join(' ').trim(),
    }
  })
}

function parseProjectBlocks(lines) {
  if (!lines.length) return []
  const chunks = []
  let current = []
  for (const line of lines) {
    if (current.length && (/^[-•]/.test(line) === false) && line.length < 70 && current.length >= 2) {
      chunks.push(current)
      current = [line]
    } else {
      current.push(line)
    }
  }
  if (current.length) chunks.push(current)

  return chunks.slice(0, 5).map((block, index) => {
    const link = block.find((l) => URL_RE.test(l) && !EMAIL_RE.test(l)) || ''
    const name = block.find((l) => l !== link) || ''
    const details = block.filter((l) => l !== name && l !== link).join('\n').trim()
    return {
      id: Date.now() + 200 + index,
      name: name.replace(/^[-•\s]+/, ''),
      link: link.replace(/[),.;]+$/g, ''),
      details,
    }
  })
}

export async function extractPdfText(file) {
  const data = new Uint8Array(await file.arrayBuffer())
  const loadingTask = pdfjsLib.getDocument({ data })
  const pdf = await loadingTask.promise
  const pages = []

  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    let pageText = ''
    let lastY = null

    for (const item of content.items) {
      if (!('str' in item) || !item.str) continue
      const y = Array.isArray(item.transform) ? item.transform[5] : null
      if (lastY !== null && y !== null && Math.abs(lastY - y) > 2) {
        pageText += '\n'
      } else if (pageText && !pageText.endsWith('\n') && !pageText.endsWith(' ')) {
        pageText += ' '
      }
      pageText += item.str
      if (y !== null) lastY = y
    }

    pages.push(pageText)
  }

  return pages.join('\n')
}

export function parseResumeText(rawText, { category = 'IT' } = {}) {
  const empty = createEmptyResume()
  const text = String(rawText || '').trim()
  if (!text) {
    throw new Error('No readable text found in this PDF. Try a text-based resume PDF (not a scanned image).')
  }

  const lines = normalizeLines(text)
  const sections = splitSections(lines)
  const contacts = extractContacts(text, lines)
  const { fullName, headline } = guessNameAndHeadline(sections.header, contacts)

  const skills = parseListItems(sections.skills)
  const languages = parseListItems(sections.languages).map((name, index) => ({
    id: Date.now() + 300 + index,
    name,
    read: true,
    write: true,
    speak: true,
  }))
  const certifications = parseListItems(sections.certifications)
  const experience = parseExperienceBlocks(sections.experience)
  const education = parseEducationBlocks(sections.education)
  const projects = parseProjectBlocks(sections.projects)
  const summary = sections.summary.join(' ').replace(/\s+/g, ' ').trim()

  return {
    ...empty,
    id: null,
    category,
    fullName,
    headline,
    email: contacts.email,
    phone: contacts.phone,
    location: contacts.location,
    linkedin: contacts.linkedin,
    portfolio: contacts.portfolio,
    summary,
    skills: skills.length ? skills : [''],
    languages: languages.length ? languages : createEmptyResume().languages,
    certifications: certifications.length ? certifications : [''],
    experience: experience.length ? experience : empty.experience,
    education: education.length ? education : empty.education,
    projects: projects.length ? projects : empty.projects,
  }
}

export async function parseResumePdfFile(file, options = {}) {
  if (!file) throw new Error('Choose a PDF file first.')
  const name = String(file.name || '').toLowerCase()
  const type = String(file.type || '')
  if (!name.endsWith('.pdf') && type !== 'application/pdf') {
    throw new Error('Please upload a PDF file.')
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('PDF is too large. Upload a file under 8 MB.')
  }

  const text = await extractPdfText(file)
  return parseResumeText(text, options)
}
