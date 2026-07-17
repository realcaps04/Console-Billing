const MODULES = [
  {
    id: 'billing',
    title: 'Console Billing',
    description: 'Create invoices and estimates, manage previous bills, and maintain your service catalog.',
    status: 'available',
    accent: 'billing',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="13" y2="17" />
      </svg>
    ),
  },
  {
    id: 'resume',
    title: 'Resume Builder',
    description: 'Fill your details by category, preview a clean resume layout, and download a polished PDF.',
    status: 'available',
    accent: 'clients',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="12" y2="17" />
        <circle cx="9" cy="8.5" r="1.2" />
      </svg>
    ),
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Track collections, outstanding balances, and monthly revenue summaries.',
    status: 'soon',
    accent: 'reports',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    id: 'documents',
    title: 'Documents',
    description: 'Keep proposals, contracts, and signed copies organized for quick access.',
    status: 'soon',
    accent: 'documents',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    id: 'payments',
    title: 'Payments',
    description: 'Monitor UPI and bank settlements with clearer payment status tracking.',
    status: 'soon',
    accent: 'payments',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Company profile, defaults, and workspace preferences — coming later.',
    status: 'soon',
    accent: 'settings',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
]

export default function HomePage({ onOpenModule }) {
  return (
    <section className="home-panel">
      <div className="home-shell">
        <header className="home-hero">
          <p className="home-kicker">Console Projects</p>
          <h1 className="home-title">Choose a workspace</h1>
          <p className="home-subtitle">
            Open Console Billing or Resume Builder. More modules will appear here as they are built.
          </p>
        </header>

        <div className="home-grid">
          {MODULES.map((mod) => {
            const available = mod.status === 'available'
            const Tag = available ? 'button' : 'div'
            return (
              <Tag
                key={mod.id}
                type={available ? 'button' : undefined}
                className={`home-card home-card-${mod.accent}${available ? ' home-card-available' : ' home-card-soon'}`}
                onClick={available ? () => onOpenModule?.(mod.id) : undefined}
                aria-disabled={!available}
              >
                <div className="home-card-top">
                  <span className="home-card-icon">{mod.icon}</span>
                  <span className={`home-card-badge${available ? ' is-live' : ''}`}>
                    {available ? 'Open' : 'Coming soon'}
                  </span>
                </div>
                <h2 className="home-card-title">{mod.title}</h2>
                <p className="home-card-copy">{mod.description}</p>
                {available && (
                  <span className="home-card-cta">
                    Enter workspace
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                      <path d="M5 12h14" />
                      <path d="M13 5l7 7-7 7" />
                    </svg>
                  </span>
                )}
              </Tag>
            )
          })}
        </div>
      </div>
    </section>
  )
}
