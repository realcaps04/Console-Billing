const VIEW_STORAGE_KEY = 'consolebilling_active_view'
const RESUME_PAGE_STORAGE_KEY = 'consolebilling_resume_page'
const VALID_VIEWS = new Set(['home', 'create', 'estimate', 'bills', 'services', 'resume'])
const VALID_RESUME_PAGES = new Set(['library', 'builder'])

function parseLocationRoute() {
  const raw = String(window.location.hash || '').replace(/^#/, '').trim()
  const [viewPart, pagePart] = raw.split('/')
  const view = VALID_VIEWS.has(viewPart) ? viewPart : null
  const resumePage = view === 'resume' && VALID_RESUME_PAGES.has(pagePart) ? pagePart : null
  return { view, resumePage }
}

function getStoredView() {
  try {
    const stored = sessionStorage.getItem(VIEW_STORAGE_KEY) || localStorage.getItem(VIEW_STORAGE_KEY)
    return VALID_VIEWS.has(stored) ? stored : null
  } catch {
    return null
  }
}

function getStoredResumePage() {
  try {
    const stored = sessionStorage.getItem(RESUME_PAGE_STORAGE_KEY) || localStorage.getItem(RESUME_PAGE_STORAGE_KEY)
    return VALID_RESUME_PAGES.has(stored) ? stored : null
  } catch {
    return null
  }
}

export function getInitialView() {
  const { view } = parseLocationRoute()
  return view || getStoredView() || 'home'
}

export function getInitialResumePage() {
  const { view, resumePage } = parseLocationRoute()
  if (view === 'resume' && resumePage) return resumePage
  if ((view || getStoredView()) === 'resume') return getStoredResumePage() || 'library'
  return 'library'
}

export function persistView(nextView, resumePage) {
  const view = VALID_VIEWS.has(nextView) ? nextView : 'home'
  const page = view === 'resume'
    ? (VALID_RESUME_PAGES.has(resumePage) ? resumePage : getStoredResumePage() || 'library')
    : null

  try {
    sessionStorage.setItem(VIEW_STORAGE_KEY, view)
    localStorage.setItem(VIEW_STORAGE_KEY, view)
    if (page) {
      sessionStorage.setItem(RESUME_PAGE_STORAGE_KEY, page)
      localStorage.setItem(RESUME_PAGE_STORAGE_KEY, page)
    }
  } catch {
    // ignore
  }

  const nextHash = page ? `#${view}/${page}` : `#${view}`
  if (window.location.hash !== nextHash) {
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}${nextHash}`,
    )
  }
}

export function persistResumePage(resumePage) {
  const page = VALID_RESUME_PAGES.has(resumePage) ? resumePage : 'library'
  persistView('resume', page)
}
