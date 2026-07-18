import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { sanitizeInvoiceNumber, generateInvoiceNumber } from '../utils'
import {
  formatExperienceDateRange,
  formatLanguageLabel,
  getResumeDeclaration,
  normalizeLanguages,
} from './resumes'

async function buildInvoicePdf(element, invoiceState) {
  if (!element) throw new Error('Invoice preview is not ready.')

  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })

  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 8

  const imgW = pageW - margin * 2
  const imgH = (canvas.height * imgW) / canvas.width

  let remainingH = imgH

  pdf.addImage(imgData, 'PNG', margin, margin, imgW, imgH, undefined, 'FAST')
  remainingH -= (pageH - margin * 2)

  while (remainingH > 0) {
    pdf.addPage()
    const y = margin - (imgH - remainingH)
    pdf.addImage(imgData, 'PNG', margin, y, imgW, imgH, undefined, 'FAST')
    remainingH -= (pageH - margin * 2)
  }

  const safeInvoice =
    sanitizeInvoiceNumber(invoiceState?.invoiceNumber) ||
    generateInvoiceNumber(invoiceState?.issueDate)

  return { pdf, filename: `ConsoleProjects_${safeInvoice}.pdf` }
}

export async function downloadInvoicePdf(element, invoiceState) {
  const { pdf, filename } = await buildInvoicePdf(element, invoiceState)
  pdf.save(filename)
}

/** Open the generated PDF in a new browser tab (view only). */
export async function viewInvoicePdf(element, invoiceState) {
  const { pdf } = await buildInvoicePdf(element, invoiceState)
  openPdfBlob(pdf)
}

