import { useState, useRef, useCallback, useEffect } from 'react'
import AppNav from './components/AppNav'
import AppModal from './components/AppModal'
import DeleteConfirmModal from './components/DeleteConfirmModal'
import FormPanel from './components/FormPanel'
import InvoicePreview from './components/InvoicePreview'
import PreviousBills from './components/PreviousBills'
import ServicesManager from './components/ServicesManager'
import HomePage from './components/HomePage'
import ResumeBuilder from './components/ResumeBuilder'
import { hasContactValidationErrors, generateInvoiceNumber, generateEstimateNumber, computeTotalsWithDiscount, withDerivedPaymentFields } from './utils'
import { fetchInvoices, saveInvoice, deleteInvoice } from './lib/invoices'
import { downloadInvoicePdf, viewInvoicePdf } from './lib/pdf'

const VIEW_STORAGE_KEY = 'consolebilling_active_view'

function getInitialView() {
  const hash = window.location.hash.replace('#', '')
  if (
    hash === 'home' ||
    hash === 'create' ||
    hash === 'estimate' ||
    hash === 'bills' ||
    hash === 'services' ||
    hash === 'resume'
  ) return hash
  try {
    const stored = sessionStorage.getItem(VIEW_STORAGE_KEY)
    if (
      stored === 'home' ||
      stored === 'create' ||
      stored === 'estimate' ||
      stored === 'bills' ||
      stored === 'services' ||
      stored === 'resume'
    ) return stored
  } catch {
    // ignore
  }
  return 'home'
}

function persistView(nextView) {
  try {
    sessionStorage.setItem(VIEW_STORAGE_KEY, nextView)
  } catch {
    // ignore
  }
  const nextHash = `#${nextView}`
  if (window.location.hash !== nextHash) {
    window.history.replaceState(null, '', nextHash)
  }
}

const today = new Date().toISOString().split('T')[0]
const due = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

function createDefaultState(documentType = 'invoice') {
  const issueDate = new Date().toISOString().split('T')[0]
  const dueDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  const isEstimate = documentType === 'estimate'
  return {
    documentType,
    invoiceNumber: isEstimate ? generateEstimateNumber(issueDate) : generateInvoiceNumber(issueDate),
    status: isEstimate ? 'draft' : 'unpaid',
    issueDate,
    dueDate,
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
    paymentMode: isEstimate ? '' : 'Bank Transfer',
    upiId: isEstimate ? '' : 'shigybiju9562-1@oksbi',
    upiPayeeName: isEstimate ? '' : 'Shyji Biju',
    bankDetails: isEstimate
      ? ''
      : 'Account Holder Name: Shyji Biju\nAccount Number: 44078284542\nIFSC Code: SBIN0070698\nBank Name: State Bank of India',
    extraNotes: isEstimate ? 'Thank you for considering our services.' : 'Thank you for your business.',
    terms: isEstimate
      ? 'This is a non-binding estimate valid for 7 days.\nAll amounts are payable in Indian Rupees.\nThis is a non-GST service estimate.'
      : 'Payment is due within 7 days of the invoice date.\nAll amounts are payable in Indian Rupees.\nThis is a non-GST service invoice.',
    items: [
      { id: Date.now(), desc: '', qty: 1, rate: '' },
    ],
  }
}

