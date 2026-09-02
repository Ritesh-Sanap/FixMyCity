import axios, { AxiosRequestConfig } from 'axios'

// ──────────────────────────────────────────────────────────────────────────────
// Demo Mode Detection
// When VITE_API_BASE_URL is not set (standalone Vercel hosting without backend),
// we serve all data from in-memory mock data — no network calls made at all.
// ──────────────────────────────────────────────────────────────────────────────
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || ''
const IS_DEMO_MODE = !BACKEND_URL  // true on Vercel without a configured backend

const api = axios.create({
  baseURL: BACKEND_URL || 'http://localhost:8000/api',
  timeout: 10000,
})

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_ISSUES = [
  {
    id: 'ci-1',
    issue_number: 'CI-2026-0001',
    category: 'broken_streetlight',
    title: '3 Streetlights Out near Kothrud Bus Stop',
    description: 'Dark stretch on main road causing hazard for commuters and pedestrians at night.',
    latitude: 18.5074, longitude: 73.8077,
    address: 'Karve Road near Kothrud Bus Stop',
    ward: 'Ward 3 - Kothrud',
    severity: 'high', priority: 'high', status: 'assigned',
    report_count: 4, department_name: 'Electrical Department',
    assigned_officer_name: 'S. Patil (Junior Engineer)',
    created_at: '2026-09-01T10:00:00Z',
    status_history: [
      { to_status: 'submitted', changed_at: '2026-09-01T10:00:00Z' },
      { to_status: 'ai_verified', changed_at: '2026-09-01T10:05:00Z' },
      { to_status: 'assigned', changed_at: '2026-09-01T11:00:00Z' },
    ],
  },
  {
    id: 'ci-2',
    issue_number: 'CI-2026-0002',
    category: 'pothole',
    title: 'Dangerous Deep Pothole on Airport Road',
    description: 'Deep road cavity in middle lane causing two-wheeler skids and traffic slowdown.',
    latitude: 18.5679, longitude: 73.9143,
    address: 'Viman Nagar, Airport Road, Pune',
    ward: 'Ward 9 - Viman Nagar',
    severity: 'critical', priority: 'critical', status: 'work_started',
    report_count: 12, department_name: 'Roads & Infrastructure Department',
    assigned_officer_name: 'M. Deshmukh (Asst Engineer)',
    created_at: '2026-08-31T14:30:00Z',
    status_history: [
      { to_status: 'submitted', changed_at: '2026-08-31T14:30:00Z' },
      { to_status: 'ai_verified', changed_at: '2026-08-31T14:40:00Z' },
      { to_status: 'assigned', changed_at: '2026-08-31T15:00:00Z' },
      { to_status: 'work_started', changed_at: '2026-09-01T09:00:00Z' },
    ],
  },
  {
    id: 'ci-3',
    issue_number: 'CI-2026-0003',
    category: 'garbage',
    title: 'Overflowing Waste Dumpster near Residential Complex',
    description: 'Solid waste accumulation spreading on public sidewalk and breeding mosquitoes.',
    latitude: 18.5512, longitude: 73.9442,
    address: 'Kharadi Bypass, Near EON IT Park',
    ward: 'Ward 8 - Kharadi',
    severity: 'medium', priority: 'low', status: 'submitted',
    report_count: 2, department_name: 'Solid Waste Management',
    created_at: '2026-09-02T08:00:00Z',
    status_history: [{ to_status: 'submitted', changed_at: '2026-09-02T08:00:00Z' }],
  },
  {
    id: 'ci-4',
    issue_number: 'CI-2026-0004',
    category: 'water_leakage',
    title: 'Major Pipeline Burst on Baner Main Road',
    description: 'Continuous potable water wastage flooding commercial street.',
    latitude: 18.5590, longitude: 73.7868,
    address: 'Near Balewadi High Street, Baner',
    ward: 'Ward 6 - Baner',
    severity: 'high', priority: 'high', status: 'resolved',
    report_count: 8, department_name: 'Water Supply Department',
    assigned_officer_name: 'R. Kulkarni (Executive Engineer)',
    created_at: '2026-08-30T11:20:00Z',
    status_history: [
      { to_status: 'submitted', changed_at: '2026-08-30T11:20:00Z' },
      { to_status: 'ai_verified', changed_at: '2026-08-30T11:30:00Z' },
      { to_status: 'assigned', changed_at: '2026-08-30T12:00:00Z' },
      { to_status: 'work_started', changed_at: '2026-08-31T08:00:00Z' },
      { to_status: 'resolved', changed_at: '2026-09-01T16:00:00Z' },
    ],
  },
  {
    id: 'ci-5',
    issue_number: 'CI-2026-0005',
    category: 'damaged_road',
    title: 'Broken Paver Blocks & Road Cavity on FC Road',
    description: 'Pedestrian footpath broken with exposed drainage edge.',
    latitude: 18.5195, longitude: 73.8553,
    address: 'Fergusson College Road, Deccan',
    ward: 'Ward 2 - Deccan',
    severity: 'medium', priority: 'medium', status: 'closed',
    report_count: 5, department_name: 'Roads & Infrastructure Department',
    created_at: '2026-08-28T09:15:00Z',
    status_history: [
      { to_status: 'submitted', changed_at: '2026-08-28T09:15:00Z' },
      { to_status: 'ai_verified', changed_at: '2026-08-28T09:20:00Z' },
      { to_status: 'assigned', changed_at: '2026-08-28T10:00:00Z' },
      { to_status: 'work_started', changed_at: '2026-08-29T08:00:00Z' },
      { to_status: 'resolved', changed_at: '2026-08-30T14:00:00Z' },
      { to_status: 'closed', changed_at: '2026-08-31T10:00:00Z' },
    ],
  },
]

