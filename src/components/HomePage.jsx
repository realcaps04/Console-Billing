import { useState } from 'react'
import PasswordUnlockModal from './PasswordUnlockModal'

const MODULES = [
  {
    id: 'billing',
    title: 'Console Billing',
    description: 'Invoices, estimates, bill history, and your service catalog — in one place.',
    status: 'available',
    accent: 'billing',
    requiresPassword: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
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
    description: 'Structured profiles by category, live preview, and export-ready PDFs.',
    status: 'available',
    accent: 'resume',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Collections, outstanding balances, and monthly revenue at a glance.',
    status: 'soon',
    accent: 'reports',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    id: 'documents',
    title: 'Documents',
    description: 'Proposals, contracts, and signed copies — organized and searchable.',
    status: 'soon',
    accent: 'documents',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    id: 'payments',
    title: 'Payments',
    description: 'UPI and bank settlements with clearer status and reconciliation.',
    status: 'soon',
    accent: 'payments',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Company profile, defaults, and workspace preferences.',
    status: 'soon',
    accent: 'settings',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
]

function ModuleCard({ mod, onOpen }) {
  const available = mod.status === 'available'
  const Tag = available ? 'button' : 'article'

  return (
    <Tag
      type={available ? 'button' : undefined}
      className={`home-card home-card-${mod.accent}${available ? ' home-card-available' : ' home-card-soon'}`}
      onClick={available ? onOpen : undefined}
      aria-disabled={!available}
    >
      <div className="home-card-accent" aria-hidden="true" />

      <div className="home-card-body">
        <div className="home-card-head">
          <span className="home-card-icon">{mod.icon}</span>
          <span className={`home-card-badge${available ? ' is-active' : ''}`}>
            {available ? 'Active' : 'Planned'}
          </span>
        </div>

        <h3 className="home-card-title">{mod.title}</h3>
        <p className="home-card-copy">{mod.description}</p>
      </div>

      {available ? (
        <div className="home-card-foot">
          {mod.requiresPassword && (
            <span className="home-card-lock" title="Password required">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              Protected
            </span>
          )}
          <span className="home-card-cta">
            Open workspace
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="M13 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      ) : (
        <div className="home-card-foot home-card-foot-muted">
          <span className="home-card-soon-label">On the roadmap</span>
        </div>
      )}
    </Tag>
  )
}

export default function HomePage({ onOpenModule }) {
  const [unlockTarget, setUnlockTarget] = useState(null)

  const activeModules = MODULES.filter((m) => m.status === 'available')
  const plannedModules = MODULES.filter((m) => m.status === 'soon')

  const handleModuleClick = (mod) => {
    if (mod.requiresPassword) {
      setUnlockTarget(mod)
      return
    }
    onOpenModule?.(mod.id)
  }

  return (
    <section className="home-panel">
      <div className="home-shell">
        <header className="home-hero">
          <div className="home-hero-main">
            <p className="home-kicker">Console Projects</p>
            <h1 className="home-title">Choose a workspace</h1>
            <p className="home-subtitle">
              Select a module to get started. Billing and Resume Builder are live; additional tools will roll out here over time.
            </p>
          </div>
          <dl className="home-stats">
            <div className="home-stat">
              <dt>Active</dt>
              <dd>{activeModules.length}</dd>
            </div>
            <div className="home-stat">
              <dt>Planned</dt>
              <dd>{plannedModules.length}</dd>
            </div>
          </dl>
        </header>

        <section className="home-section" aria-labelledby="home-active-heading">
          <h2 id="home-active-heading" className="home-section-title">Active workspaces</h2>
          <div className="home-grid home-grid-featured">
            {activeModules.map((mod) => (
              <ModuleCard key={mod.id} mod={mod} onOpen={() => handleModuleClick(mod)} />
            ))}
          </div>
        </section>

        <section className="home-section" aria-labelledby="home-planned-heading">
          <h2 id="home-planned-heading" className="home-section-title">In development</h2>
          <div className="home-grid">
            {plannedModules.map((mod) => (
              <ModuleCard key={mod.id} mod={mod} />
            ))}
          </div>
        </section>
      </div>

      <PasswordUnlockModal
        key={unlockTarget?.id || 'billing-unlock'}
        open={Boolean(unlockTarget)}
        title={`Open ${unlockTarget?.title || 'workspace'}`}
        message={`Enter password to open ${unlockTarget?.title || 'this workspace'}.`}
        confirmLabel="Open workspace"
        onCancel={() => setUnlockTarget(null)}
        onConfirm={() => {
          const id = unlockTarget?.id
          setUnlockTarget(null)
          if (id) onOpenModule?.(id)
        }}
      />
    </section>
  )
}
