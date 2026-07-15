export default function AppNav({ activeView, onNavigate, downloading, onDownload }) {
  return (
    <header className="app-nav">
      <div className="app-nav-brand">
        <img className="app-nav-logo" src="/favicon.svg" alt="Console Projects" />
        <div>
          <div className="app-nav-name">Console Projects</div>
          <div className="app-nav-sub">Billing</div>
        </div>
      </div>

      <div className="app-nav-right">
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

        {activeView === 'create' && (
          <button
            type="button"
            className="btn-download-main app-nav-download"
            onClick={onDownload}
            disabled={downloading}
          >
            {downloading ? (
              <>Generating…</>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download PDF
              </>
            )}
          </button>
        )}
      </div>
    </header>
  )
}
