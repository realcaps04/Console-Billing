export default function AppModal({ open, title, message, confirmLabel = 'OK', onClose }) {
  if (!open) return null

  return (
    <div className="app-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="app-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {title ? <h3 id="app-modal-title" className="app-modal-title">{title}</h3> : null}
        <p className="app-modal-message">{message}</p>
        <button type="button" className="app-modal-btn" onClick={onClose}>
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}