const MOCK_SAFETY_ZONES = [
  { ward: 'Ward 6 - Baner', latitude: 18.5590, longitude: 73.7868, risk_score: 0.78, risk_label: 'high', reasons: ['4 unresolved streetlight complaints (dark road)', 'Isolated stretch near highway connector'], complaint_count: 6, unresolved_count: 4 },
  { ward: 'Ward 9 - Viman Nagar', latitude: 18.5679, longitude: 73.9143, risk_score: 0.85, risk_label: 'critical', reasons: ['6 broken streetlights near bypass', 'High vehicle speed zone with poor visibility'], complaint_count: 14, unresolved_count: 7 },
  { ward: 'Ward 3 - Kothrud', latitude: 18.5074, longitude: 73.8077, risk_score: 0.45, risk_label: 'medium', reasons: ['1 broken streetlight complaint', 'Moderate pedestrian movement'], complaint_count: 3, unresolved_count: 1 },
  { ward: 'Ward 2 - Deccan', latitude: 18.5195, longitude: 73.8553, risk_score: 0.25, risk_label: 'low', reasons: ['Well-lit market area with regular police beat chowki patrol'], complaint_count: 5, unresolved_count: 1 },
]

const MOCK_CONTACTS = [
  { id: 'cnt-1', name: 'Priya Sharma', phone: '+91 98765 12340', relation: 'Sister' },
  { id: 'cnt-2', name: 'Anil Sharma', phone: '+91 98220 54321', relation: 'Father' },
]

