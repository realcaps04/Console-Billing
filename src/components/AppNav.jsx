export default function AppNav({
  activeView,
  onNavigate,
  downloading,
  onDownload,
  showDownload = false,
  showBillingNav = true,
  resumeActions = null,
}) {
  const showResumeActions = Boolean(resumeActions)

  return (
    <header className="app-nav">
      <button
        type="button"
        className="app-nav-brand"
        onClick={() => onNavigate('home')}
        title="Home"
        aria-label="Console Projects home"
      >
        <img className="app-nav-logo" src="/favicon.svg" alt="" />
        <div>
          <div className="app-nav-name">Console Projects</div>
          <div className="app-nav-sub">
            {showBillingNav ? 'Billing' : activeView === 'resume' ? 'Resume' : 'Workspace'}
          </div>
        </div>
      </button>

      {showBillingNav ? (
        <nav className="app-nav-links" aria-label="Main">
          <button
            type="button"
            className={`app-nav-link${activeView === 'create' ? ' active' : ''}`}
            onClick={() => onNavigate('create')}
            title="New Invoice"
            aria-label="New Invoice"
          >
            <svg className="app-nav-btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
            <span className="app-nav-btn-label">New Invoice</span>
          </button>
          <button
            type="button"
            className={`app-nav-link${activeView === 'estimate' ? ' active' : ''}`}
            onClick={() => onNavigate('estimate')}
            title="New Estimate"
            aria-label="New Estimate"
          >
            <svg className="app-nav-btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M9 15h6" />
              <path d="M9 11h6" />
            </svg>
            <span className="app-nav-btn-label">New Estimate</span>
          </button>
          <button
            type="button"
            className={`app-nav-link${activeView === 'bills' ? ' active' : ''}`}
            onClick={() => onNavigate('bills')}
            title="Previous Bills"
            aria-label="Previous Bills"
          >
            <svg className="app-nav-btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M8 6h13" />
              <path d="M8 12h13" />
              <path d="M8 18h13" />
              <path d="M3 6h.01" />
              <path d="M3 12h.01" />
              <path d="M3 18h.01" />
            </svg>
            <span className="app-nav-btn-label">Previous Bills</span>
          </button>
          <button
            type="button"
            className={`app-nav-link${activeView === 'services' ? ' active' : ''}`}
            onClick={() => onNavigate('services')}
            title="Manage Services"
            aria-label="Manage Services"
          >
            <svg className="app-nav-btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
            </svg>
            <span className="app-nav-btn-label">Services</span>
          </button>
        </nav>
      ) : showResumeActions ? (
        <div className="app-nav-resume-actions" role="toolbar" aria-label="Resume actions">
          {resumeActions.mode === 'builder' ? (
            <>
              <button
                type="button"
                className="app-nav-resume-btn app-nav-resume-primary"
                onClick={resumeActions.onSave}
                disabled={resumeActions.saving}
              >
                {resumeActions.saving ? 'Saving…' : resumeActions.saveLabel}
              </button>
              <button
                type="button"
                className="app-nav-resume-btn"
                onClick={resumeActions.onViewPdf}
                disabled={resumeActions.busyAction === 'view'}
              >
                {resumeActions.busyAction === 'view' ? 'Opening…' : 'View PDF'}
              </button>
              <button
                type="button"
                className="app-nav-resume-btn"
                onClick={resumeActions.onDownload}
                disabled={resumeActions.busyAction === 'download'}
              >
                {resumeActions.busyAction === 'download' ? 'Generating…' : 'Download PDF'}
              </button>
              <button type="button" className="app-nav-resume-btn" onClick={resumeActions.onNew}>
                New
              </button>
              <button type="button" className="app-nav-resume-btn" onClick={resumeActions.onSaved}>
                Saved
              </button>
            </>
          ) : (
            <button
              type="button"
              className="app-nav-resume-btn app-nav-resume-primary"
              onClick={resumeActions.onNew}
            >
              New Resume
            </button>
          )}
        </div>
      ) : (
        <div className="app-nav-center-spacer" aria-hidden="true" />
      )}

      <div className="app-nav-right">
        {showDownload && (
          <button
            type="button"
            className="btn-download-main app-nav-download"
            onClick={onDownload}
            disabled={downloading}
            title={downloading ? 'Generating PDF…' : 'Download PDF'}
            aria-label={downloading ? 'Generating PDF' : 'Download PDF'}
          >
            {downloading ? (
              <>
                <svg className="app-nav-btn-icon app-nav-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M21 12a9 9 0 11-6.2-8.6" />
                </svg>
                <span className="app-nav-btn-label">Generating…</span>
              </>
            ) : (
              <>
                <svg className="app-nav-btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span className="app-nav-btn-label">Download PDF</span>
              </>
            )}
          </button>
        )}
      </div>
    </header>
  )
}