function cleanList(list) {
  return (Array.isArray(list) ? list : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
}

function openPdfBlob(pdf) {
  const blob = pdf.output('blob')
  const url = URL.createObjectURL(blob)
  const opened = window.open(url, '_blank')
  if (opened) {
    try {
      opened.opener = null
    } catch {
      // ignore
    }
  } else {
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function resumeFilename(resumeState) {
  const safeName = String(resumeState?.fullName || 'Resume')
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_') || 'Resume'
  const category = String(resumeState?.category || 'General').replace(/\s+/g, '_')
  return `Resume_${safeName}_${category}.pdf`
}

/**
 * Build a neat, single-page, ATS-friendly text PDF.
 * Uses real selectable text (not an image) and scales content to fit one A4 page.
 */
function buildResumeTextPdf(resumeState) {
  const state = resumeState || {}
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const marginX = 14
  const marginTop = 12
  const marginBottom = 12
  const contentW = pageW - marginX * 2
  const usableH = pageH - marginTop - marginBottom
  const rightX = pageW - marginX

  // Consistent spacing scale (mm at scale=1)
  const SP = {
    nameToHeadline: 1.2,
    headlineToContact: 1.0,
    contactLine: 3.4,
    afterHeaderRule: 3.6,
    sectionGap: 3.8,
    titleToRule: 1.15,
    ruleToBody: 4.2,
    bodyLine: 3.55,
    entryTitleLine: 3.5,
    entryMetaLine: 3.35,
    afterEntryTitle: 0.35,
    beforeBullets: 0.9,
    bulletLine: 3.4,
    entryGap: 2.6,
    beforeSign: 3.2,
  }

  const ink = [15, 23, 42]
  const muted = [51, 65, 85]
  const soft = [100, 116, 139]
  const rule = [203, 213, 225]

  const skills = cleanList(state.skills)
  const certifications = cleanList(state.certifications)
  const languages = normalizeLanguages(state.languages)
    .map(formatLanguageLabel)
    .filter(Boolean)
  const experience = (state.experience || []).filter((e) => e.company || e.role || e.details)
  const education = (state.education || []).filter((e) => e.school || e.degree)
  const projects = (state.projects || []).filter((p) => p.name || p.details)
  const contactParts = [
    state.email,
    state.phone,
    state.location,
    state.linkedin,
    state.portfolio,
  ].filter(Boolean)
  const declaration = getResumeDeclaration(state.category)
  const signName = String(state.fullName || '').trim()

  const measureOrDraw = (scale, draw) => {
    let y = marginTop
    let sectionOpen = false
    const s = (n) => n * scale

    const setType = (size, style = 'normal', color = ink) => {
      pdf.setFont('helvetica', style)
      pdf.setFontSize(s(size))
      pdf.setTextColor(...color)
    }

    const writeBlock = (value, {
      x = marginX,
      width = contentW,
      size = 8.2,
      style = 'normal',
      color = ink,
      lineH = SP.bodyLine,
    } = {}) => {
      setType(size, style, color)
      const lines = pdf.splitTextToSize(String(value || '').trim(), width)
      lines.forEach((line) => {
        if (draw) pdf.text(line, x, y)
        y += s(lineH)
      })
      return lines.length
    }

    const writeLeftRight = (left, right, {
      leftSize = 8.5,
      rightSize = 7.2,
      leftStyle = 'bold',
      leftColor = ink,
      rightColor = soft,
      lineH = SP.entryTitleLine,
    } = {}) => {
      setType(rightSize, 'normal', rightColor)
      let rightText = String(right || '').trim()
      let rightW = rightText ? pdf.getTextWidth(rightText) : 0
      const maxRight = contentW * 0.34
      if (rightText && rightW > maxRight) {
        while (rightText.length > 8 && pdf.getTextWidth(`${rightText}…`) > maxRight) {
          rightText = rightText.slice(0, -1)
        }
        rightText = `${rightText}…`
        rightW = pdf.getTextWidth(rightText)
      }

      const gap = rightText ? s(4) : 0
      const leftMax = Math.max(contentW - rightW - gap, contentW * 0.6)
      setType(leftSize, leftStyle, leftColor)
      const leftLines = pdf.splitTextToSize(String(left || '').trim(), leftMax)

      leftLines.forEach((line, index) => {
        if (draw) {
          setType(leftSize, leftStyle, leftColor)
          pdf.text(line, marginX, y)
          if (index === 0 && rightText) {
            setType(rightSize, 'normal', rightColor)
            pdf.text(rightText, rightX - rightW, y)
          }
        }
        y += s(lineH)
      })
    }

    const beginSection = (title) => {
      if (sectionOpen) y += s(SP.sectionGap)
      sectionOpen = true

      setType(7.2, 'bold', ink)
      const label = String(title || '').toUpperCase()
      if (draw) pdf.text(label, marginX, y)
      y += s(SP.titleToRule)

      if (draw) {
        pdf.setDrawColor(...rule)
        pdf.setLineWidth(0.3)
        pdf.line(marginX, y, rightX, y)
      }
      y += s(SP.ruleToBody)
    }

    // ——— Header ———
    setType(16, 'bold', ink)
    const name = String(state.fullName || 'Your Name').trim()
    if (draw) pdf.text(name, marginX, y)
    y += s(5.8)

    if (state.headline) {
      writeBlock(state.headline, {
        size: 9.2,
        style: 'bold',
        color: muted,
        lineH: 3.7,
      })
    }

    if (contactParts.length) {
      y += s(state.headline ? SP.headlineToContact : SP.nameToHeadline)
      writeBlock(contactParts.join('  ·  '), {
        size: 7.5,
        color: soft,
        lineH: SP.contactLine,
      })
    }

    y += s(1.6)
    if (draw) {
      pdf.setDrawColor(...ink)
      pdf.setLineWidth(0.5)
      pdf.line(marginX, y, rightX, y)
    }
    y += s(SP.afterHeaderRule)
    sectionOpen = false

    // ——— Sections ———
    if (state.summary) {
      beginSection('Professional Summary')
      writeBlock(state.summary, { size: 8.2, lineH: SP.bodyLine })
    }

    if (skills.length) {
      beginSection('Skills')
      writeBlock(skills.join('  ·  '), { size: 8.2, lineH: SP.bodyLine })
    }

    if (experience.length) {
      beginSection('Experience')
      experience.forEach((item, index) => {
        writeLeftRight(item.role || 'Role', formatExperienceDateRange(item), {
          leftSize: 8.6,
          rightSize: 7.2,
          leftStyle: 'bold',
        })
        y += s(SP.afterEntryTitle)
        writeBlock(item.company || 'Company', {
          size: 7.9,
          style: 'normal',
          color: muted,
          lineH: SP.entryMetaLine,
        })

        const bullets = String(item.details || '')
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
        if (bullets.length) {
          y += s(SP.beforeBullets)
          bullets.forEach((bullet) => {
            const bulletX = marginX + s(1.2)
            const bulletW = contentW - s(1.2)
            setType(7.9, 'normal', ink)
            const lines = pdf.splitTextToSize(`•  ${bullet}`, bulletW)
            lines.forEach((line) => {
              if (draw) pdf.text(line, bulletX, y)
              y += s(SP.bulletLine)
            })
          })
        }
        if (index < experience.length - 1) y += s(SP.entryGap)
      })
    }

    if (projects.length) {
      beginSection('Projects')
      projects.forEach((item, index) => {
        writeLeftRight(item.name || 'Project', item.link || '', {
          leftSize: 8.6,
          rightSize: 6.9,
          leftStyle: 'bold',
        })
        if (item.details) {
          y += s(SP.afterEntryTitle)
          writeBlock(item.details, { size: 7.9, lineH: SP.bodyLine })
        }
        if (index < projects.length - 1) y += s(SP.entryGap)
      })
    }

    if (education.length) {
      beginSection('Education')
      education.forEach((item, index) => {
        writeLeftRight(item.degree || 'Degree', item.year || '', {
          leftSize: 8.6,
          rightSize: 7.2,
          leftStyle: 'bold',
        })
        y += s(SP.afterEntryTitle)
        writeBlock(item.school || 'Institution', {
          size: 7.9,
          color: muted,
          lineH: SP.entryMetaLine,
        })
        if (item.details) {
          writeBlock(item.details, { size: 7.9, lineH: SP.bodyLine })
        }
        if (index < education.length - 1) y += s(SP.entryGap)
      })
    }

    if (certifications.length) {
      beginSection('Certifications')
      certifications.forEach((item) => {
        writeBlock(`•  ${item}`, { size: 8.0, lineH: SP.bulletLine })
      })
    }

    if (languages.length) {
      beginSection('Languages')
      writeBlock(languages.join('  ·  '), { size: 8.0, lineH: SP.bodyLine })
    }

    beginSection('Declaration')
    writeBlock(declaration, { size: 7.3, color: muted, lineH: 3.35 })

    y += s(SP.beforeSign)
    setType(8.0, 'normal', ink)
    const place = `Place: ${state.location || '—'}`
    if (draw) pdf.text(place, marginX, y)
    if (signName) {
      setType(8.0, 'bold', ink)
      const nameW = pdf.getTextWidth(signName)
      if (draw) pdf.text(signName, rightX - nameW, y)
    }
    y += s(3)

    return y - marginTop
  }

  // Fit to a single A4 page by scaling typography/spacing as needed
  let scale = 1
  let contentH = measureOrDraw(scale, false)
  if (contentH > usableH) {
    scale = Math.max(0.74, (usableH / contentH) * 0.985)
    contentH = measureOrDraw(scale, false)
    if (contentH > usableH) {
      scale = Math.max(0.68, (usableH / contentH) * 0.98)
    }
  }

  measureOrDraw(scale, true)

  pdf.setProperties({
    title: `${state.fullName || 'Resume'} — ${state.headline || state.category || 'Resume'}`,
    subject: 'Resume / CV (text-based, ATS-friendly, single page)',
    author: state.fullName || 'Console Projects',
    keywords: ['resume', 'cv', 'ATS', state.category, ...skills.slice(0, 12)].filter(Boolean).join(', '),
    creator: 'Console Projects Resume Builder',
  })

  return { pdf, filename: resumeFilename(state) }
}

/** Download an ATS-friendly text PDF (selectable text, not a scanned image). */
export async function downloadResumePdf(_element, resumeState) {
  const { pdf, filename } = buildResumeTextPdf(resumeState)
  pdf.save(filename)
}

/** Open the ATS-friendly text PDF in a new browser tab. */
export async function viewResumePdf(_element, resumeState) {
  const { pdf } = buildResumeTextPdf(resumeState)
  openPdfBlob(pdf)
}
