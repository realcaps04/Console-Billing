import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AppModal from './AppModal'
import {
  createEmptyLoanDocument,
  createEmptyLoanType,
  deleteLoanDocument,
  deleteLoanType,
  fetchLoanCustomers,
  fetchLoanTypes,
  getLoanDocumentValidationErrors,
  getLoanStatusLabel,
  getLoanTypeValidationErrors,
  hasLoanDocumentValidationErrors,
  hasLoanTypeValidationErrors,
  LOAN_STATUSES,
  LOAN_TYPE_SUGGESTIONS,
  normalizeLoanDocument,
  normalizeLoanType,
  saveLoanDocument,
  saveLoanType,
  serializeLoanDocumentForCompare,
  getLoanTypeTheme,
  getLoanTypeInitials,
  customerMatchesSearch,
  getCustomerSearchMatchHint,
  searchAllLoanCustomers,
} from '../lib/loanDocuments'
import { getInitialDocumentsPage, getStoredDocumentsCustomerId, getStoredDocumentsLoanTypeId, persistDocumentsContext, persistDocumentsPage } from '../lib/appRoute'
import LoanCustomerForm from './LoanCustomerForm'
import CustomerSectionPicker from './CustomerSectionPicker'
import { getVisibleCustomerSections } from '../lib/loanCustomerSections'

function Field({ label, children, full, error, required }) {
  return (
    <div className={`resume-field${full ? ' full' : ''}${error ? ' has-error' : ''}`}>
      <label>
        {label}
        {required ? <span className="resume-req" aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  )
}

function formatUpdated(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function displayCell(value, fallback = '—') {
  const text = String(value ?? '').trim()
  return text || fallback
}

function IconView() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconEdit() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )
}

function IconDelete() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  )
}