function billToState(bill) {
  const defaults = createDefaultState()
  return withDerivedPaymentFields({
    ...defaults,
    documentType: bill.documentType || defaults.documentType,
    invoiceNumber: bill.invoiceNumber || defaults.invoiceNumber,
    status: bill.status || 'unpaid',
    issueDate: bill.issueDate || today,
    dueDate: bill.dueDate || due,
    fromCompany: bill.fromCompany ?? defaults.fromCompany,
    fromAddress: bill.fromAddress ?? defaults.fromAddress,
    fromEmail: bill.fromEmail ?? defaults.fromEmail,
    fromPhone: bill.fromPhone ?? defaults.fromPhone,
    toCompany: bill.toCompany || '',
    toAddress: bill.toAddress || '',
    toEmail: bill.toEmail || '',
    toPhone: bill.toPhone || '',
    currency: bill.currency || '₹',
    amountPaid: bill.amountPaid ?? 0,
    discountType: bill.discountType || 'amount',
    discountValue: bill.discountValue ?? 0,
    paymentMode: bill.paymentMode || defaults.paymentMode,
    upiId: bill.upiId || defaults.upiId,
    upiPayeeName: bill.upiPayeeName || defaults.upiPayeeName,
    bankDetails: bill.bankDetails || defaults.bankDetails,
    extraNotes: bill.extraNotes || defaults.extraNotes,
    terms: bill.terms || defaults.terms,
    items: Array.isArray(bill.items) && bill.items.length > 0
      ? bill.items.map((it, i) => ({
          id: it.id || Date.now() + i,
          desc: it.desc || '',
          qty: it.qty ?? 1,
          rate: it.rate ?? '',
        }))
      : [{ id: Date.now(), desc: '', qty: 1, rate: '' }],
  })
}

function buildPaidBillState(bill) {
  const state = billToState(bill)
  const { total } = computeTotalsWithDiscount(state.items, state.discountType, state.discountValue)
  const invoiceTotal = Number(bill.total) || total
  return withDerivedPaymentFields({
    ...state,
    amountPaid: invoiceTotal,
  })
}

