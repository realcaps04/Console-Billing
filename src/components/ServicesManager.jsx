import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fmt } from '../utils'
import {
  createServiceItem,
  deleteServiceItem,
  fetchServiceItems,
  updateServiceItem,
} from '../lib/serviceItems'

const EMPTY_FORM = {
  description: '',
  rate: '',
  category: '',
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

export default function ServicesManager({ autoLoad = false }) {
  const loadedRef = useRef(false)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [notice, setNotice] = useState('')

  const loadServices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchServiceItems({ allowFallback: false })
      setServices(rows)
    } catch (e) {
      console.error(e)
      setError(e?.message || 'Failed to load services')
      setServices([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!autoLoad || loadedRef.current) return
    loadedRef.current = true
    loadServices()
  }, [autoLoad, loadServices])

  useEffect(() => {
    if (!notice) return undefined
    const id = window.setTimeout(() => setNotice(''), 2500)
    return () => window.clearTimeout(id)
  }, [notice])

  const categories = useMemo(() => {
    const set = new Set()
    for (const s of services) {
      if (s.category) set.add(s.category)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [services])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return services.filter((s) => {
      if (categoryFilter !== 'all' && (s.category || '') !== categoryFilter) return false
      if (!q) return true
      return `${s.description} ${s.category}`.toLowerCase().includes(q)
    })
  }, [services, search, categoryFilter])

  const closeForm = () => {
    if (saving) return
    setFormOpen(false)
    setForm(EMPTY_FORM)
    setEditingId(null)
    setFormError('')
  }

  const openAddForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setFormOpen(true)
  }

  const startEdit = (service) => {
    setEditingId(service.id)
    setForm({
      description: service.description || '',
      rate: service.rate === 0 ? '0' : String(service.rate ?? ''),
      category: service.category || '',
    })
    setFormError('')
    setFormOpen(true)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      const payload = {
        description: form.description.trim(),
        rate: form.rate,
        category: form.category.trim(),
      }
      if (editingId) {
        const updated = await updateServiceItem(editingId, payload)
        setServices((prev) =>
          prev
            .map((s) => (s.id === editingId ? updated : s))
            .sort((a, b) =>
              `${a.category} ${a.description}`.localeCompare(`${b.category} ${b.description}`),
            ),
        )
        setNotice('Service updated.')
      } else {
        const created = await createServiceItem(payload)
        setServices((prev) =>
          [...prev, created].sort((a, b) =>
            `${a.category} ${a.description}`.localeCompare(`${b.category} ${b.description}`),
          ),
        )
        setNotice('Service added.')
      }
      setFormOpen(false)
      setForm(EMPTY_FORM)
      setEditingId(null)
    } catch (err) {
      console.error(err)
      setFormError(err?.message || 'Failed to save service')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (service) => {
    const ok = window.confirm(`Delete service “${service.description}”?`)
    if (!ok) return
    setBusyId(service.id)
    try {
      await deleteServiceItem(service.id)
      setServices((prev) => prev.filter((s) => s.id !== service.id))
      if (editingId === service.id) closeForm()
      setNotice('Service deleted.')
    } catch (err) {
      console.error(err)
      alert(err?.message || 'Failed to delete service')
    } finally {
      setBusyId(null)
    }
  }

  const hasFilters = Boolean(search.trim()) || categoryFilter !== 'all'
  const pricedCount = services.filter((s) => Number(s.rate) > 0).length

  return (
    <section className="bills-panel services-panel">
      <div className="bills-shell">
        <div className="services-header">
          <div className="services-header-actions">
            <button type="button" className="bills-refresh-btn" onClick={loadServices} disabled={loading}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
              </svg>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button type="button" className="bills-primary-btn" onClick={openAddForm} disabled={Boolean(error)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add service
            </button>
          </div>
        </div>

        {notice && <div className="services-toast">{notice}</div>}

        {!error && (
          <div className="bills-stats services-stats">
            <div className="bills-stat-card bills-stat-documents">
              <span className="bills-stat-label">Total services</span>
              <strong className="bills-stat-value">{services.length}</strong>
            </div>
            <div className="bills-stat-card bills-stat-estimates">
              <span className="bills-stat-label">Categories</span>
              <strong className="bills-stat-value">{categories.length}</strong>
            </div>
            <div className="bills-stat-card bills-stat-paid">
              <span className="bills-stat-label">With rate</span>
              <strong className="bills-stat-value">{pricedCount}</strong>
            </div>
            <div className="bills-stat-card bills-stat-unpaid">
              <span className="bills-stat-label">Zero rate</span>
              <strong className="bills-stat-value">{services.length - pricedCount}</strong>
            </div>
          </div>
        )}

        <div className="bills-toolbar services-toolbar">
          <div className="bills-toolbar-left">
            <label className="bills-search">
              <svg className="bills-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" />
              </svg>
              <input
                type="search"
                className="bills-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services…"
                aria-label="Search services"
              />
              {search && (
                <button
                  type="button"
                  className="bills-search-clear"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </label>
            <label className="bills-filter">
              <span className="bills-filter-label">Category</span>
              <select
                className="bills-filter-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="all">All categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </label>
            {hasFilters && (
              <button
                type="button"
                className="bills-filter-clear"
                onClick={() => {
                  setSearch('')
                  setCategoryFilter('all')
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {loading && services.length === 0 && (
          <div className="bills-state-card">
            <div className="bills-spinner" aria-hidden="true" />
            <h2 className="bills-state-title">Loading services</h2>
            <p className="bills-state-copy">Fetching catalog from Supabase…</p>
          </div>
        )}

        {!loading && error && (
          <div className="bills-state-card bills-state-error">
            <div className="bills-state-icon" aria-hidden="true">!</div>
            <h2 className="bills-state-title">Unable to load services</h2>
            <p className="bills-state-copy">{error}</p>
            <button type="button" className="bills-primary-btn" onClick={loadServices}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="bills-state-card">
            <h2 className="bills-state-title">{services.length === 0 ? 'No services yet' : 'No matching services'}</h2>
            <p className="bills-state-copy">
              {services.length === 0
                ? 'Click Add service to create your first catalog entry.'
                : 'Try a different search or category filter.'}
            </p>
            {services.length === 0 && (
              <button type="button" className="bills-primary-btn" onClick={openAddForm}>
                Add service
              </button>
            )}
          </div>
        )}

        {!error && filtered.length > 0 && (
          <div className="bills-table-wrap">
            <table className="bills-table services-table">
              <thead>
                <tr>
                  <th className="services-col-desc">Description</th>
                  <th className="services-col-category">Category</th>
                  <th className="services-col-rate">Rate</th>
                  <th className="services-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((service) => {
                  const busy = busyId === service.id
                  return (
                    <tr key={service.id}>
                      <td className="services-col-desc">
                        <span className="services-desc" title={service.description}>{service.description}</span>
                      </td>
                      <td className="services-col-category">
                        <span className="services-category-badge">{service.category || '—'}</span>
                      </td>
                      <td className="services-col-rate">
                        <span className="bills-mono">{fmt(service.rate)}</span>
                      </td>
                      <td className="services-col-actions">
                        <div className="bills-row-actions">
                          <button
                            type="button"
                            className="bills-action-btn bills-action-edit"
                            onClick={() => startEdit(service)}
                            disabled={busy}
                            title="Edit"
                            aria-label="Edit"
                          >
                            <IconEdit />
                          </button>
                          <button
                            type="button"
                            className="bills-action-btn bills-action-delete"
                            onClick={() => onDelete(service)}
                            disabled={busy}
                            title="Delete"
                            aria-label="Delete"
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
                Showing {filtered.length} of {services.length} service{services.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        )}
      </div>

      {formOpen && (
        <div className="app-modal-backdrop" onClick={closeForm} role="presentation">
          <div
            className="app-modal services-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="services-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="services-modal-head">
              <h3 id="services-modal-title" className="app-modal-title">
                {editingId ? 'Edit service' : 'Add new service'}
              </h3>
              <button
                type="button"
                className="services-modal-close"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form className="services-modal-form" onSubmit={onSubmit}>
              <label className="services-field">
                <span>Description</span>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. GST Portal"
                  required
                  autoFocus
                />
              </label>
              <label className="services-field">
                <span>Rate (₹)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.rate}
                  onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
                  placeholder="0"
                />
              </label>
              <label className="services-field">
                <span>Category</span>
                <input
                  type="text"
                  list="service-category-options"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Business & Compliance"
                />
                <datalist id="service-category-options">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </label>

              {formError && <p className="services-form-error">{formError}</p>}

              <div className="services-modal-actions">
                <button type="button" className="bills-refresh-btn" onClick={closeForm} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="bills-primary-btn" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Update service' : 'Add service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
