import { useEffect, useRef, useState } from 'react'

export const APP_ACCESS_PASSWORD = '3455'

export default function PasswordUnlockModal({
  open,
  title = 'Enter password',
  message = 'Enter password to continue.',
  confirmLabel = 'Continue',
  confirming = false,
  onCancel,
  onConfirm,
}) {
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
    if (password !== APP_ACCESS_PASSWORD) {
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
        aria-labelledby="unlock-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="unlock-modal-title" className="app-modal-title">{title}</h3>
        <p className="app-modal-message">{message}</p>
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
              className="app-modal-btn"
              disabled={confirming || !password}
            >
              {confirming ? 'Opening…' : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
