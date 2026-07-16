import { useEffect, useId, useMemo, useRef, useState } from 'react'

export default function SearchableServiceSelect({
  value = '',
  services = [],
  onSelect,
  placeholder = 'Search service…',
  disabled = false,
}) {
  const listId = useId()
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const searchText = open ? query : ''
  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return services
    return services.filter((s) => {
      const hay = `${s.description} ${s.category || ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [services, searchText])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const item of filtered) {
      const cat = item.category || 'Other'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat).push(item)
    }
    return [...map.entries()]
  }, [filtered])

  const flatFiltered = filtered
  const inputValue = open ? query : (value || '')

  const pick = (item) => {
    setOpen(false)
    setQuery('')
    onSelect?.(item)
  }

  const openList = () => {
    setQuery(value || '')
    setOpen(true)
    setHighlight(0)
  }

  const onKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault()
      openList()
      return
    }
    if (!open) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, Math.max(0, flatFiltered.length - 1)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = flatFiltered[highlight]
      if (item) pick(item)
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div className={`service-select${open ? ' open' : ''}`} ref={rootRef}>
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        disabled={disabled}
        value={inputValue}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setHighlight(0)
        }}
        onFocus={openList}
        onKeyDown={onKeyDown}
        autoComplete="off"
      />
      {open && (
        <div className="service-select-dropdown" id={listId} role="listbox">
          {flatFiltered.length === 0 ? (
            <div className="service-select-empty">No matching services</div>
          ) : (
            grouped.map(([category, items]) => (
              <div key={category} className="service-select-group">
                <div className="service-select-group-label">{category}</div>
                {items.map((item) => {
                  const idx = flatFiltered.indexOf(item)
                  const active = idx === highlight
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`service-select-option${active ? ' active' : ''}`}
                      onMouseEnter={() => setHighlight(idx)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(item)}
                    >
                      <span className="service-select-option-name">{item.description}</span>
                      <span className="service-select-option-rate">
                        ₹ {Number(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
