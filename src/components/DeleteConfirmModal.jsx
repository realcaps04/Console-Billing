import { useEffect, useRef, useState } from 'react'

const DELETE_PASSWORD = '3455'

export default function DeleteConfirmModal({ open, invoiceLabel, confirming = false, onCancel, onConfirm }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const id = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(id)
  }, [open])

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password !== DELETE_PASSWORD) {
      setError('Incorrect password.')
      return
    }
    setError('')
    onConfirm?.()
  }

  return (
    <div className="app-modal-backdrop" onClick={onCancel} role="presentation">
      <div
        className="app-modal delete-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="delete-modal-title" className="app-modal-title">Delete invoice</h3>
        <p className="app-modal-message">
          Enter password to permanently delete{' '}
          <strong>{invoiceLabel || 'this invoice'}</strong>.
        </p>
        <form className="delete-confirm-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            className={`delete-confirm-input${error ? ' has-error' : ''}`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) setError('')
            }}
            placeholder="Password"
            autoComplete="off"
            disabled={confirming}
          />
          {error ? <p className="delete-confirm-error">{error}</p> : null}
          <div className="delete-confirm-actions">
            <button
              type="button"
              className="app-modal-btn app-modal-btn-secondary"
              onClick={onCancel}
              disabled={confirming}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="app-modal-btn app-modal-btn-danger"
              disabled={confirming || !password}
            >
              {confirming ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
