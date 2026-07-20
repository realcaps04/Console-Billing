const VIEW_STORAGE_KEY = 'consolebilling_active_view'
const RESUME_PAGE_STORAGE_KEY = 'consolebilling_resume_page'
const DOCUMENTS_PAGE_STORAGE_KEY = 'consolebilling_documents_page'
const DOCUMENTS_LOAN_TYPE_ID_KEY = 'consolebilling_documents_loan_type_id'
const DOCUMENTS_CUSTOMER_ID_KEY = 'consolebilling_documents_customer_id'
const VALID_VIEWS = new Set(['home', 'create', 'estimate', 'bills', 'services', 'resume', 'documents'])
const VALID_RESUME_PAGES = new Set(['library', 'builder'])
const VALID_DOCUMENTS_PAGES = new Set(['types', 'customers', 'editor', 'library'])

function parseLocationRoute() {
  const raw = String(window.location.hash || '').replace(/^#/, '').trim()
  const [viewPart, pagePart] = raw.split('/')
  const view = VALID_VIEWS.has(viewPart) ? viewPart : null
  const resumePage = view === 'resume' && VALID_RESUME_PAGES.has(pagePart) ? pagePart : null
  const documentsPage = view === 'documents' && VALID_DOCUMENTS_PAGES.has(pagePart) ? pagePart : null
  return { view, resumePage, documentsPage }
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

function getStoredDocumentsPage() {
  try {
    const stored = sessionStorage.getItem(DOCUMENTS_PAGE_STORAGE_KEY) || localStorage.getItem(DOCUMENTS_PAGE_STORAGE_KEY)
    return VALID_DOCUMENTS_PAGES.has(stored) ? stored : null
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

export function getInitialDocumentsPage() {
  const { view, documentsPage } = parseLocationRoute()
  if (view === 'documents' && documentsPage) {
    if (documentsPage === 'library') return 'types'
    return documentsPage
  }
  if ((view || getStoredView()) === 'documents') {
    const stored = getStoredDocumentsPage()
    return stored === 'library' ? 'types' : stored || 'types'
  }
  return 'types'
}

export function persistView(nextView, subPage) {
  const view = VALID_VIEWS.has(nextView) ? nextView : 'home'
  let page = null
  if (view === 'resume') {
    page = VALID_RESUME_PAGES.has(subPage) ? subPage : getStoredResumePage() || 'library'
  } else if (view === 'documents') {
    const normalized = subPage === 'library' ? 'types' : subPage
    page = VALID_DOCUMENTS_PAGES.has(normalized) ? normalized : getStoredDocumentsPage() || 'types'
    if (page === 'library') page = 'types'
  }

  try {
    sessionStorage.setItem(VIEW_STORAGE_KEY, view)
    localStorage.setItem(VIEW_STORAGE_KEY, view)
    if (view === 'resume' && page) {
      sessionStorage.setItem(RESUME_PAGE_STORAGE_KEY, page)
      localStorage.setItem(RESUME_PAGE_STORAGE_KEY, page)
    }
    if (view === 'documents' && page) {
      sessionStorage.setItem(DOCUMENTS_PAGE_STORAGE_KEY, page)
      localStorage.setItem(DOCUMENTS_PAGE_STORAGE_KEY, page)
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

export function persistDocumentsPage(documentsPage) {
  const page = documentsPage === 'library' ? 'types' : documentsPage
  const normalized = VALID_DOCUMENTS_PAGES.has(page) ? page : 'types'
  persistView('documents', normalized)
}

function readStoredId(key) {
  try {
    const stored = sessionStorage.getItem(key) || localStorage.getItem(key)
    return stored || null
  } catch {
    return null
  }
}

function writeStoredId(key, value) {
  try {
    if (value) {
      sessionStorage.setItem(key, value)
      localStorage.setItem(key, value)
    } else {
      sessionStorage.removeItem(key)
      localStorage.removeItem(key)
    }
  } catch {
    // ignore
  }
}

export function getStoredDocumentsLoanTypeId() {
  return readStoredId(DOCUMENTS_LOAN_TYPE_ID_KEY)
}

export function getStoredDocumentsCustomerId() {
  return readStoredId(DOCUMENTS_CUSTOMER_ID_KEY)
}

export function persistDocumentsContext({ loanTypeId = null, customerId = null } = {}) {
  writeStoredId(DOCUMENTS_LOAN_TYPE_ID_KEY, loanTypeId)
  writeStoredId(DOCUMENTS_CUSTOMER_ID_KEY, customerId)
}
