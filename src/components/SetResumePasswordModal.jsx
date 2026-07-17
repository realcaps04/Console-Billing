import { useEffect, useRef, useState } from 'react'

export default function SetResumePasswordModal({
  open,
  title = 'Set edit password',
  message = 'Choose a password for this resume. You will need it later to edit the resume.',
  confirmLabel = 'Continue',
  onCancel,
  onConfirm,
}) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
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
    const next = String(password || '').trim()
    if (next.length < 4) {
      setError('Password must be at least 4 characters.')
      return
    }
    if (next !== String(confirm || '').trim()) {
      setError('Passwords do not match.')
      return
    }
    setError('')
    onConfirm?.(next)
  }

  return (
    <div className="app-modal-backdrop" onClick={onCancel} role="presentation">
      <div
        className="app-modal delete-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="set-resume-password-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="set-resume-password-title" className="app-modal-title">{title}</h3>
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
            placeholder="New password"
            autoComplete="new-password"
          />
          <input
            type="password"
            className={`delete-confirm-input${error ? ' has-error' : ''}`}
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value)
              if (error) setError('')
            }}
            placeholder="Confirm password"
            autoComplete="new-password"
            style={{ marginTop: '0.65rem' }}
          />
          {error ? <p className="delete-confirm-error">{error}</p> : null}
          <div className="delete-confirm-actions">
            <button
              type="button"
              className="app-modal-btn app-modal-btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="app-modal-btn"
              disabled={!password || !confirm}
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