export default function App() {
  const [view, setView] = useState(() => {
    const initial = getInitialView()
    persistView(initial)
    return initial
  })
  const [state, setState] = useState(createDefaultState)
  const [downloading, setDownloading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resumeHeaderActions, setResumeHeaderActions] = useState(null)
  const [previousBills, setPreviousBills] = useState([])
  const [billsLoading, setBillsLoading] = useState(false)
  const [billsError, setBillsError] = useState(null)
  const [saveModal, setSaveModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteConfirming, setDeleteConfirming] = useState(false)
  const [busyBillId, setBusyBillId] = useState(null)
  const [exportState, setExportState] = useState(null)
  const previewRef = useRef(null)
  const exportPreviewRef = useRef(null)
  const exportWaitersRef = useRef([])
  const exportModeRef = useRef('download')

  useEffect(() => {
    if (!exportState) return undefined
    const id = window.setTimeout(async () => {
      const waiters = exportWaitersRef.current
      exportWaitersRef.current = []
      const mode = exportModeRef.current || 'download'
      try {
        if (mode === 'view') {
          await viewInvoicePdf(exportPreviewRef.current, exportState)
        } else {
          await downloadInvoicePdf(exportPreviewRef.current, exportState)
        }
        waiters.forEach(({ resolve }) => resolve())
      } catch (e) {
        waiters.forEach(({ reject }) => reject(e))
      } finally {
        exportModeRef.current = 'download'
        setExportState(null)
      }
    }, 450)
    return () => window.clearTimeout(id)
  }, [exportState])

  const loadBills = useCallback(async () => {
    setBillsLoading(true)
    setBillsError(null)
    try {
      const bills = await fetchInvoices({ limit: 10 })
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
    persistView(nextView)
    if (nextView === 'bills') loadBills()
  }, [loadBills])

  const update = useCallback((key, value) => {
    setState((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'status') return next
      if (
        key === 'amountPaid' ||
        key === 'discountType' ||
        key === 'discountValue' ||
        key === 'items'
      ) {
        return withDerivedPaymentFields(next)
      }
      return next
    })
  }, [])

  const updateItem = useCallback((id, keyOrPatch, value) => {
    setState((prev) =>
      withDerivedPaymentFields({
        ...prev,
        items: prev.items.map((it) => {
          if (it.id !== id) return it
          if (typeof keyOrPatch === 'object' && keyOrPatch !== null) {
            return { ...it, ...keyOrPatch }
          }
          return { ...it, [keyOrPatch]: value }
        }),
      }),
    )
  }, [])

  const addItem = useCallback(() => {
    setState((prev) =>
      withDerivedPaymentFields({
        ...prev,
        items: [...prev.items, { id: Date.now(), desc: '', qty: 1, rate: '' }],
      }),
    )
  }, [])

  const removeItem = useCallback((id) => {
    setState((prev) =>
      withDerivedPaymentFields({
        ...prev,
        items: prev.items.length > 1 ? prev.items.filter((it) => it.id !== id) : prev.items,
      }),
    )
  }, [])

  const startNewInvoice = useCallback(() => {
    setState(createDefaultState('invoice'))
    navigate('create')
  }, [navigate])

  const startNewEstimate = useCallback(() => {
    setState(createDefaultState('estimate'))
    navigate('estimate')
  }, [navigate])

  const openBill = useCallback((bill) => {
    setState(billToState(bill))
    navigate((bill.documentType || 'invoice') === 'estimate' ? 'estimate' : 'create')
  }, [navigate])

  const requestDeleteBill = useCallback((bill) => {
    setDeleteTarget(bill)
  }, [])

  const confirmDeleteBill = useCallback(async () => {
    if (!deleteTarget) return
    const bill = deleteTarget
    const rowId = bill.id || bill.invoiceNumber
    setDeleteConfirming(true)
    setBusyBillId(rowId)
    try {
      await deleteInvoice(bill)
      setDeleteTarget(null)
      // Reload from Supabase so the UI matches the database
      await loadBills()
    } catch (e) {
      console.error(e)
      const msg = e?.message || 'Failed to delete invoice'
      if (
        String(msg).toLowerCase().includes('permission') ||
        String(msg).toLowerCase().includes('delete policy') ||
        e?.code === '42501'
      ) {
        alert(
          'Delete failed in Supabase. Run supabase/invoices.sql in the Supabase SQL Editor (includes the delete policy), then try again.',
        )
      } else {
        alert(`Delete failed: ${msg}`)
      }
    } finally {
      setDeleteConfirming(false)
      setBusyBillId(null)
    }
  }, [deleteTarget, loadBills])

  const downloadBillPdf = useCallback(async (bill) => {
    const rowId = bill.id || bill.invoiceNumber
    setBusyBillId(rowId)
    try {
      await new Promise((resolve, reject) => {
        exportModeRef.current = 'download'
        exportWaitersRef.current.push({ resolve, reject })
        setExportState(billToState(bill))
      })
    } catch (e) {
      console.error(e)
      alert('PDF generation error: ' + (e?.message || e))
    } finally {
      setBusyBillId(null)
    }
  }, [])

  const viewBillPdf = useCallback(async (bill) => {
    const rowId = bill.id || bill.invoiceNumber
    setBusyBillId(rowId)
    try {
      await new Promise((resolve, reject) => {
        exportModeRef.current = 'view'
        exportWaitersRef.current.push({ resolve, reject })
        setExportState(billToState(bill))
      })
    } catch (e) {
      console.error(e)
      alert('PDF view error: ' + (e?.message || e))
    } finally {
      setBusyBillId(null)
    }
  }, [])

  const markPaidAndDownload = useCallback(async (bill) => {
    if ((bill.documentType || 'invoice') === 'estimate') return
    const rowId = bill.id || bill.invoiceNumber
    const isPaid = (bill.status || 'unpaid') === 'paid'
    setBusyBillId(rowId)
    try {
      const paidState = buildPaidBillState(bill)
      if (!isPaid) {
        const saved = await saveInvoice(paidState)
        setPreviousBills((prev) =>
          prev.map((b) => ((b.id || b.invoiceNumber) === rowId ? saved : b)),
        )
      }
      await new Promise((resolve, reject) => {
        exportModeRef.current = 'download'
        exportWaitersRef.current.push({ resolve, reject })
        setExportState(paidState)
      })
    } catch (e) {
      console.error(e)
      const msg = e?.message || 'Failed to mark invoice as paid'
      if (String(msg).includes('Supabase is not configured')) {
        alert(msg)
      } else {
        alert(`Paid PDF failed: ${msg}`)
      }
    } finally {
      setBusyBillId(null)
    }
  }, [])

  const saveToSupabase = async () => {
    if (hasContactValidationErrors(state)) {
      alert('Please fix email and phone validation errors before saving.')
      return
    }
    setSaving(true)
    try {
      await saveInvoice(state)
      const savedType = state.documentType || 'invoice'
      setState(createDefaultState(savedType))
      setSaveModal({
        title: 'Saved',
        message: savedType === 'estimate'
          ? 'Estimate saved to Supabase.'
          : 'Invoice saved to Supabase.',
      })
    } catch (e) {
      console.error(e)
      const msg = e?.message || 'Failed to save invoice'
      if (String(msg).includes('Could not find the table') || e?.code === 'PGRST205') {
        alert('Save failed: create the invoices table first (run supabase/invoices.sql in Supabase SQL Editor).')
      } else {
        alert(`Save failed: ${msg}`)
      }
    } finally {
      setSaving(false)
    }
  }

  const downloadPDF = async () => {
    if (!previewRef.current) return
    setDownloading(true)
    try {
      await downloadInvoicePdf(previewRef.current, state)
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
        onNavigate={(nextView) => {
          if (nextView === 'home') navigate('home')
          else if (nextView === 'create') startNewInvoice()
          else if (nextView === 'estimate') startNewEstimate()
          else navigate(nextView)
        }}
        downloading={downloading}
        onDownload={downloadPDF}
        showDownload={view === 'create' || view === 'estimate'}
        showBillingNav={view !== 'home' && view !== 'resume'}
        resumeActions={view === 'resume' ? resumeHeaderActions : null}
      />

      {view === 'home' ? (
        <HomePage
          onOpenModule={(moduleId) => {
            if (moduleId === 'billing') startNewInvoice()
            else if (moduleId === 'resume') navigate('resume')
          }}
        />
      ) : view === 'resume' ? (
        <ResumeBuilder onHeaderActions={setResumeHeaderActions} />
      ) : view === 'create' || view === 'estimate' ? (
        <div className="app-layout">
          <FormPanel
            state={state}
            update={update}
            updateItem={updateItem}
            addItem={addItem}
            removeItem={removeItem}
            saving={saving}
            onSave={saveToSupabase}
          />
          <InvoicePreview ref={previewRef} state={state} />
        </div>
      ) : view === 'services' ? (
        <ServicesManager autoLoad />
      ) : (
        <PreviousBills
          bills={previousBills}
          loading={billsLoading}
          error={billsError}
          onRefresh={loadBills}
          onEditBill={openBill}
          onDeleteBill={requestDeleteBill}
          onDownloadBill={downloadBillPdf}
          onViewBill={viewBillPdf}
          onMarkPaidPdf={markPaidAndDownload}
          busyBillId={busyBillId}
          autoLoad
        />
      )}

      {exportState && (
        <div className="pdf-export-offscreen" aria-hidden="true">
          <InvoicePreview ref={exportPreviewRef} state={exportState} />
        </div>
      )}

      <AppModal
        open={Boolean(saveModal)}
        title={saveModal?.title}
        message={saveModal?.message}
        onClose={() => setSaveModal(null)}
      />

      <DeleteConfirmModal
        key={deleteTarget?.id || deleteTarget?.invoiceNumber || 'delete'}
        open={Boolean(deleteTarget)}
        invoiceLabel={deleteTarget?.invoiceNumber}
        confirming={deleteConfirming}
        onCancel={() => {
          if (deleteConfirming) return
          setDeleteTarget(null)
        }}
        onConfirm={confirmDeleteBill}
      />
    </div>
  )
}
