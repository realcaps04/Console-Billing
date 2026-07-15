export default function AppNav({ activeView, onNavigate }) {
  return (
    <header className="app-nav">
      <div className="app-nav-brand">
        <div className="app-nav-icon">CP</div>
        <div>
          <div className="app-nav-name">Console Projects</div>
          <div className="app-nav-sub">Billing</div>
        </div>
      </div>

      <nav className="app-nav-links" aria-label="Main">
        <button
          type="button"
          className={`app-nav-link${activeView === 'create' ? ' active' : ''}`}
          onClick={() => onNavigate('create')}
        >
          New Invoice
        </button>
        <button
          type="button"
          className={`app-nav-link${activeView === 'bills' ? ' active' : ''}`}
          onClick={() => onNavigate('bills')}
        >
          Previous Bills
        </button>
      </nav>
    </header>
  )
}
