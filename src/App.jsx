import { useState, useRef, useCallback } from 'react'
import AppNav from './components/AppNav'
import FormPanel from './components/FormPanel'
import InvoicePreview from './components/InvoicePreview'
import PreviousBills from './components/PreviousBills'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { sanitizeInvoiceNumber, generateInvoiceNumber } from './utils'
import { fetchInvoices, saveInvoice } from './lib/invoices'

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

function billToState(bill) {
  return {
    ...DEFAULT_STATE,
    invoiceNumber: bill.invoiceNumber || DEFAULT_STATE.invoiceNumber,
    status: bill.status || 'unpaid',
    issueDate: bill.issueDate || today,
    dueDate: bill.dueDate || due,
    fromCompany: bill.fromCompany ?? DEFAULT_STATE.fromCompany,
    fromAddress: bill.fromAddress ?? DEFAULT_STATE.fromAddress,
    fromEmail: bill.fromEmail ?? DEFAULT_STATE.fromEmail,
    fromPhone: bill.fromPhone ?? DEFAULT_STATE.fromPhone,
    toCompany: bill.toCompany || '',
    toAddress: bill.toAddress || '',
    toEmail: bill.toEmail || '',
    toPhone: bill.toPhone || '',
    currency: bill.currency || '₹',
    amountPaid: bill.amountPaid ?? 0,
    discountType: bill.discountType || 'amount',
    discountValue: bill.discountValue ?? 0,
    paymentMode: bill.paymentMode || DEFAULT_STATE.paymentMode,
    upiId: bill.upiId || DEFAULT_STATE.upiId,
    upiPayeeName: bill.upiPayeeName || DEFAULT_STATE.upiPayeeName,
    bankDetails: bill.bankDetails || DEFAULT_STATE.bankDetails,
    extraNotes: bill.extraNotes || DEFAULT_STATE.extraNotes,
    terms: bill.terms || DEFAULT_STATE.terms,
    items: Array.isArray(bill.items) && bill.items.length > 0
      ? bill.items.map((it, i) => ({
          id: it.id || Date.now() + i,
          desc: it.desc || '',
          qty: it.qty ?? 1,
          rate: it.rate ?? '',
        }))
      : [{ id: Date.now(), desc: '', qty: 1, rate: '' }],
  }
}

export default function App() {
  const [view, setView] = useState('create')
  const [state, setState] = useState(DEFAULT_STATE)
  const [downloading, setDownloading] = useState(false)
  const [previousBills, setPreviousBills] = useState([])
  const [billsLoading, setBillsLoading] = useState(false)
  const [billsError, setBillsError] = useState(null)
  const previewRef = useRef(null)

  const loadBills = useCallback(async () => {
    setBillsLoading(true)
    setBillsError(null)
    try {
      const bills = await fetchInvoices()
      setPreviousBills(bills)
    } catch (e) {
      console.error(e)
      const msg = e?.message || 'Failed to load bills'
      if (String(msg).includes('Could not find the table') || e?.code === 'PGRST205') {
        setBillsError('Invoices table not found. Run supabase/invoices.sql in your Supabase SQL Editor, then refresh.')
      } else {
        setBillsError(msg)
      }
      setPreviousBills([])
    } finally {
      setBillsLoading(false)
    }
  }, [])

  const navigate = useCallback((nextView) => {
    setView(nextView)
    if (nextView === 'bills') loadBills()
  }, [loadBills])

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

  const openBill = useCallback((bill) => {
    setState(billToState(bill))
    setView('create')
  }, [])

  const downloadPDF = async () => {
    if (!previewRef.current) return
    setDownloading(true)
    try {
      try {
        await saveInvoice(state)
      } catch (saveErr) {
        console.error(saveErr)
        const msg = saveErr?.message || 'Failed to save invoice'
        if (String(msg).includes('Could not find the table') || saveErr?.code === 'PGRST205') {
          alert('PDF will download, but Supabase save failed: create the invoices table first (see supabase/invoices.sql).')
        } else {
          alert(`PDF will download, but saving failed: ${msg}`)
        }
      }

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

      const imgW = pageW - margin * 2
      const imgH = (canvas.height * imgW) / canvas.width

      let y = margin
      let remainingH = imgH

      pdf.addImage(imgData, 'PNG', margin, y, imgW, imgH, undefined, 'FAST')
      remainingH -= (pageH - margin * 2)

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
    <div className="app-shell">
      <AppNav
        activeView={view}
        onNavigate={navigate}
        downloading={downloading}
        onDownload={downloadPDF}
      />

      {view === 'create' ? (
        <div className="app-layout">
          <FormPanel
            state={state}
            update={update}
            updateItem={updateItem}
            addItem={addItem}
            removeItem={removeItem}
          />
          <InvoicePreview ref={previewRef} state={state} />
        </div>
      ) : (
        <PreviousBills
          bills={previousBills}
          loading={billsLoading}
          error={billsError}
          onNewInvoice={() => setView('create')}
          onRefresh={loadBills}
          onOpenBill={openBill}
        />
      )}
    </div>
  )
}
