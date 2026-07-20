import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CUSTOMER_SECTION_NAV,
  filterSectionsByQuery,
  normalizeEnabledSectionIds,
  SELECTABLE_CUSTOMER_SECTIONS,
} from '../lib/loanCustomerSections'

export default function CustomerSectionPicker({
  enabledSectionIds,
  onChange,
  disabled = false,
}) {
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selected = useMemo(
    () => normalizeEnabledSectionIds(enabledSectionIds),
    [enabledSectionIds],
  )

  const selectedSet = useMemo(() => new Set(selected), [selected])

  const filtered = useMemo(() => filterSectionsByQuery(search), [search])

  useEffect(() => {
    if (!open) return undefined
    const onDocClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const toggleSection = (id) => {
    const next = new Set(selectedSet)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange?.([...next])
  }

  const selectAllVisible = () => {
    const next = new Set(selectedSet)
    filtered.forEach((item) => next.add(item.id))
    onChange?.([...next])
  }

  const clearAll = () => {
    onChange?.([])
  }

  const selectedLabels = CUSTOMER_SECTION_NAV
    .filter((item) => selectedSet.has(item.id))
    .map((item) => item.label)

  return (
    <div className="docs-category-picker" ref={rootRef}>
      <div className="docs-category-picker-bar">
        <button
          type="button"
          className={`docs-category-picker-trigger${open ? ' open' : ''}`}
          onClick={() => !disabled && setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
        >
          <span className="docs-category-picker-trigger-label">Data categories</span>
          <span className="docs-category-picker-trigger-meta">
            {selected.length ? `${selected.length} selected` : 'Choose categories'}
          </span>
          <span className="docs-category-picker-chevron" aria-hidden="true">▾</span>
        </button>

        {selected.length > 0 && (
          <div className="docs-category-picker-chips" aria-label="Selected categories">
            {selectedLabels.slice(0, 4).map((label) => (
              <span key={label} className="docs-category-chip">{label}</span>
            ))}
            {selectedLabels.length > 4 && (
              <span className="docs-category-chip docs-category-chip-more">+{selectedLabels.length - 4} more</span>
            )}
          </div>
        )}
      </div>

      {open && (
        <div className="docs-category-picker-panel" role="listbox" aria-multiselectable="true" aria-label="Choose data categories">
          <div className="docs-category-picker-search-wrap">
            <span className="bills-search-icon" aria-hidden="true">⌕</span>
            <input
              className="docs-category-picker-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories…"
              aria-label="Search data categories"
              autoFocus
            />
            {search && (
              <button type="button" className="bills-search-clear" onClick={() => setSearch('')} aria-label="Clear search">
                ×
              </button>
            )}
          </div>

          <div className="docs-category-picker-actions">
            <button type="button" className="docs-category-picker-action" onClick={selectAllVisible}>
              Select visible
            </button>
            <button type="button" className="docs-category-picker-action" onClick={clearAll}>
              Clear all
            </button>
            <span className="docs-category-picker-count">{selected.length} / {SELECTABLE_CUSTOMER_SECTIONS.length}</span>
          </div>

          <div className="docs-category-picker-list">
            {filtered.length === 0 && (
              <p className="docs-category-picker-empty">No categories match your search.</p>
            )}
            {filtered.map((item) => {
              const checked = selectedSet.has(item.id)
              return (
                <label key={item.id} className={`docs-category-option${checked ? ' selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSection(item.id)}
                  />
                  <span className="docs-category-option-copy">
                    <span className="docs-category-option-label">{item.label}</span>
                    <span className="docs-category-option-hint">{item.keywords}</span>
                  </span>
                </label>
              )
            })}
          </div>

          <div className="docs-category-picker-footer">
            <button type="button" className="bills-primary-btn" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
