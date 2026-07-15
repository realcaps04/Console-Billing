import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { sanitizeInvoiceNumber, generateInvoiceNumber } from '../utils'

export async function downloadInvoicePdf(element, invoiceState) {
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
  pdf.save(`ConsoleProjects_${safeInvoice}.pdf`)
}
