import { useState, useRef, useCallback } from 'react'
import FormPanel from './components/FormPanel'
import InvoicePreview from './components/InvoicePreview'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { sanitizeInvoiceNumber, generateInvoiceNumber } from './utils'

const today = new Date().toISOString().split('T')[0]
const due = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

const DEFAULT_STATE = {
  invoiceNumber: generateInvoiceNumber(today),
  status: 'unpaid',
  issueDate: today,
  dueDate: due,
  fromCompany: 'Console Projects',
  fromAddress: '3658, Cochin\nKerala, IN - 682001',
  fromEmail: 'consoleprojectsonline@gmail.com',
  fromPhone: '+91 7907951080',
  toCompany: '',
  toAddress: '',
  toEmail: '',
  toPhone: '',
  currency: '₹',
  amountPaid: 0,
  discountType: 'amount',
  discountValue: 0,
  paymentMode: 'Bank Transfer',
  upiId: 'shigybiju9562-1@oksbi',
  upiPayeeName: 'Shyji Biju',
  bankDetails: 'Account Holder Name: Shyji Biju\nAccount Number: 44078284542\nIFSC Code: SBIN0070698\nBank Name: State Bank of India',
  extraNotes: 'Thank you for your business.',
  terms: 'Payment is due within 7 days of the invoice date.\nAll amounts are payable in Indian Rupees.\nThis is a non-GST service invoice.',
  items: [
    { id: 1, desc: '', qty: 1, rate: '' },
  ],
}

export default function App() {
  const [state, setState] = useState(DEFAULT_STATE)
  const [downloading, setDownloading] = useState(false)
  const previewRef = useRef(null)

  const update = useCallback((key, value) => {
    setState(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateItem = useCallback((id, key, value) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(it => it.id === id ? { ...it, [key]: value } : it),
    }))
  }, [])

  const addItem = useCallback(() => {
    setState(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), desc: '', qty: 1, rate: '' }],
    }))
  }, [])

  const removeItem = useCallback((id) => {
    setState(prev => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter(it => it.id !== id) : prev.items,
    }))
  }, [])

  const downloadPDF = async () => {
    if (!previewRef.current) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(previewRef.current, {
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

      // Render the canvas at a fixed width; add pages if height overflows.
      const imgW = pageW - margin * 2
      const imgH = (canvas.height * imgW) / canvas.width

      let y = margin
      let remainingH = imgH

      pdf.addImage(imgData, 'PNG', margin, y, imgW, imgH, undefined, 'FAST')
      remainingH -= (pageH - margin * 2)

      // If the content is taller than one page, shift the same image up on subsequent pages.
      while (remainingH > 0) {
        pdf.addPage()
        y = margin - (imgH - remainingH)
        pdf.addImage(imgData, 'PNG', margin, y, imgW, imgH, undefined, 'FAST')
        remainingH -= (pageH - margin * 2)
      }

      const safeInvoice = sanitizeInvoiceNumber(state.invoiceNumber) || generateInvoiceNumber(state.issueDate)
      pdf.save(`ConsoleProjects_${safeInvoice}.pdf`)
    } catch (e) {
      console.error(e)
      alert('PDF generation error: ' + e.message)
    }
    setDownloading(false)
  }

  return (
    <div className="app-layout">
      <FormPanel
        state={state}
        update={update}
        updateItem={updateItem}
        addItem={addItem}
        removeItem={removeItem}
        downloading={downloading}
        onDownload={downloadPDF}
      />
      <InvoicePreview ref={previewRef} state={state} onDownload={downloadPDF} downloading={downloading} />
    </div>
  )
}
