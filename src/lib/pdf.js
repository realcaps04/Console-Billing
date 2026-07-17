import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { sanitizeInvoiceNumber, generateInvoiceNumber } from '../utils'

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
  const blob = pdf.output('blob')
  const url = URL.createObjectURL(blob)

  // Do not pass "noopener" in the features string — many browsers then return null
  // even when the tab opens successfully, which caused a false "popup blocked" alert.
  const opened = window.open(url, '_blank')
  if (opened) {
    try {
      opened.opener = null
    } catch {
      // ignore
    }
  } else {
    // Fallback if the window reference is unavailable
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

async function buildElementPdf(element, filename, { fitSinglePage = false, margin = 10 } = {}) {
  if (!element) throw new Error('Preview is not ready.')

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
  const usableW = pageW - margin * 2
  const usableH = pageH - margin * 2

  let imgW = usableW
  let imgH = (canvas.height * imgW) / canvas.width

  if (fitSinglePage && imgH > usableH) {
    const scale = usableH / imgH
    imgW *= scale
    imgH = usableH
  }

  const x = margin + (usableW - imgW) / 2
  pdf.addImage(imgData, 'PNG', x, margin, imgW, imgH, undefined, 'FAST')

  if (!fitSinglePage) {
    let remainingH = imgH - usableH
    while (remainingH > 0) {
      pdf.addPage()
      const y = margin - (imgH - remainingH)
      pdf.addImage(imgData, 'PNG', margin, y, imgW, imgH, undefined, 'FAST')
      remainingH -= usableH
    }
  }

  return { pdf, filename }
}

export async function downloadResumePdf(element, resumeState) {
  const safeName = String(resumeState?.fullName || 'Resume')
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_') || 'Resume'
  const category = String(resumeState?.category || 'General').replace(/\s+/g, '_')
  const { pdf, filename } = await buildElementPdf(
    element,
    `Resume_${safeName}_${category}.pdf`,
    { fitSinglePage: true, margin: 8 },
  )
  pdf.save(filename)
}

export async function viewResumePdf(element, resumeState) {
  const safeName = String(resumeState?.fullName || 'Resume')
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_') || 'Resume'
  const category = String(resumeState?.category || 'General').replace(/\s+/g, '_')
  const { pdf } = await buildElementPdf(
    element,
    `Resume_${safeName}_${category}.pdf`,
    { fitSinglePage: true, margin: 8 },
  )
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
