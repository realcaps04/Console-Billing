import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fmt } from '../utils'
import {
  createServiceItem,
  deleteServiceItem,
  deleteServiceItems,
  fetchServiceItems,
  updateServiceItem,
} from '../lib/serviceItems'
import DeleteConfirmModal from './DeleteConfirmModal'

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
  const [rateFilter, setRateFilter] = useState('all')
  const [minRate, setMinRate] = useState('')
  const [maxRate, setMaxRate] = useState('')
  const [sortBy, setSortBy] = useState('name_asc')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [notice, setNotice] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteConfirming, setDeleteConfirming] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])

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
    const min = minRate === '' ? null : Number(minRate)
    const max = maxRate === '' ? null : Number(maxRate)

    let rows = services.filter((s) => {
      if (categoryFilter !== 'all' && (s.category || '') !== categoryFilter) return false

      const rate = Number(s.rate) || 0
      if (rateFilter === 'zero' && rate !== 0) return false
      if (rateFilter === 'priced' && rate <= 0) return false
      if (min !== null && !Number.isNaN(min) && rate < min) return false
      if (max !== null && !Number.isNaN(max) && rate > max) return false

      if (!q) return true
      return `${s.description} ${s.category}`.toLowerCase().includes(q)
    })

    rows = [...rows].sort((a, b) => {
      const rateA = Number(a.rate) || 0
      const rateB = Number(b.rate) || 0
      const nameA = (a.description || '').toLowerCase()
      const nameB = (b.description || '').toLowerCase()
      if (sortBy === 'name_desc') return nameB.localeCompare(nameA)
      if (sortBy === 'rate_asc') return rateA - rateB || nameA.localeCompare(nameB)
      if (sortBy === 'rate_desc') return rateB - rateA || nameA.localeCompare(nameB)
      return nameA.localeCompare(nameB)
    })

    return rows
  }, [services, search, categoryFilter, rateFilter, minRate, maxRate, sortBy])

  const clearFilters = () => {
    setSearch('')
    setCategoryFilter('all')
    setRateFilter('all')
    setMinRate('')
    setMaxRate('')
    setSortBy('name_asc')
  }

  const filteredIds = useMemo(() => filtered.map((s) => s.id), [filtered])
  const selectedCount = selectedIds.length
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id))
  const someFilteredSelected = filteredIds.some((id) => selectedIds.includes(id))

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)))
      return
    }
    setSelectedIds((prev) => [...new Set([...prev, ...filteredIds])])
  }

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

  const requestDelete = (service) => {
    setDeleteTarget({ type: 'single', service })
  }

  const requestBulkDelete = () => {
    if (!selectedIds.length) return
    setDeleteTarget({ type: 'bulk', ids: [...selectedIds] })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteConfirming(true)
    try {
      if (deleteTarget.type === 'bulk') {
        const ids = deleteTarget.ids
        setBusyId('bulk')
        await deleteServiceItems(ids)
        setServices((prev) => prev.filter((s) => !ids.includes(s.id)))
        setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)))
        if (editingId && ids.includes(editingId)) closeForm()
        setNotice(`${ids.length} service${ids.length === 1 ? '' : 's'} deleted.`)
      } else {
        const service = deleteTarget.service
        setBusyId(service.id)
        await deleteServiceItem(service.id)
        setServices((prev) => prev.filter((s) => s.id !== service.id))
        setSelectedIds((prev) => prev.filter((id) => id !== service.id))
        if (editingId === service.id) closeForm()
        setNotice('Service deleted.')
      }
      setDeleteTarget(null)
    } catch (err) {
      console.error(err)
      alert(err?.message || 'Failed to delete service')
    } finally {
      setDeleteConfirming(false)
      setBusyId(null)
    }
  }

  const deleteModalLabel = deleteTarget?.type === 'bulk'
    ? `${deleteTarget.ids.length} selected service${deleteTarget.ids.length === 1 ? '' : 's'}`
    : deleteTarget?.service?.description

  const hasFilters = Boolean(search.trim())
    || categoryFilter !== 'all'
    || rateFilter !== 'all'
    || minRate !== ''
    || maxRate !== ''
    || sortBy !== 'name_asc'

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
                placeholder="Search by name…"
                aria-label="Search by name"
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
            <label className="bills-filter">
              <span className="bills-filter-label">Rate</span>
              <select
                className="bills-filter-select"
                value={rateFilter}
                onChange={(e) => setRateFilter(e.target.value)}
                aria-label="Filter by rate"
              >
                <option value="all">All rates</option>
                <option value="priced">With rate</option>
                <option value="zero">Zero rate</option>
              </select>
            </label>
            <label className="bills-filter services-rate-range">
              <span className="bills-filter-label">Min ₹</span>
              <input
                type="number"
                className="services-rate-input"
                min="0"
                step="0.01"
                value={minRate}
                onChange={(e) => setMinRate(e.target.value)}
                placeholder="0"
                aria-label="Minimum rate"
              />
            </label>
            <label className="bills-filter services-rate-range">
              <span className="bills-filter-label">Max ₹</span>
              <input
                type="number"
                className="services-rate-input"
                min="0"
                step="0.01"
                value={maxRate}
                onChange={(e) => setMaxRate(e.target.value)}
                placeholder="Any"
                aria-label="Maximum rate"
              />
            </label>
            <label className="bills-filter">
              <span className="bills-filter-label">Sort</span>
              <select
                className="bills-filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort services"
              >
                <option value="name_asc">Name A–Z</option>
                <option value="name_desc">Name Z–A</option>
                <option value="rate_asc">Rate low–high</option>
                <option value="rate_desc">Rate high–low</option>
              </select>
            </label>
            {hasFilters && (
              <button
                type="button"
                className="bills-filter-clear"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}
            {selectedCount > 0 && (
              <>
                <span className="services-selected-count">{selectedCount} selected</span>
                <button
                  type="button"
                  className="bills-filter-clear"
                  onClick={requestBulkDelete}
                  disabled={busyId === 'bulk'}
                >
                  Delete selected
                </button>
                <button
                  type="button"
                  className="bills-refresh-btn"
                  onClick={() => setSelectedIds([])}
                  disabled={deleteConfirming}
                >
                  Clear selection
                </button>
              </>
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
                  <th className="services-col-check">
                    <input
                      type="checkbox"
                      className="services-check"
                      checked={allFilteredSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected
                      }}
                      onChange={toggleSelectAllFiltered}
                      aria-label="Select all visible services"
                    />
                  </th>
                  <th className="services-col-desc">Description</th>
                  <th className="services-col-category">Category</th>
                  <th className="services-col-rate">Rate</th>
                  <th className="services-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((service) => {
                  const busy = busyId === service.id || busyId === 'bulk'
                  const checked = selectedIds.includes(service.id)
                  return (
                    <tr key={service.id} className={checked ? 'services-row-selected' : undefined}>
                      <td className="services-col-check">
                        <input
                          type="checkbox"
                          className="services-check"
                          checked={checked}
                          onChange={() => toggleSelect(service.id)}
                          aria-label={`Select ${service.description}`}
                        />
                      </td>
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
                            onClick={() => requestDelete(service)}
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

      <DeleteConfirmModal
        key={
          deleteTarget?.type === 'bulk'
            ? `bulk-${deleteTarget.ids.join('-')}`
            : deleteTarget?.service?.id || 'service-delete'
        }
        open={Boolean(deleteTarget)}
        title={deleteTarget?.type === 'bulk' ? 'Delete services' : 'Delete service'}
        messagePrefix="Enter password to permanently delete"
        itemLabel={deleteModalLabel}
        confirming={deleteConfirming}
        onCancel={() => {
          if (deleteConfirming) return
          setDeleteTarget(null)
        }}
        onConfirm={confirmDelete}
      />
    </section>
  )
}
