import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import ResumePreview from './ResumePreview'
import DeleteConfirmModal from './DeleteConfirmModal'
import {
  createEmptyResume,
  createEmptyLanguage,
  normalizeLanguages,
  deleteResume,
  fetchResumes,
  getResumeValidationErrors,
  hasResumeValidationErrors,
  RESUME_CATEGORIES,
  saveResume,
  getExperienceDateMode,
  serializeResumeForCompare,
} from '../lib/resumes'
import { downloadResumePdf, viewResumePdf } from '../lib/pdf'
import { parseResumePdfFile } from '../lib/parseResumePdf'
import { formatIndianPhone } from '../utils'

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

function normalizeResume(resume) {
  const empty = createEmptyResume()
  return {
    ...empty,
    ...resume,
    skills: resume.skills?.length ? resume.skills : [''],
    certifications: resume.certifications?.length ? resume.certifications : [''],
    languages: normalizeLanguages(resume.languages),
    experience: resume.experience?.length
      ? resume.experience.map((item) => ({
        ...empty.experience[0],
        ...item,
        dateMode: item.dateMode === 'exact' ? 'exact' : 'year',
      }))
      : empty.experience,
    education: resume.education?.length ? resume.education : empty.education,
    projects: resume.projects?.length ? resume.projects : empty.projects,
  }
}