// ── Mock Router ───────────────────────────────────────────────────────────────
function mockResponse(url: string, method: string, body: any) {
  const ok = (data: any) => ({ data, status: 200, statusText: 'OK', headers: {}, config: {} })

  // Auth
  if (url.includes('/auth/')) {
    const isOfficer = url.includes('officer') ||
      body?.email_or_phone?.includes('officer') ||
      body?.email?.includes('officer')
    return ok({
      access_token: 'demo-token-' + Date.now(),
      token_type: 'bearer',
      user_id: isOfficer ? 'usr-officer-1' : 'usr-citizen-1',
      name: isOfficer ? 'S. Patil (Ward Officer)' : (body?.name || 'Rahul Sharma'),
      role: isOfficer ? 'officer' : 'citizen',
    })
  }

  // Single civic issue
  const singleIssue = url.match(/civic-issues\/([^/?&]+)$/)
  if (singleIssue && !url.includes('nearby')) {
    const id = singleIssue[1]
    return ok(MOCK_ISSUES.find(i => i.id === id || i.issue_number === id) || MOCK_ISSUES[0])
  }
  // All civic issue lists (list, nearby, search)
  if (url.includes('civic-issues')) return ok(MOCK_ISSUES)

  // Dashboard
  if (url.includes('/dashboard/stats')) {
    return ok({ total_issues: 16, critical: 3, high: 5, medium: 6, low: 2, pending: 9, resolved: 4, closed: 3, reopened: 0, total_complaints: 64, total_citizens: 42 })
  }
  if (url.includes('/dashboard/predictions')) {
    return ok([
      { id: 'p1', ward: 'Ward 6 - Baner', category: 'broken_streetlight', risk_score: 0.85, risk_label: 'critical', reasons: ['High complaint frequency in past 14 days', 'Unresolved electrical grid issue'] },
      { id: 'p2', ward: 'Ward 9 - Viman Nagar', category: 'pothole', risk_score: 0.75, risk_label: 'high', reasons: ['Heavy monsoon runoff degradation', 'Repeated asphalt damage'] },
      { id: 'p3', ward: 'Ward 3 - Kothrud', category: 'water_leakage', risk_score: 0.45, risk_label: 'medium', reasons: ['Minor distribution line fluctuation'] },
    ])
  }
  if (url.includes('/dashboard/map-data')) return ok(MOCK_ISSUES)

  // Complaints
  if (url.includes('/complaints/my') || url.includes('/complaints/')) {
    if (method === 'post' && !url.includes('/verify')) {
      const randNum = Math.floor(1000 + Math.random() * 9000)
      return ok({
        complaint: { id: 'c-' + Date.now(), complaint_number: `CMP-2026-${randNum}`, status: 'submitted', is_duplicate: false, created_at: new Date().toISOString() },
        civic_issue_id: 'ci-1', civic_issue_number: `CI-2026-${randNum}`,
        ai_classification: { category: body?.category || 'pothole', confidence: 0.94, severity: 'high', is_mock: true, disclaimer: 'PROTOTYPE AI MODEL — SIH 2026 Demonstration.' },
        is_duplicate: false, duplicate_info: null,
        priority: 'high', priority_score: 0.88,
        priority_reasons: ['High traffic road detected via GPS', 'AI Vision flagged active safety hazard', 'Multiple nearby complaints in same ward'],
        department: 'Roads & Infrastructure Department',
        message: 'Grievance registered and assigned to Ward Officer.',
      })
    }
    if (url.includes('/verify')) return ok({ success: true })
    // My complaints list
    return ok(MOCK_ISSUES.map(i => ({ id: 'cmp-' + i.id, complaint_number: 'CMP-' + i.issue_number.replace('CI-', ''), civic_issue_id: i.id, category: i.category, description: i.description, latitude: i.latitude, longitude: i.longitude, address: i.address, status: i.status, is_duplicate: false, created_at: i.created_at })))
  }

  // SOS
  if (url.includes('/sos/trigger')) {
    return ok({ id: 'sos-' + Date.now(), user_id: 'usr-citizen-1', user_name: 'Rahul Sharma', latitude: 18.5590, longitude: 73.7868, address: 'Near Baner Road, Pune', ward: 'Ward 6 - Baner', status: 'active', created_at: new Date().toISOString() })
  }
  if (url.includes('/sos/cancel') || url.includes('/sos/safe')) return ok({ success: true })
  if (url.includes('/sos/contacts')) {
    if (method === 'post') return ok({ id: 'cnt-' + Date.now(), ...JSON.parse(body || '{}') })
    if (method === 'delete') return ok({ success: true })
    return ok(MOCK_CONTACTS)
  }
  if (url.includes('/sos/safety-zones') || url.includes('/sos/safety_zones')) return ok(MOCK_SAFETY_ZONES)
  if (url.includes('/sos/active-alert')) return ok(null)
  if (url.includes('/sos/active-alerts')) return ok([])
  if (url.includes('/sos/safety-stats')) return ok({ high_risk_zones: 2, medium_risk_zones: 1, low_risk_zones: 1, total_active_sos: 0 })

  // AI analysis page
  if (url.includes('/ai-analysis') || url.includes('/analysis')) return ok([])

  // Fallback
  return ok({})
}

// ── Request Interceptor: attach token + demo-mode short-circuit ───────────────
api.interceptors.request.use(async (config: AxiosRequestConfig | any) => {
  const token = localStorage.getItem('fmc_token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  if (IS_DEMO_MODE) {
    const url = config.url || ''
    const method = (config.method || 'get').toLowerCase()
    let body: any = null
    try { body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data } catch {}

    console.info(`[FixMyCity Demo] Intercepting ${method.toUpperCase()} ${url}`)
    const mockRes = mockResponse(url, method, body)

    // Return a resolved promise that looks like an axios response
    return {
      ...config,
      adapter: () => Promise.resolve(mockRes as any),
    }
  }

  return config
})

// ── Response Interceptor: handle 401 in live mode ────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/')) {
      localStorage.removeItem('fmc_token')
      localStorage.removeItem('fmc_user')
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

export default api
