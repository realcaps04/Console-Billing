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