function formatUpdated(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function IconView() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconPdf() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M12 18v-6" />
      <path d="M9 15l3 3 3-3" />
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

export default function ResumeBuilder({ onHeaderActions, onUnsavedChanges }) {
  const previewRef = useRef(null)
  const libraryPdfRef = useRef(null)
  const uploadInputRef = useRef(null)
  const [page, setPage] = useState('library')
  const [state, setState] = useState(createEmptyResume)
  const [savedBaseline, setSavedBaseline] = useState(() => serializeResumeForCompare(createEmptyResume()))
  const [savedResumes, setSavedResumes] = useState([])
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState('')
  const [listCategory, setListCategory] = useState('all')
  const [listSearch, setListSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyAction, setBusyAction] = useState('')
  const [busyResumeId, setBusyResumeId] = useState(null)
  const [libraryPdfState, setLibraryPdfState] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [showErrors, setShowErrors] = useState(false)
  const [importingPdf, setImportingPdf] = useState(false)
  const [importFileName, setImportFileName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteConfirming, setDeleteConfirming] = useState(false)

  const isDirty = useMemo(
    () => page === 'builder' && serializeResumeForCompare(state) !== savedBaseline,
    [page, state, savedBaseline],
  )

  const markClean = useCallback((resume) => {
    setSavedBaseline(serializeResumeForCompare(normalizeResume(resume)))
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

  const goToLibrary = useCallback(() => {
    if (!confirmDiscardChanges()) return
    setPage('library')
  }, [confirmDiscardChanges])

  const loadResumes = useCallback(async () => {
    setListLoading(true)
    setListError('')
    try {
      const rows = await fetchResumes({ category: listCategory, limit: 50 })
      setSavedResumes(rows)
    } catch (e) {
      console.error(e)
      setListError(e?.message || 'Failed to load resumes')
      setSavedResumes([])
    } finally {
      setListLoading(false)
    }
  }, [listCategory])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadResumes()
    }, 0)
    return () => window.clearTimeout(t)
  }, [loadResumes])

  useEffect(() => {
    if (!notice) return undefined
    const id = window.setTimeout(() => setNotice(''), 2500)
    return () => window.clearTimeout(id)
  }, [notice])

  const filteredSaved = useMemo(() => {
    const q = listSearch.trim().toLowerCase()
    if (!q) return savedResumes
    return savedResumes.filter((row) =>
      `${row.fullName} ${row.headline} ${row.category} ${row.email}`.toLowerCase().includes(q),
    )
  }, [savedResumes, listSearch])

  const hasActiveFilters = Boolean(listSearch.trim()) || listCategory !== 'all'

  const clearFilters = () => {
    setListSearch('')
    setListCategory('all')
  }

  const fieldErrors = useMemo(() => getResumeValidationErrors(state), [state])
  const hasFieldErrors = useMemo(() => hasResumeValidationErrors(fieldErrors), [fieldErrors])
  const err = (key) => (showErrors ? fieldErrors[key] : '')
  const listErr = (section, index) => (showErrors ? fieldErrors[section]?.[index] : '')
  const entryErr = (section, id, key) => (showErrors ? fieldErrors[section]?.[id]?.[key] : '')
  const sectionErr = (section) => (showErrors ? fieldErrors[section]?._section : '')

  const update = (key, value) => setState((prev) => ({ ...prev, [key]: value }))

  const updateListItem = (key, index, value) => {
    setState((prev) => {
      const next = [...(prev[key] || [])]
      next[index] = value
      return { ...prev, [key]: next }
    })
  }

  const addListItem = (key, emptyValue = '') => {
    setState((prev) => ({ ...prev, [key]: [...(prev[key] || []), emptyValue] }))
  }

  const removeListItem = (key, index) => {
    setState((prev) => {
      const next = [...(prev[key] || [])]
      if (next.length <= 1) return prev
      next.splice(index, 1)
      return { ...prev, [key]: next }
    })
  }

  const updateEntry = (key, id, patch) => {
    setState((prev) => ({
      ...prev,
      [key]: (prev[key] || []).map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }))
  }

  const addLanguage = () => {
    setState((prev) => ({
      ...prev,
      languages: [...(prev.languages || []), createEmptyLanguage()],
    }))
  }

  const updateLanguage = (id, patch) => {
    setState((prev) => ({
      ...prev,
      languages: (prev.languages || []).map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }))
  }

  const removeLanguage = (id) => {
    setState((prev) => {
      const next = (prev.languages || []).filter((item) => item.id !== id)
      return { ...prev, languages: next.length ? next : [createEmptyLanguage()] }
    })
  }

  const addExperience = () => {
    setState((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { id: Date.now(), company: '', role: '', dateMode: 'year', startDate: '', endDate: '', current: false, details: '' },
      ],
    }))
  }

  const addEducation = () => {
    setState((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { id: Date.now(), school: '', degree: '', year: '', details: '' },
      ],
    }))
  }

  const addProject = () => {
    setState((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        { id: Date.now(), name: '', link: '', details: '' },
      ],
    }))
  }

  const removeEntry = (key, id) => {
    setState((prev) => {
      const next = (prev[key] || []).filter((item) => item.id !== id)
      return { ...prev, [key]: next.length ? next : prev[key] }
    })
  }

  const onReset = () => {
    const empty = createEmptyResume()
    setState(empty)
    markClean(empty)
    setNotice('')
    setError('')
    setShowErrors(false)
    setImportFileName('')
    if (uploadInputRef.current) uploadInputRef.current.value = ''
  }

  const openBuilder = (resume = null) => {
    if (resume) {
      const next = normalizeResume(resume)
      setState(next)
      markClean(next)
      setNotice(`Editing ${resume.fullName || 'resume'}`)
      setImportFileName('')
    } else {
      if (page === 'builder' && !confirmDiscardChanges()) return
      onReset()
    }
    setError('')
    setShowErrors(false)
    setPage('builder')
  }

  const openBuilderFromList = (resume) => {
    if (page === 'builder' && isDirty && !confirmDiscardChanges()) return
    openBuilder(resume)
  }

  const onImportPdf = async (file) => {
    if (!file) return
    setImportingPdf(true)
    setError('')
    setNotice('')
    try {
      const parsed = await parseResumePdfFile(file, { category: state.category || 'IT' })
      setState(normalizeResume({ ...parsed, id: null, category: state.category || parsed.category || 'IT' }))
      setShowErrors(false)
      setImportFileName(file.name)
      setNotice('PDF imported. Review and edit the autofilled fields, then save.')
    } catch (e) {
      console.error(e)
      setError(e?.message || 'Could not read resume PDF')
      setImportFileName('')
    } finally {
      setImportingPdf(false)
      if (uploadInputRef.current) uploadInputRef.current.value = ''
    }
  }

  const assertValid = () => {
    const nextErrors = getResumeValidationErrors(state)
    if (hasResumeValidationErrors(nextErrors)) {
      setShowErrors(true)
      setError('Fix the highlighted fields before continuing.')
      return false
    }
    setShowErrors(false)
    setError('')
    return true
  }

  const onSave = async () => {
    setNotice('')
    if (!assertValid()) return
    setSaving(true)
    try {
      const saved = await saveResume(state)
      const normalized = normalizeResume(saved)
      setState(normalized)
      markClean(normalized)
      setNotice(saved.id ? 'Resume updated.' : 'Resume created.')
      await loadResumes()
    } catch (e) {
      console.error(e)
      setError(e?.message || 'Failed to save resume')
    } finally {
      setSaving(false)
    }
  }

  const onDownload = async () => {
    if (!previewRef.current) return
    if (!assertValid()) return
    setBusyAction('download')
    setError('')
    try {
      await downloadResumePdf(previewRef.current, state)
      setNotice('PDF downloaded.')
    } catch (e) {
      console.error(e)
      setError(e?.message || 'PDF download failed')
    } finally {
      setBusyAction('')
    }
  }

  const onViewPdf = async () => {
    if (!previewRef.current) return
    if (!assertValid()) return
    setBusyAction('view')
    setError('')
    try {
      await viewResumePdf(previewRef.current, state)
    } catch (e) {
      console.error(e)
      setError(e?.message || 'PDF view failed')
    } finally {
      setBusyAction('')
    }
  }

  const headerHandlersRef = useRef({})

  useEffect(() => {
    headerHandlersRef.current = {
      onSave,
      onViewPdf,
      onDownload,
      onNew: () => {
        if (page === 'builder' && !confirmDiscardChanges()) return
        openBuilder()
      },
      onSaved: goToLibrary,
    }
  })

  useEffect(() => {
    if (!onHeaderActions) return undefined
    onHeaderActions({
      mode: page === 'builder' ? 'builder' : 'library',
      saveLabel: state.id ? 'Update Resume' : 'Create Resume',
      saving,
      busyAction,
      onSave: () => headerHandlersRef.current.onSave?.(),
      onViewPdf: () => headerHandlersRef.current.onViewPdf?.(),
      onDownload: () => headerHandlersRef.current.onDownload?.(),
      onNew: () => headerHandlersRef.current.onNew?.(),
      onSaved: () => headerHandlersRef.current.onSaved?.(),
    })
    return () => onHeaderActions(null)
  }, [onHeaderActions, page, state.id, saving, busyAction])

  const runLibraryPdf = async (resume, mode) => {
    setBusyResumeId(`${resume.id}:${mode}`)
    setListError('')
    try {
      flushSync(() => {
        setLibraryPdfState(normalizeResume(resume))
      })
      if (!libraryPdfRef.current) throw new Error('Resume preview is not ready.')
      if (mode === 'view') await viewResumePdf(libraryPdfRef.current, resume)
      else await downloadResumePdf(libraryPdfRef.current, resume)
    } catch (e) {
      console.error(e)
      setListError(e?.message || (mode === 'view' ? 'PDF view failed' : 'PDF download failed'))
    } finally {
      setLibraryPdfState(null)
      setBusyResumeId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteConfirming(true)
    try {
      await deleteResume(deleteTarget.id)
      if (state.id === deleteTarget.id) onReset()
      setDeleteTarget(null)
      setNotice('Resume deleted.')
      await loadResumes()
    } catch (e) {
      console.error(e)
      alert(e?.message || 'Failed to delete resume')
    } finally {
      setDeleteConfirming(false)
    }
  }

  return (
    <div className="resume-app">
      <div className="resume-subnav" role="tablist" aria-label="Resume pages">
        <button
          type="button"
          role="tab"
          aria-selected={page === 'library'}
          className={`resume-subnav-btn${page === 'library' ? ' active' : ''}`}
          onClick={goToLibrary}
        >
          Saved Resumes
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={page === 'builder'}
          className={`resume-subnav-btn${page === 'builder' ? ' active' : ''}`}
          onClick={() => {
            if (page === 'builder') return
            openBuilder(state.id ? state : null)
          }}
        >
          {state.id ? 'Edit Resume' : 'Create Resume'}
        </button>
      </div>

      {page === 'library' ? (
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
                    placeholder="Search name, headline, email…"
                    aria-label="Search saved resumes"
                  />
                  {listSearch && (
                    <button type="button" className="bills-search-clear" onClick={() => setListSearch('')} aria-label="Clear search">
                      ×
                    </button>
                  )}
                </div>
                <label className="bills-filter">
                  <span className="bills-filter-label">Category</span>
                  <select
                    className="bills-filter-select"
                    value={listCategory}
                    onChange={(e) => setListCategory(e.target.value)}
                    aria-label="Filter by category"
                  >
                    <option value="all">All categories</option>
                    {RESUME_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </label>
                {hasActiveFilters && (
                  <button type="button" className="bills-filter-clear" onClick={clearFilters}>
                    Clear filters
                  </button>
                )}
              </div>
              <div className="bills-header-actions">
                <button type="button" className="bills-refresh-btn" onClick={loadResumes} disabled={listLoading}>
                  {listLoading ? 'Refreshing…' : 'Refresh'}
                </button>
                <button type="button" className="bills-primary-btn" onClick={() => openBuilderFromList()}>
                  New Resume
                </button>
              </div>
            </div>

            <div className="bills-header">
              <div className="bills-header-copy">
                <p className="bills-kicker">Resume Builder</p>
                <h1 className="bills-title">Saved Resumes</h1>
                <p className="bills-sub">Browse generated resumes, open the PDF, or edit and update them.</p>
              </div>
            </div>

            {notice && page === 'library' && <p className="resume-notice">{notice}</p>}

            <div className={`bills-stats${listLoading ? ' bills-stats-refreshing' : ''}`}>
              <div className="bills-stat-card bills-stat-documents">
                <span className="bills-stat-label">Total</span>
                <strong className="bills-stat-value">{savedResumes.length}</strong>
              </div>
              <div className="bills-stat-card bills-stat-estimates">
                <span className="bills-stat-label">Showing</span>
                <strong className="bills-stat-value">{filteredSaved.length}</strong>
              </div>
              <div className="bills-stat-card bills-stat-paid">
                <span className="bills-stat-label">Categories</span>
                <strong className="bills-stat-value">
                  {new Set(savedResumes.map((r) => r.category).filter(Boolean)).size}
                </strong>
              </div>
            </div>

            {listLoading && savedResumes.length === 0 && (
              <div className="bills-state-card">
                <div className="bills-spinner" aria-hidden="true" />
                <h2 className="bills-state-title">Loading resumes</h2>
                <p className="bills-state-copy">Fetching your saved resumes…</p>
              </div>
            )}

            {!listLoading && listError && (
              <div className="bills-state-card bills-state-error">
                <div className="bills-state-icon" aria-hidden="true">!</div>
                <h2 className="bills-state-title">Unable to load resumes</h2>
                <p className="bills-state-copy">{listError}</p>
                <button type="button" className="bills-primary-btn" onClick={loadResumes}>
                  Try again
                </button>
              </div>
            )}

            {!listLoading && !listError && savedResumes.length === 0 && (
              <div className="bills-state-card">
                <div className="bills-state-icon bills-state-icon-empty" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="8" y1="13" x2="16" y2="13" />
                    <line x1="8" y1="17" x2="12" y2="17" />
                  </svg>
                </div>
                <h2 className="bills-state-title">No resumes saved yet</h2>
                <p className="bills-state-copy">Create a resume, save it, and it will appear here.</p>
                <button type="button" className="bills-primary-btn" onClick={() => openBuilderFromList()}>
                  Create Resume
                </button>
              </div>
            )}

            {!listLoading && !listError && savedResumes.length > 0 && filteredSaved.length === 0 && (
              <div className="bills-state-card">
                <h2 className="bills-state-title">No matching resumes</h2>
                <p className="bills-state-copy">Try a different search or category filter.</p>
                <button type="button" className="bills-primary-btn" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            )}

            {!listError && filteredSaved.length > 0 && (
              <div className="bills-table-wrap">
                <table className="bills-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Headline</th>
                      <th>Email</th>
                      <th>Updated</th>
                      <th className="bills-col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSaved.map((row) => {
                      const busyView = busyResumeId === `${row.id}:view`
                      const busyDownload = busyResumeId === `${row.id}:download`
                      return (
                        <tr key={row.id}>
                          <td>
                            <button type="button" className="resume-name-link" onClick={() => openBuilderFromList(row)}>
                              {row.fullName || 'Untitled'}
                            </button>
                          </td>
                          <td>
                            <span className="resume-category-pill">{row.category || '—'}</span>
                          </td>
                          <td>
                            <span className="bills-row-detail" title={row.headline || ''}>
                              {row.headline || '—'}
                            </span>
                          </td>
                          <td>
                            <span className="bills-row-detail" title={row.email || ''}>
                              {row.email || '—'}
                            </span>
                          </td>
                          <td>
                            <span className="bills-mono">{formatUpdated(row.updatedAt)}</span>
                          </td>
                          <td className="bills-col-actions">
                            <div className="bills-actions">
                              <button
                                type="button"
                                className="bills-action-btn"
                                title="View PDF"
                                aria-label="View PDF"
                                disabled={Boolean(busyResumeId)}
                                onClick={() => runLibraryPdf(row, 'view')}
                              >
                                {busyView ? '…' : <IconView />}
                              </button>
                              <button
                                type="button"
                                className="bills-action-btn"
                                title="Download PDF"
                                aria-label="Download PDF"
                                disabled={Boolean(busyResumeId)}
                                onClick={() => runLibraryPdf(row, 'download')}
                              >
                                {busyDownload ? '…' : <IconPdf />}
                              </button>
                              <button
                                type="button"
                                className="bills-action-btn bills-action-edit"
                                title="Edit"
                                aria-label="Edit"
                                onClick={() => openBuilderFromList(row)}
                              >
                                <IconEdit />
                              </button>
                              <button
                                type="button"
                                className="bills-action-btn bills-action-delete"
                                title="Delete"
                                aria-label="Delete"
                                onClick={() => setDeleteTarget(row)}
                              >
                                <IconDelete />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div className="bills-table-footer">
                  <span className="bills-table-count">
                    {filteredSaved.length} resume{filteredSaved.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="resume-layout">
          <aside className="resume-sidebar">
            <div className="resume-sidebar-body">
              {notice && <p className="resume-notice">{notice}</p>}
              {error && <p className="resume-error">{error}</p>}
              {showErrors && hasFieldErrors && (
                <p className="resume-save-hint">Required and invalid fields are highlighted below.</p>
              )}

              <div className="resume-form-section">
                <h3>{state.id ? 'Edit Resume' : 'Create Resume'}</h3>

                <div className="resume-import-box">
                  <div className="resume-import-copy">
                    <strong>Upload existing resume PDF</strong>
                    <p>We extract name, contact, skills, and sections to autofill the form. You can edit everything after import.</p>
                    {importFileName && <span className="resume-import-file">Imported: {importFileName}</span>}
                  </div>
                  <div className="resume-import-actions">
                    <input
                      ref={uploadInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      className="resume-import-input"
                      aria-label="Upload resume PDF"
                      disabled={importingPdf}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) void onImportPdf(file)
                      }}
                    />
                    <button
                      type="button"
                      className="bills-secondary-btn"
                      disabled={importingPdf}
                      onClick={() => uploadInputRef.current?.click()}
                    >
                      {importingPdf ? 'Reading PDF…' : 'Choose PDF'}
                    </button>
                  </div>
                </div>

                <div className="resume-form-grid">
                  <Field label="Full Name" full required error={err('fullName')}>
                    <input
                      value={state.fullName}
                      onChange={(e) => update('fullName', e.target.value)}
                      onBlur={(e) => update('fullName', e.target.value.trim())}
                      placeholder="Your full name"
                      autoComplete="name"
                    />
                  </Field>
                  <Field label="Category" required error={err('category')}>
                    <select value={state.category} onChange={(e) => update('category', e.target.value)}>
                      {RESUME_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Headline" required error={err('headline')}>
                    <input
                      value={state.headline}
                      onChange={(e) => update('headline', e.target.value)}
                      onBlur={(e) => update('headline', e.target.value.trim())}
                      placeholder="e.g. Software Engineer"
                    />
                  </Field>
                  <Field label="Email" required error={err('email')}>
                    <input
                      type="email"
                      value={state.email}
                      onChange={(e) => update('email', e.target.value)}
                      onBlur={(e) => update('email', e.target.value.trim())}
                      placeholder="you@email.com"
                      autoComplete="email"
                    />
                  </Field>
                  <Field label="Phone" required error={err('phone')}>
                    <input
                      type="tel"
                      value={state.phone}
                      onChange={(e) => update('phone', formatIndianPhone(e.target.value))}
                      placeholder="+91 9XXXX XXXXX"
                      inputMode="numeric"
                      autoComplete="tel"
                    />
                  </Field>
                  <Field label="Location" required error={err('location')}>
                    <input
                      value={state.location}
                      onChange={(e) => update('location', e.target.value)}
                      onBlur={(e) => update('location', e.target.value.trim())}
                      placeholder="City, Country"
                      autoComplete="address-level2"
                    />
                  </Field>
                  <Field label="LinkedIn" error={err('linkedin')}>
                    <input
                      value={state.linkedin}
                      onChange={(e) => update('linkedin', e.target.value)}
                      onBlur={(e) => update('linkedin', e.target.value.trim())}
                      placeholder="linkedin.com/in/…"
                    />
                  </Field>
                  <Field label="Portfolio / Website" full error={err('portfolio')}>
                    <input
                      value={state.portfolio}
                      onChange={(e) => update('portfolio', e.target.value)}
                      onBlur={(e) => update('portfolio', e.target.value.trim())}
                      placeholder="https://…"
                    />
                  </Field>
                  <Field label="Professional Summary" full required error={err('summary')}>
                    <textarea
                      rows={4}
                      value={state.summary}
                      onChange={(e) => update('summary', e.target.value)}
                      placeholder="Short professional summary (at least 30 characters)…"
                    />
                  </Field>
                </div>
              </div>

              <div className="resume-form-section">
                <div className="resume-form-section-head">
                  <h3>Skills <span className="resume-req">*</span></h3>
                </div>
                {sectionErr('skills') && <p className="field-error">{sectionErr('skills')}</p>}
                {state.skills.map((skill, index) => (
                  <div key={`skill-${index}`} className={`resume-inline-row${listErr('skills', index) ? ' has-error' : ''}`}>
                    <input
                      value={skill}
                      onChange={(e) => updateListItem('skills', index, e.target.value)}
                      onBlur={(e) => updateListItem('skills', index, e.target.value.trim())}
                      placeholder="Skill"
                      aria-label={`Skill ${index + 1}`}
                    />
                    <button type="button" className="btn-remove resume-entry-remove" onClick={() => removeListItem('skills', index)}>Remove</button>
                    {listErr('skills', index) && <span className="field-error resume-inline-error">{listErr('skills', index)}</span>}
                  </div>
                ))}
                <button type="button" className="btn-add-item resume-add-below" onClick={() => addListItem('skills')}>＋ Add skill</button>
              </div>

              <div className="resume-form-section">
                <div className="resume-form-section-head">
                  <h3>Experience <span className="resume-req">*</span></h3>
                </div>
                {sectionErr('experience') && <p className="field-error">{sectionErr('experience')}</p>}
                {state.experience.map((item) => {
                  const dateMode = getExperienceDateMode(item)
                  return (
                  <div key={item.id} className="resume-entry-card">
                    <div className="resume-form-grid">
                      <Field label="Company" required error={entryErr('experience', item.id, 'company')}>
                        <input value={item.company} onChange={(e) => updateEntry('experience', item.id, { company: e.target.value })} />
                      </Field>
                      <Field label="Role" required error={entryErr('experience', item.id, 'role')}>
                        <input value={item.role} onChange={(e) => updateEntry('experience', item.id, { role: e.target.value })} />
                      </Field>
                      <div className="resume-date-mode full">
                        <span className="resume-date-mode-label">Duration format</span>
                        <div className="resume-date-mode-options" role="group" aria-label="Experience date format">
                          <button
                            type="button"
                            className={`resume-date-mode-btn${dateMode === 'year' ? ' active' : ''}`}
                            onClick={() => updateEntry('experience', item.id, { dateMode: 'year', startDate: '', endDate: '' })}
                          >
                            Year
                          </button>
                          <button
                            type="button"
                            className={`resume-date-mode-btn${dateMode === 'exact' ? ' active' : ''}`}
                            onClick={() => updateEntry('experience', item.id, { dateMode: 'exact', startDate: '', endDate: '' })}
                          >
                            Exact dates
                          </button>
                        </div>
                      </div>
                      <Field
                        label={dateMode === 'exact' ? 'Start date' : 'Start year'}
                        required
                        error={entryErr('experience', item.id, 'startDate')}
                      >
                        {dateMode === 'exact' ? (
                          <input
                            type="date"
                            value={item.startDate}
                            onChange={(e) => updateEntry('experience', item.id, { startDate: e.target.value })}
                          />
                        ) : (
                          <input
                            value={item.startDate}
                            onChange={(e) => updateEntry('experience', item.id, { startDate: e.target.value })}
                            placeholder="YYYY"
                            inputMode="numeric"
                            maxLength={4}
                          />
                        )}
                      </Field>
                      <Field
                        label={dateMode === 'exact' ? 'End date' : 'End year'}
                        required={!item.current}
                        error={entryErr('experience', item.id, 'endDate')}
                      >
                        {dateMode === 'exact' ? (
                          <input
                            type="date"
                            value={item.endDate}
                            disabled={item.current}
                            min={item.startDate || undefined}
                            onChange={(e) => updateEntry('experience', item.id, { endDate: e.target.value })}
                          />
                        ) : (
                          <input
                            value={item.endDate}
                            disabled={item.current}
                            onChange={(e) => updateEntry('experience', item.id, { endDate: e.target.value })}
                            placeholder="YYYY"
                            inputMode="numeric"
                            maxLength={4}
                          />
                        )}
                      </Field>
                      <label className="resume-check">
                        <input
                          type="checkbox"
                          checked={Boolean(item.current)}
                          onChange={(e) => updateEntry('experience', item.id, { current: e.target.checked, endDate: '' })}
                        />
                        Currently working here
                      </label>
                      <Field label="Details" full required error={entryErr('experience', item.id, 'details')}>
                        <textarea
                          rows={3}
                          value={item.details}
                          onChange={(e) => updateEntry('experience', item.id, { details: e.target.value })}
                          placeholder="Key achievements…"
                        />
                      </Field>
                    </div>
                    <button type="button" className="btn-remove resume-entry-remove" onClick={() => removeEntry('experience', item.id)}>Remove</button>
                  </div>
                  )
                })}
                <button type="button" className="btn-add-item resume-add-below" onClick={addExperience}>＋ Add experience</button>
              </div>

              <div className="resume-form-section">
                <div className="resume-form-section-head">
                  <h3>Education <span className="resume-req">*</span></h3>
                </div>
                {sectionErr('education') && <p className="field-error">{sectionErr('education')}</p>}
                {state.education.map((item) => (
                  <div key={item.id} className="resume-entry-card">
                    <div className="resume-form-grid">
                      <Field label="School" required error={entryErr('education', item.id, 'school')}>
                        <input value={item.school} onChange={(e) => updateEntry('education', item.id, { school: e.target.value })} />
                      </Field>
                      <Field label="Degree" required error={entryErr('education', item.id, 'degree')}>
                        <input value={item.degree} onChange={(e) => updateEntry('education', item.id, { degree: e.target.value })} />
                      </Field>
                      <Field label="Year" required error={entryErr('education', item.id, 'year')}>
                        <input value={item.year} onChange={(e) => updateEntry('education', item.id, { year: e.target.value })} placeholder="YYYY" inputMode="numeric" maxLength={4} />
                      </Field>
                      <Field label="Details" full error={entryErr('education', item.id, 'details')}>
                        <textarea
                          rows={2}
                          value={item.details}
                          onChange={(e) => updateEntry('education', item.id, { details: e.target.value })}
                          placeholder="Optional notes…"
                        />
                      </Field>
                    </div>
                    <button type="button" className="btn-remove resume-entry-remove" onClick={() => removeEntry('education', item.id)}>Remove</button>
                  </div>
                ))}
                <button type="button" className="btn-add-item resume-add-below" onClick={addEducation}>＋ Add education</button>
              </div>

              <div className="resume-form-section">
                <div className="resume-form-section-head">
                  <h3>Projects</h3>
                </div>
                {state.projects.map((item) => (
                  <div key={item.id} className="resume-entry-card">
                    <div className="resume-form-grid">
                      <Field label="Name" error={entryErr('projects', item.id, 'name')}>
                        <input value={item.name} onChange={(e) => updateEntry('projects', item.id, { name: e.target.value })} />
                      </Field>
                      <Field label="Link" error={entryErr('projects', item.id, 'link')}>
                        <input value={item.link} onChange={(e) => updateEntry('projects', item.id, { link: e.target.value })} placeholder="https://…" />
                      </Field>
                      <Field label="Details" full error={entryErr('projects', item.id, 'details')}>
                        <textarea
                          rows={2}
                          value={item.details}
                          onChange={(e) => updateEntry('projects', item.id, { details: e.target.value })}
                        />
                      </Field>
                    </div>
                    <button type="button" className="btn-remove resume-entry-remove" onClick={() => removeEntry('projects', item.id)}>Remove</button>
                  </div>
                ))}
                <button type="button" className="btn-add-item resume-add-below" onClick={addProject}>＋ Add project</button>
              </div>

              <div className="resume-form-section">
                <div className="resume-form-section-head">
                  <h3>Certifications</h3>
                </div>
                {state.certifications.map((item, index) => (
                  <div key={`cert-${index}`} className={`resume-inline-row${listErr('certifications', index) ? ' has-error' : ''}`}>
                    <input
                      value={item}
                      onChange={(e) => updateListItem('certifications', index, e.target.value)}
                      onBlur={(e) => updateListItem('certifications', index, e.target.value.trim())}
                      placeholder="Certification"
                      aria-label={`Certification ${index + 1}`}
                    />
                    <button type="button" className="btn-remove resume-entry-remove" onClick={() => removeListItem('certifications', index)}>Remove</button>
                    {listErr('certifications', index) && <span className="field-error resume-inline-error">{listErr('certifications', index)}</span>}
                  </div>
                ))}
                <button type="button" className="btn-add-item resume-add-below" onClick={() => addListItem('certifications')}>＋ Add certification</button>
              </div>

              <div className="resume-form-section">
                <div className="resume-form-section-head">
                  <h3>Languages <span className="resume-req">*</span></h3>
                </div>
                {sectionErr('languages') && <p className="field-error">{sectionErr('languages')}</p>}
                {state.languages.map((item, index) => {
                  const langErr = entryErr('languages', index, 'name') || entryErr('languages', index, 'skills')
                    ? {
                      name: entryErr('languages', index, 'name'),
                      skills: entryErr('languages', index, 'skills'),
                    }
                    : null
                  return (
                    <div key={item.id} className="resume-entry-card resume-language-card">
                      <div className="resume-form-grid">
                        <Field label="Language" full required error={langErr?.name}>
                          <input
                            value={item.name}
                            onChange={(e) => updateLanguage(item.id, { name: e.target.value })}
                            onBlur={(e) => updateLanguage(item.id, { name: e.target.value.trim() })}
                            placeholder="e.g. English"
                            aria-label={`Language ${index + 1}`}
                          />
                        </Field>
                        <div className={`resume-language-skills full${langErr?.skills ? ' has-error' : ''}`}>
                          <span className="resume-date-mode-label">Proficiency</span>
                          <div className="resume-language-skill-options" role="group" aria-label={`Proficiency for ${item.name || 'language'}`}>
                            <label className="resume-check resume-language-skill">
                              <input
                                type="checkbox"
                                checked={Boolean(item.read)}
                                onChange={(e) => updateLanguage(item.id, { read: e.target.checked })}
                              />
                              Read
                            </label>
                            <label className="resume-check resume-language-skill">
                              <input
                                type="checkbox"
                                checked={Boolean(item.write)}
                                onChange={(e) => updateLanguage(item.id, { write: e.target.checked })}
                              />
                              Write
                            </label>
                            <label className="resume-check resume-language-skill">
                              <input
                                type="checkbox"
                                checked={Boolean(item.speak)}
                                onChange={(e) => updateLanguage(item.id, { speak: e.target.checked })}
                              />
                              Speak
                            </label>
                          </div>
                          {langErr?.skills && <span className="field-error">{langErr.skills}</span>}
                        </div>
                      </div>
                      <button type="button" className="btn-remove resume-entry-remove" onClick={() => removeLanguage(item.id)}>Remove</button>
                    </div>
                  )
                })}
                <button type="button" className="btn-add-item resume-add-below" onClick={addLanguage}>＋ Add language</button>
              </div>
            </div>
          </aside>

          <ResumePreview ref={previewRef} state={state} />
        </div>
      )}

      {libraryPdfState && (
        <div className="resume-pdf-offscreen" aria-hidden="true">
          <ResumePreview ref={libraryPdfRef} state={libraryPdfState} />
        </div>
      )}

      <DeleteConfirmModal
        key={deleteTarget?.id || 'resume-delete'}
        open={Boolean(deleteTarget)}
        title="Delete resume"
        messagePrefix="Enter password to permanently delete"
        itemLabel={deleteTarget?.fullName || 'this resume'}
        confirming={deleteConfirming}
        onCancel={() => {
          if (deleteConfirming) return
          setDeleteTarget(null)
        }}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
