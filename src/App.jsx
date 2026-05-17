import { useState, useRef, useCallback } from 'react'
import FormPanel from './components/FormPanel'
import InvoicePreview from './components/InvoicePreview'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const today = new Date().toISOString().split('T')[0]
const due = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

const DEFAULT_STATE = {
  invoiceNumber: 'INV-001',
  status: 'unpaid',
  issueDate: today,
  dueDate: due,
  fromCompany: 'Console Projects',
  fromAddress: '379, Thopramkudy Idukki\nKerala, IN - 685515',
  fromEmail: 'billing@consoleprojects.io',
  fromPhone: '+91 7510483455',
  toCompany: '',
  toAddress: '',
  toEmail: '',
  toPhone: '',
  currency: '₹',
  notes: 'Account Name: Edison Biju\nAccount Number: 41189296858\nIFSC Code : SBIN0064986\nBank Name: State Bank of India\nBranch Name: Thopramkudy',
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
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
      const imgData = canvas.toDataURL('image/jpeg', 1.0)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const ratio = canvas.width / canvas.height
      let imgW = pageW - 16
      let imgH = imgW / ratio
      if (imgH > pageH - 16) { imgH = pageH - 16; imgW = imgH * ratio }
      pdf.addImage(imgData, 'JPEG', 8, 8, imgW, imgH)
      pdf.save(`ConsoleProjects_${state.invoiceNumber}.pdf`)
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