export default function LoanDocuments({ onHeaderActions, onUnsavedChanges }) {
  const [page, setPage] = useState(getInitialDocumentsPage)
  const [section, setSection] = useState('overview')
  const [selectedLoanType, setSelectedLoanType] = useState(null)
  const [loanTypes, setLoanTypes] = useState([])
  const [customers, setCustomers] = useState([])
  const [state, setState] = useState(createEmptyLoanDocument)
  const [savedBaseline, setSavedBaseline] = useState(() => serializeLoanDocumentForCompare(createEmptyLoanDocument()))
  const [typesLoading, setTypesLoading] = useState(true)
  const [customersLoading, setCustomersLoading] = useState(false)
  const [listError, setListError] = useState('')
  const [listSearch, setListSearch] = useState('')
  const [globalSearchResults, setGlobalSearchResults] = useState([])
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteConfirming, setDeleteConfirming] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [showErrors, setShowErrors] = useState(false)
  const [typeFormOpen, setTypeFormOpen] = useState(false)
  const [typeForm, setTypeForm] = useState(createEmptyLoanType)
  const [typeFormSaving, setTypeFormSaving] = useState(false)
  const [typeFormErrors, setTypeFormErrors] = useState({})
  const [showTypeFormErrors, setShowTypeFormErrors] = useState(false)
  const [deleteLoanTypeTarget, setDeleteLoanTypeTarget] = useState(null)
  const [loanTypeDeletedModal, setLoanTypeDeletedModal] = useState(false)
  const [editorReadOnly, setEditorReadOnly] = useState(false)
  const [documentsReady, setDocumentsReady] = useState(false)
  const pendingRestoreRef = useRef({
    loanTypeId: getStoredDocumentsLoanTypeId(),
    customerId: getStoredDocumentsCustomerId(),
  })
  const editorRestoreAttemptedRef = useRef(false)

  const validationErrors = useMemo(() => getLoanDocumentValidationErrors(state), [state])

  const visibleSections = useMemo(
    () => getVisibleCustomerSections(state.enabledSectionIds),
    [state.enabledSectionIds],
  )

  const nextSection = useMemo(() => {
    const index = visibleSections.findIndex((item) => item.id === section)
    if (index < 0 || index >= visibleSections.length - 1) return null
    return visibleSections[index + 1]
  }, [visibleSections, section])

  const goToNextSection = useCallback(() => {
    if (nextSection) setSection(nextSection.id)
  }, [nextSection])

  useEffect(() => {
    if (!visibleSections.some((item) => item.id === section)) {
      setSection('overview')
    }
  }, [visibleSections, section])

  const isDirty = useMemo(
    () => !editorReadOnly && page === 'editor' && serializeLoanDocumentForCompare(state) !== savedBaseline,
    [editorReadOnly, page, state, savedBaseline],
  )

  const markClean = useCallback((record) => {
    setSavedBaseline(serializeLoanDocumentForCompare(normalizeLoanDocument(record)))
  }, [])

  const confirmDiscardChanges = useCallback(() => {
    if (!isDirty) return true
    return window.confirm('You have unsaved changes. Leave without saving?')
  }, [isDirty])

  useEffect(() => {
    onUnsavedChanges?.(isDirty)
    return () => onUnsavedChanges?.(false)
  }, [isDirty, onUnsavedChanges])

  useEffect(() => {
    if (!isDirty) return undefined
    const onBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  useEffect(() => {
    persistDocumentsPage(page)
  }, [page])

  useEffect(() => {
    if (page === 'customers' && selectedLoanType?.id) {
      persistDocumentsContext({ loanTypeId: selectedLoanType.id, customerId: null })
    } else if (page === 'editor' && selectedLoanType?.id) {
      persistDocumentsContext({ loanTypeId: selectedLoanType.id, customerId: state.id || null })
    } else if (page === 'types') {
      persistDocumentsContext({ loanTypeId: null, customerId: null })
    }
  }, [page, selectedLoanType?.id, state.id])

  const loadLoanTypes = useCallback(async () => {
    setTypesLoading(true)
    setListError('')
    try {
      const rows = await fetchLoanTypes()
      setLoanTypes(rows)
      setSelectedLoanType((prev) => {
        if (!prev?.id) return prev
        return rows.find((row) => row.id === prev.id) || prev
      })
    } catch (e) {
      console.error(e)
      setListError(e?.message || 'Failed to load loan types')
      setLoanTypes([])
    } finally {
      setTypesLoading(false)
    }
  }, [])

  const loadCustomers = useCallback(async (loanTypeId, { keepExisting = false } = {}) => {
    if (!loanTypeId) {
      setCustomers([])
      return
    }
    if (!keepExisting) {
      setCustomersLoading(true)
    }
    setListError('')
    try {
      const rows = await fetchLoanCustomers({ loanTypeId })
      setCustomers(rows)
    } catch (e) {
      console.error(e)
      setListError(e?.message || 'Failed to load customers')
      if (!keepExisting) setCustomers([])
    } finally {
      setCustomersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!documentsReady) return
    if (page === 'customers' && !selectedLoanType?.id) {
      setPage('types')
    }
    if (page === 'editor' && !selectedLoanType?.id) {
      setPage('types')
    }
  }, [documentsReady, page, selectedLoanType?.id])

  useEffect(() => {
    if (page === 'types' || page === 'customers' || page === 'editor') {
      void loadLoanTypes()
    }
  }, [page, loadLoanTypes])

  useEffect(() => {
    if (typesLoading || documentsReady) return

    const pendingLoanTypeId = pendingRestoreRef.current.loanTypeId
    if (pendingLoanTypeId && (page === 'customers' || page === 'editor')) {
      const type = loanTypes.find((row) => row.id === pendingLoanTypeId)
      if (type) {
        setSelectedLoanType(type)
      } else {
        setPage('types')
      }
    }
    setDocumentsReady(true)
  }, [typesLoading, loanTypes, page, documentsReady])

  useEffect(() => {
    if ((page === 'customers' || page === 'editor') && selectedLoanType?.id) {
      loadCustomers(selectedLoanType.id)
    }
  }, [page, selectedLoanType?.id, loadCustomers])

  const filteredCustomers = useMemo(() => {
    const q = listSearch.trim()
    if (!q) return customers
    return customers.filter((row) =>
      customerMatchesSearch(row, q, selectedLoanType?.name || ''),
    )
  }, [customers, listSearch, selectedLoanType?.name])

  const filteredLoanTypes = useMemo(() => {
    const q = listSearch.trim().toLowerCase()
    if (!q) return loanTypes
    const typesWithCustomerHits = new Set(globalSearchResults.map((row) => row.loanTypeId))
    return loanTypes.filter((row) =>
      row.name.toLowerCase().includes(q) ||
      (row.description || '').toLowerCase().includes(q) ||
      typesWithCustomerHits.has(row.id),
    )
  }, [loanTypes, listSearch, globalSearchResults])

  useEffect(() => {
    const q = listSearch.trim()
    if (!q || page !== 'types') {
      setGlobalSearchResults([])
      setGlobalSearchLoading(false)
      return undefined
    }

    let cancelled = false
    setGlobalSearchLoading(true)
    const timer = window.setTimeout(async () => {
      try {
        const rows = await searchAllLoanCustomers({ query: q })
        if (!cancelled) setGlobalSearchResults(rows)
      } catch (e) {
        console.error(e)
        if (!cancelled) setGlobalSearchResults([])
      } finally {
        if (!cancelled) setGlobalSearchLoading(false)
      }
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [listSearch, page])

  const hasActiveSearch = Boolean(listSearch.trim())

  const goToTypes = useCallback(() => {
    if (!confirmDiscardChanges()) return
    setPage('types')
    setSection('overview')
    setListSearch('')
  }, [confirmDiscardChanges])

  const goToCustomers = useCallback(() => {
    if (!confirmDiscardChanges()) return
    if (!selectedLoanType?.id) {
      setPage('types')
      return
    }
    setEditorReadOnly(false)
    setPage('customers')
    setSection('overview')
  }, [confirmDiscardChanges, selectedLoanType?.id])

  const openLoanType = useCallback((loanType) => {
    setSelectedLoanType(loanType)
    setListSearch('')
    setNotice('')
    setPage('customers')
  }, [])

  const openTypeForm = (loanType = null) => {
    setTypeForm(normalizeLoanType(loanType || createEmptyLoanType()))
    setTypeFormErrors({})
    setShowTypeFormErrors(false)
    setTypeFormOpen(true)
  }

  const closeTypeForm = () => {
    if (typeFormSaving) return
    setTypeFormOpen(false)
    setTypeForm(createEmptyLoanType())
  }

  const applyTypeSuggestion = (name) => {
    setTypeForm((prev) => ({ ...prev, name }))
  }

  const handleSaveLoanType = async () => {
    const errors = getLoanTypeValidationErrors(typeForm)
    setTypeFormErrors(errors)
    setShowTypeFormErrors(true)
    if (hasLoanTypeValidationErrors(errors)) return

    setTypeFormSaving(true)
    try {
      const saved = await saveLoanType(typeForm)
      setTypeFormOpen(false)
      setNotice(typeForm.id ? 'Loan type updated.' : 'Loan type created.')
      await loadLoanTypes()
      if (selectedLoanType?.id === saved.id) {
        setSelectedLoanType(saved)
      }
    } catch (e) {
      console.error(e)
      alert(e?.message || 'Failed to save loan type')
    } finally {
      setTypeFormSaving(false)
    }
  }

  const requestDeleteLoanType = (loanType) => {
    if (!loanType?.id || deleteConfirming) return
    setDeleteLoanTypeTarget(loanType)
  }

  const confirmDeleteLoanType = async () => {
    const loanType = deleteLoanTypeTarget
    if (!loanType?.id) return
    setDeleteConfirming(true)
    try {
      await deleteLoanType(loanType.id)
      setDeleteLoanTypeTarget(null)
      if (selectedLoanType?.id === loanType.id) {
        setSelectedLoanType(null)
        setCustomers([])
        setPage('types')
      }
      setLoanTypeDeletedModal(true)
      await loadLoanTypes()
    } catch (e) {
      console.error(e)
      alert(e?.message || 'Failed to delete loan type')
    } finally {
      setDeleteConfirming(false)
    }
  }

  const openEditor = useCallback((record, loanType, { readOnly = false } = {}) => {
    const type = loanType || selectedLoanType
    const next = normalizeLoanDocument({
      ...(record || createEmptyLoanDocument(type?.id)),
      loanTypeId: record?.loanTypeId || type?.id || null,
      loginCredentials: {
        ...createEmptyLoanDocument().loginCredentials,
        ...(record?.loginCredentials || {}),
        portalUrl: record?.loginCredentials?.portalUrl || type?.portalUrl || '',
      },
    })
    if (type) setSelectedLoanType(type)
    setState(next)
    markClean(next)
    setSection('overview')
    setShowErrors(false)
    setError('')
    setEditorReadOnly(readOnly)
    setPage('editor')
  }, [markClean, selectedLoanType])

  useEffect(() => {
    if (!documentsReady || page !== 'editor' || !selectedLoanType?.id || state.id) return
    if (editorRestoreAttemptedRef.current) return

    const customerId = pendingRestoreRef.current.customerId
    if (!customerId) {
      editorRestoreAttemptedRef.current = true
      setPage('customers')
      return
    }
    if (customersLoading) return

    editorRestoreAttemptedRef.current = true
    const record = customers.find((row) => row.id === customerId)
    if (record) {
      openEditor(record, selectedLoanType, { readOnly: true })
      return
    }
    setPage('customers')
  }, [documentsReady, page, selectedLoanType, customers, customersLoading, state.id, openEditor])

  const requestNewCustomer = () => {
    if (!selectedLoanType?.id) {
      alert('Select a loan type first.')
      setPage('types')
      return
    }
    openEditor(null, selectedLoanType, { readOnly: false })
  }

  const openEditorFromList = (record) => {
    if (record) {
      openEditor(record, selectedLoanType, { readOnly: false })
      return
    }
    requestNewCustomer()
  }

  const openViewFromList = (record) => {
    if (!record) return
    openEditor(record, selectedLoanType, { readOnly: true })
  }

  const openCustomerFromSearch = (record) => {
    const type = loanTypes.find((t) => t.id === record.loanTypeId) || record.loanType
    if (!type) return
    setSelectedLoanType(type)
    openViewFromList(record)
  }

  const requestEditMode = () => {
    setEditorReadOnly(false)
  }

  const updateTop = (key, value) => {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  const updateSection = (sectionKey, field, value) => {
    setState((prev) => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], [field]: value },
    }))
  }

  const updateEnabledSections = (enabledSectionIds) => {
    setState((prev) => ({ ...prev, enabledSectionIds }))
  }

  const handleSave = async () => {
    setShowErrors(true)
    if (hasLoanDocumentValidationErrors(validationErrors)) {
      setError('Fix validation errors before saving.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const saved = await saveLoanDocument(state, { loanTypeName: selectedLoanType?.name })
      setState(normalizeLoanDocument(saved))
      markClean(saved)
      setNotice(state.id ? 'Customer updated.' : 'Customer saved.')
      setShowErrors(false)
      await loadLoanTypes()
      if (selectedLoanType?.id) await loadCustomers(selectedLoanType.id)
    } catch (e) {
      console.error(e)
      setError(e?.message || 'Failed to save customer')
    } finally {
      setSaving(false)
    }
  }

  const confirmDeleteCustomer = async (record) => {
    if (!record?.id) return
    if (!window.confirm(`Delete customer record for ${record.customerName || 'this customer'}?`)) return
    setDeleteConfirming(true)
    try {
      await deleteLoanDocument(record.id)
      if (state.id === record.id) {
        setState(createEmptyLoanDocument(selectedLoanType?.id))
        markClean(createEmptyLoanDocument(selectedLoanType?.id))
        setPage('customers')
      }
      setNotice('Customer deleted.')
      await loadLoanTypes()
      if (selectedLoanType?.id) await loadCustomers(selectedLoanType.id)
    } catch (e) {
      console.error(e)
      alert(e?.message || 'Failed to delete customer')
    } finally {
      setDeleteConfirming(false)
    }
  }

  const headerHandlersRef = useRef({})

  useEffect(() => {
    headerHandlersRef.current = {
      onSave: handleSave,
      onNew: () => {
        if (page === 'types') openTypeForm()
        else if (page === 'customers') requestNewCustomer()
        else if (page === 'editor') {
          if (!confirmDiscardChanges()) return
          requestNewCustomer()
        }
      },
      onBack: () => {
        if (page === 'editor') goToCustomers()
        else if (page === 'customers') goToTypes()
      },
    }
  })

  useEffect(() => {
    if (!onHeaderActions) return undefined
    onHeaderActions({
      mode: page,
      saving,
      loanTypeName: selectedLoanType?.name || '',
      onNew: () => headerHandlersRef.current.onNew?.(),
      onBack: () => headerHandlersRef.current.onBack?.(),
    })
    return () => onHeaderActions(null)
  }, [onHeaderActions, page, saving, selectedLoanType?.name])

  const renderSection = () => (
    <LoanCustomerForm
      section={section}
      state={state}
      selectedLoanType={selectedLoanType}
      updateTop={updateTop}
      updateSection={updateSection}
      showErrors={showErrors}
      validationErrors={validationErrors}
      readOnly={editorReadOnly}
    />
  )

  const totalCustomers = loanTypes.reduce((sum, row) => sum + (row.customerCount || 0), 0)

  return (
    <div className="resume-app docs-app">
      <div className="resume-subnav docs-subnav" role="tablist" aria-label="Documents pages">
        <button type="button" role="tab" aria-selected={page === 'types'} className={`resume-subnav-btn${page === 'types' ? ' active' : ''}`} onClick={goToTypes}>
          Loan types
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={page === 'customers'}
          className={`resume-subnav-btn${page === 'customers' ? ' active' : ''}`}
          disabled={!selectedLoanType?.id}
          onClick={goToCustomers}
        >
          Customers{selectedLoanType?.name ? `: ${selectedLoanType.name}` : ''}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={page === 'editor'}
          className={`resume-subnav-btn${page === 'editor' ? ' active' : ''}`}
          onClick={() => {
            if (page === 'editor') return
            if (state.id) {
              setPage('editor')
              return
            }
            requestNewCustomer()
          }}
        >
          {state.id ? 'Edit customer' : 'New customer'}
        </button>
      </div>

      {page === 'types' && (
        <div className="bills-panel resume-library-panel">
          <div className="bills-shell">
            <div className="bills-toolbar">
              <div className="bills-toolbar-left">
                <div className="bills-search">
                  <span className="bills-search-icon" aria-hidden="true">⌕</span>
                  <input
                    className="bills-search-input"
                    type="search"
                    value={listSearch}
                    onChange={(e) => setListSearch(e.target.value)}
                    placeholder="Search customers, phone, PAN, Aadhaar, bank, login…"
                    aria-label="Search all saved customer details"
                  />
                  {listSearch && (
                    <button type="button" className="bills-search-clear" onClick={() => setListSearch('')} aria-label="Clear search">×</button>
                  )}
                </div>
              </div>
              <div className="bills-header-actions">
                <button type="button" className="bills-refresh-btn" onClick={loadLoanTypes} disabled={typesLoading}>
                  {typesLoading ? 'Refreshing…' : 'Refresh'}
                </button>
                <button type="button" className="bills-primary-btn" onClick={() => openTypeForm()}>
                  New loan type
                </button>
              </div>
            </div>

            {notice && <p className="resume-notice">{notice}</p>}

            {hasActiveSearch && (
              <section className="docs-search-results" aria-label="Customer search results">
                <div className="docs-search-results-head">
                  <h2 className="docs-search-results-title">Customer matches</h2>
                  <span className="docs-search-results-count">
                    {globalSearchLoading ? 'Searching…' : `${globalSearchResults.length} found`}
                  </span>
                </div>

                {!globalSearchLoading && globalSearchResults.length === 0 && (
                  <p className="docs-search-results-empty">No customers match this search across all loan types.</p>
                )}

                {globalSearchResults.length > 0 && (
                  <div className="bills-table-wrap">
                    <table className="bills-table">
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Loan type</th>
                          <th>Matched</th>
                          <th>Status</th>
                          <th className="bills-col-actions">Open</th>
                        </tr>
                      </thead>
                      <tbody>
                        {globalSearchResults.map((row) => (
                          <tr key={row.id}>
                            <td>
                              <button type="button" className="resume-name-link docs-name-link" onClick={() => openCustomerFromSearch(row)}>
                                {row.customerName || 'Untitled'}
                              </button>
                            </td>
                            <td><span className="docs-portal-pill">{row.loanTypeName || '—'}</span></td>
                            <td><span className="bills-row-detail">{getCustomerSearchMatchHint(row, listSearch, row.loanTypeName)}</span></td>
                            <td><span className={`docs-status-pill docs-status-${row.status}`}>{getLoanStatusLabel(row.status)}</span></td>
                            <td className="bills-col-actions">
                              <button type="button" className="bills-primary-btn docs-search-open-btn" onClick={() => openCustomerFromSearch(row)}>
                                Open
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            <div className={`bills-stats${typesLoading ? ' bills-stats-refreshing' : ''}`}>
              <div className="bills-stat-card bills-stat-documents">
                <span className="bills-stat-label">Loan types</span>
                <strong className="bills-stat-value">{loanTypes.length}</strong>
              </div>
              <div className="bills-stat-card bills-stat-estimates">
                <span className="bills-stat-label">Customers</span>
                <strong className="bills-stat-value">{totalCustomers}</strong>
              </div>
            </div>

            {typesLoading && loanTypes.length === 0 && (
              <div className="bills-state-card">
                <div className="bills-spinner" aria-hidden="true" />
                <h2 className="bills-state-title">Loading loan types</h2>
              </div>
            )}

            {!typesLoading && listError && (
              <div className="bills-state-card bills-state-error">
                <div className="bills-state-icon" aria-hidden="true">!</div>
                <h2 className="bills-state-title">Unable to load loan types</h2>
                <p className="bills-state-copy">{listError}</p>
                <button type="button" className="bills-primary-btn" onClick={loadLoanTypes}>Try again</button>
              </div>
            )}

            {!typesLoading && !listError && loanTypes.length === 0 && (
              <div className="bills-state-card">
                <h2 className="bills-state-title">No loan types yet</h2>
                <p className="bills-state-copy">Create your first loan type — for example JanSamarth, Mudra, or a custom scheme name.</p>
                <button type="button" className="bills-primary-btn" onClick={() => openTypeForm()}>New loan type</button>
              </div>
            )}

            {!listError && loanTypes.length > 0 && (
              <div className="docs-type-grid">
                {filteredLoanTypes.map((row) => (
                    <article key={row.id} className="docs-type-card" data-theme={getLoanTypeTheme(row.name)}>
                      <div className="docs-type-accent" aria-hidden="true" />
                      <div className="docs-type-body">
                        <button type="button" className="docs-type-open" onClick={() => openLoanType(row)}>
                          <span className="docs-type-badge" aria-hidden="true">{getLoanTypeInitials(row.name)}</span>
                          <span className="docs-type-copy">
                            <span className="docs-type-name">{row.name}</span>
                            {row.description ? <span className="docs-type-desc">{row.description}</span> : null}
                            <span className="docs-type-meta">
                              {row.customerCount || 0} customer{(row.customerCount || 0) === 1 ? '' : 's'}
                            </span>
                          </span>
                        </button>
                        <div className="docs-type-actions">
                          <button type="button" className="docs-type-action-btn" title="Edit loan type" aria-label="Edit loan type" onClick={() => openTypeForm(row)}>
                            <IconEdit />
                          </button>
                          <button type="button" className="docs-type-action-btn docs-type-action-delete" title="Delete loan type" aria-label="Delete loan type" disabled={deleteConfirming} onClick={() => requestDeleteLoanType(row)}>
                            <IconDelete />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
            )}

            {!listError && loanTypes.length > 0 && hasActiveSearch && filteredLoanTypes.length === 0 && globalSearchResults.length === 0 && !globalSearchLoading && (
              <div className="bills-state-card">
                <h2 className="bills-state-title">No matches</h2>
                <p className="bills-state-copy">Try a customer name, phone number, PAN, Aadhaar, account number, or username.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {page === 'customers' && selectedLoanType && (
        <div className="bills-panel resume-library-panel">
          <div className="bills-shell">
            <div className="bills-toolbar">
              <div className="bills-toolbar-left">
                <div className="bills-search">
                  <span className="bills-search-icon" aria-hidden="true">⌕</span>
                  <input
                    className="bills-search-input"
                    type="search"
                    value={listSearch}
                    onChange={(e) => setListSearch(e.target.value)}
                    placeholder="Search name, phone, PAN, Aadhaar, bank, login…"
                    aria-label="Search all customer details in this loan type"
                  />
                  {listSearch && (
                    <button type="button" className="bills-search-clear" onClick={() => setListSearch('')} aria-label="Clear search">×</button>
                  )}
                </div>
              </div>
              <div className="bills-header-actions">
                <button type="button" className="bills-secondary-btn" onClick={goToTypes}>All loan types</button>
                <button type="button" className="bills-refresh-btn" onClick={() => loadCustomers(selectedLoanType.id, { keepExisting: true })} disabled={customersLoading}>
                  {customersLoading ? 'Refreshing…' : 'Refresh'}
                </button>
                <button type="button" className="bills-primary-btn" onClick={() => openEditorFromList()}>
                  Add customer
                </button>
              </div>
            </div>

            <div className="bills-header">
              <div className="bills-header-copy">
                <p className="bills-kicker">{selectedLoanType.name}</p>
                <h1 className="bills-title">Customers</h1>
                <p className="bills-sub">Manage customer files for this loan type — personal details, KYC, bank info, and portal logins.</p>
              </div>
            </div>

            {notice && <p className="resume-notice">{notice}</p>}

            {customersLoading && customers.length === 0 && (
              <div className="bills-state-card">
                <div className="bills-spinner" aria-hidden="true" />
                <h2 className="bills-state-title">Loading customers</h2>
              </div>
            )}

            {!customersLoading && listError && (
              <div className="bills-state-card bills-state-error">
                <h2 className="bills-state-title">Unable to load customers</h2>
                <p className="bills-state-copy">{listError}</p>
              </div>
            )}

            {!customersLoading && !listError && customers.length === 0 && (
              <div className="bills-state-card">
                <h2 className="bills-state-title">No customers in this loan type</h2>
                <p className="bills-state-copy">Add the first customer and fill in their application details.</p>
                <button type="button" className="bills-primary-btn" onClick={() => openEditorFromList()}>Add customer</button>
              </div>
            )}

            {!customersLoading && !listError && customers.length > 0 && filteredCustomers.length === 0 && (
              <div className="bills-state-card">
                <h2 className="bills-state-title">No matching customers</h2>
                <p className="bills-state-copy">Try a name, phone, PAN, Aadhaar, account number, username, or any saved detail.</p>
              </div>
            )}

            {!listError && filteredCustomers.length > 0 && (
              <div className="bills-table-wrap">
                <table className="bills-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Reference</th>
                      <th>Status</th>
                      <th>Updated</th>
                      <th className="bills-col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <button type="button" className="resume-name-link docs-name-link" onClick={() => openViewFromList(row)}>
                            {displayCell(row.customerName, 'Untitled')}
                          </button>
                        </td>
                        <td><span className="bills-row-detail">{displayCell(row.loanReference)}</span></td>
                        <td><span className={`docs-status-pill docs-status-${row.status}`}>{getLoanStatusLabel(row.status)}</span></td>
                        <td><span className="bills-mono">{formatUpdated(row.updatedAt)}</span></td>
                        <td className="bills-col-actions bills-actions-cell">
                          <div className="bills-row-actions resume-row-actions">
                            <button type="button" className="bills-action-btn bills-action-view" title="View details" aria-label="View details" onClick={() => openViewFromList(row)}>
                              <IconView />
                            </button>
                            <button type="button" className="bills-action-btn bills-action-edit" title="Edit" aria-label="Edit" disabled={deleteConfirming} onClick={() => openEditor(row, selectedLoanType, { readOnly: false })}>
                              <IconEdit />
                            </button>
                            <button type="button" className="bills-action-btn bills-action-delete" title="Delete" aria-label="Delete" disabled={deleteConfirming} onClick={() => { void confirmDeleteCustomer(row) }}>
                              <IconDelete />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {page === 'editor' && (
        <div className="docs-editor-panel">
          <div className="docs-editor-shell">
            <header className="docs-editor-header">
              <div>
                <p className="bills-kicker">{selectedLoanType?.name || 'Customer file'}</p>
                <h2 className="docs-editor-title">{state.customerName || 'New customer'}</h2>
                <p className="docs-editor-sub">{state.loanReference ? `Ref: ${state.loanReference}` : 'Fill in customer details below'}</p>
              </div>
              <div className="docs-editor-header-actions">
                {editorReadOnly && <span className="docs-view-badge">View only</span>}
                {isDirty && <span className="docs-unsaved-badge">Unsaved changes</span>}
                {editorReadOnly ? (
                  <button
                    type="button"
                    className="bills-primary-btn docs-editor-save-btn"
                    onClick={requestEditMode}
                  >
                    Edit customer
                  </button>
                ) : (
                  <button
                    type="button"
                    className="bills-primary-btn docs-editor-save-btn"
                    onClick={() => { void handleSave() }}
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : state.id ? 'Save changes' : 'Save customer'}
                  </button>
                )}
              </div>
            </header>

            {error && <p className="resume-error">{error}</p>}

            <CustomerSectionPicker
              enabledSectionIds={state.enabledSectionIds}
              onChange={updateEnabledSections}
              disabled={editorReadOnly}
            />

            {!state.enabledSectionIds?.length && (
              <p className="docs-category-hint">
                Search and select the data categories you need for this customer. Only chosen sections will appear below.
              </p>
            )}

            <nav className="docs-section-nav docs-section-nav-scroll" aria-label="Detail sections">
              {visibleSections.map((item) => (
                <button key={item.id} type="button" className={`docs-section-btn${section === item.id ? ' active' : ''}`} onClick={() => setSection(item.id)}>
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="docs-section-body">
              {section === 'overview' || state.enabledSectionIds?.includes(section) ? (
                <>
                  {renderSection()}
                  {nextSection && (
                    <div className="docs-section-nav-footer">
                      <button
                        type="button"
                        className="bills-primary-btn docs-section-next-btn"
                        onClick={goToNextSection}
                      >
                        Next: {nextSection.label}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="docs-section-empty">
                  <p>Select one or more data categories above to start filling in this customer&apos;s details.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {typeFormOpen && (
        <div className="app-modal-backdrop" onClick={closeTypeForm} role="presentation">
          <div className="app-modal delete-confirm-modal docs-type-modal" role="dialog" aria-modal="true" aria-labelledby="loan-type-form-title" onClick={(e) => e.stopPropagation()}>
            <h3 id="loan-type-form-title" className="app-modal-title">{typeForm.id ? 'Edit loan type' : 'New loan type'}</h3>
            <p className="app-modal-message">Customers will be grouped under this loan type.</p>
            <div className="docs-type-form">
              <Field label="Name" required error={showTypeFormErrors ? typeFormErrors.name : ''}>
                <input type="text" value={typeForm.name} onChange={(e) => setTypeForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="e.g. JanSamarth Portal" />
              </Field>
              {!typeForm.id && (
                <div className="docs-type-suggestions">
                  <span className="docs-type-suggestions-label">Quick add:</span>
                  {LOAN_TYPE_SUGGESTIONS.map((name) => (
                    <button key={name} type="button" className="docs-type-suggestion-btn" onClick={() => applyTypeSuggestion(name)}>{name}</button>
                  ))}
                </div>
              )}
              <Field label="Description" full>
                <textarea rows={2} value={typeForm.description} onChange={(e) => setTypeForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Optional notes about this loan scheme" />
              </Field>
              <Field label="Default portal URL" full>
                <input type="url" value={typeForm.portalUrl} onChange={(e) => setTypeForm((prev) => ({ ...prev, portalUrl: e.target.value }))} placeholder="https://..." />
              </Field>
            </div>
            <div className="delete-confirm-actions">
              <button type="button" className="app-modal-btn app-modal-btn-secondary" onClick={closeTypeForm} disabled={typeFormSaving}>Cancel</button>
              <button type="button" className="app-modal-btn" onClick={() => { void handleSaveLoanType() }} disabled={typeFormSaving}>
                {typeFormSaving ? 'Saving…' : typeForm.id ? 'Save changes' : 'Create loan type'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteLoanTypeTarget && (
        <div
          className="app-modal-backdrop"
          onClick={() => {
            if (!deleteConfirming) setDeleteLoanTypeTarget(null)
          }}
          role="presentation"
        >
          <div
            className="app-modal delete-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-loan-type-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-loan-type-title" className="app-modal-title">Delete loan type</h3>
            <p className="app-modal-message">
              Delete <strong>{deleteLoanTypeTarget.name || 'this loan type'}</strong> and all customers under it?
            </p>
            <div className="delete-confirm-actions">
              <button
                type="button"
                className="app-modal-btn app-modal-btn-secondary"
                onClick={() => setDeleteLoanTypeTarget(null)}
                disabled={deleteConfirming}
              >
                Cancel
              </button>
              <button
                type="button"
                className="app-modal-btn app-modal-btn-danger"
                onClick={() => { void confirmDeleteLoanType() }}
                disabled={deleteConfirming}
              >
                {deleteConfirming ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AppModal
        open={loanTypeDeletedModal}
        message="Loan type deleted."
        onClose={() => setLoanTypeDeletedModal(false)}
      />
    </div>
  )
}
