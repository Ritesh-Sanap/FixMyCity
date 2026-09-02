import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fmc_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Mock fallback data for standalone Vercel deployment when Python backend is offline
const MOCK_ISSUES = [
  {
    id: 'ci-1',
    issue_number: 'CI-2026-0001',
    category: 'broken_streetlight',
    title: '3 Streetlights Out near Kothrud Bus Stop',
    description: 'Dark stretch on main road causing hazard for commuters and pedestrians at night.',
    latitude: 18.5074,
    longitude: 73.8077,
    address: 'Karve Road near Kothrud Bus Stop',
    ward: 'Ward 3 - Kothrud',
    severity: 'high',
    priority: 'high',
    status: 'assigned',
    report_count: 4,
    department_name: 'Electrical Department',
    assigned_officer_name: 'S. Patil (Junior Engineer)',
    created_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'ci-2',
    issue_number: 'CI-2026-0002',
    category: 'pothole',
    title: 'Dangerous Deep Pothole on Airport Road',
    description: 'Deep road cavity in middle lane causing two-wheeler skids and traffic slowdown.',
    latitude: 18.5679,
    longitude: 73.9143,
    address: 'Viman Nagar, Airport Road, Pune',
    ward: 'Ward 9 - Viman Nagar',
    severity: 'critical',
    priority: 'critical',
    status: 'work_started',
    report_count: 12,
    department_name: 'Roads & Infrastructure Department',
    assigned_officer_name: 'M. Deshmukh (Asst Engineer)',
    created_at: '2026-08-31T14:30:00Z',
  },
  {
    id: 'ci-3',
    issue_number: 'CI-2026-0003',
    category: 'garbage',
    title: 'Overflowing Waste Dumpster near Residential Complex',
    description: 'Solid waste accumulation spreading on public sidewalk and breeding mosquitoes.',
    latitude: 18.5512,
    longitude: 73.9442,
    address: 'Kharadi Bypass, Near EON IT Park',
    ward: 'Ward 8 - Kharadi',
    severity: 'medium',
    priority: 'low',
    status: 'submitted',
    report_count: 2,
    department_name: 'Solid Waste Management',
    created_at: '2026-09-02T08:00:00Z',
  },
  {
    id: 'ci-4',
    issue_number: 'CI-2026-0004',
    category: 'water_leakage',
    title: 'Major Pipeline Burst on Baner Main Road',
    description: 'Continuous potable water wastage flooding commercial street.',
    latitude: 18.5590,
    longitude: 73.7868,
    address: 'Near Balewadi High Street, Baner',
    ward: 'Ward 6 - Baner',
    severity: 'high',
    priority: 'high',
    status: 'resolved',
    report_count: 8,
    department_name: 'Water Supply Department',
    assigned_officer_name: 'R. Kulkarni (Executive Engineer)',
    created_at: '2026-08-30T11:20:00Z',
  },
  {
    id: 'ci-5',
    issue_number: 'CI-2026-0005',
    category: 'damaged_road',
    title: 'Broken Paver Blocks & Road Cavity on FC Road',
    description: 'Pedestrian footpath broken with exposed drainage edge.',
    latitude: 18.5195,
    longitude: 73.8553,
    address: 'Fergusson College Road, Deccan',
    ward: 'Ward 2 - Deccan',
    severity: 'medium',
    priority: 'medium',
    status: 'closed',
    report_count: 5,
    department_name: 'Roads & Infrastructure Department',
    created_at: '2026-08-28T09:15:00Z',
  },
]

const MOCK_SAFETY_ZONES = [
  {
    ward: 'Ward 6 - Baner',
    latitude: 18.5590,
    longitude: 73.7868,
    risk_score: 0.78,
    risk_label: 'high',
    reasons: ['4 unresolved streetlight complaints (dark road)', 'Isolated stretch near highway connector'],
    complaint_count: 6,
    unresolved_count: 4,
  },
  {
    ward: 'Ward 9 - Viman Nagar',
    latitude: 18.5679,
    longitude: 73.9143,
    risk_score: 0.85,
    risk_label: 'critical',
    reasons: ['6 broken streetlights near bypass', 'High vehicle speed zone with poor visibility'],
    complaint_count: 14,
    unresolved_count: 7,
  },
  {
    ward: 'Ward 3 - Kothrud',
    latitude: 18.5074,
    longitude: 73.8077,
    risk_score: 0.45,
    risk_label: 'medium',
    reasons: ['1 broken streetlight complaint', 'Moderate pedestrian movement'],
    complaint_count: 3,
    unresolved_count: 1,
  },
  {
    ward: 'Ward 2 - Deccan',
    latitude: 18.5195,
    longitude: 73.8553,
    risk_score: 0.25,
    risk_label: 'low',
    reasons: ['Well-lit market area with regular police beat chowki patrol'],
    complaint_count: 5,
    unresolved_count: 1,
  },
]

// Intelligent fallback interceptor for standalone frontend hosting
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || ''
    const method = (err.config?.method || 'get').toLowerCase()

    // 401 Unauthorized handling only if not auth endpoints
    if (err.response?.status === 401 && !url.includes('/auth/')) {
      localStorage.removeItem('fmc_token')
      localStorage.removeItem('fmc_user')
      window.location.href = '/'
      return Promise.reject(err)
    }

    // If server is unreachable (Network Error or 404 / 500 on standalone Vercel preview)
    // provide seamless offline/demo mode response so demo never breaks!
    if (!err.response || err.response.status === 404 || err.response.status >= 500 || err.code === 'ERR_NETWORK') {
      console.warn(`[FixMyCity Standalone Mode] Live backend unreachable for ${url}. Providing demo response.`)

      // Auth login / officer-login
      if (url.includes('/auth/login') || url.includes('/auth/officer-login') || url.includes('/auth/register')) {
        let isOfficer = url.includes('officer')
        let payload: any = {}
        try {
          payload = typeof err.config.data === 'string' ? JSON.parse(err.config.data) : (err.config.data || {})
        } catch {}

        if (payload.email_or_phone?.includes('officer') || payload.email?.includes('officer')) {
          isOfficer = true
        }

        return Promise.resolve({
          data: {
            access_token: 'demo-token-' + Date.now(),
            token_type: 'bearer',
            user_id: isOfficer ? 'usr-officer-1' : 'usr-citizen-1',
            name: isOfficer ? 'S. Patil (Ward Officer)' : (payload.name || 'Rahul Sharma'),
            role: isOfficer ? 'officer' : 'citizen',
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: err.config,
        })
      }

      // Civic issues — handle list, nearby, and single issue lookups
      if (url.includes('civic-issues') && method === 'get') {
        // Single issue lookup: /civic-issues/ci-1
        const singleMatch = url.match(/civic-issues\/([^/?&]+)$/)
        if (singleMatch && !url.includes('nearby')) {
          const issueId = singleMatch[1]
          const matched = MOCK_ISSUES.find(i => i.id === issueId || i.issue_number === issueId)
          return Promise.resolve({
            data: matched || MOCK_ISSUES[0],
            status: 200, statusText: 'OK', headers: {}, config: err.config,
          })
        }
        // All other civic-issues calls (list, nearby, search) → return full array
        return Promise.resolve({
          data: MOCK_ISSUES,
          status: 200, statusText: 'OK', headers: {}, config: err.config,
        })
      }

      // Dashboard stats
      if (url.includes('/dashboard/stats')) {
        return Promise.resolve({
          data: {
            total_issues: 16,
            critical: 3,
            high: 5,
            medium: 6,
            low: 2,
            pending: 9,
            resolved: 4,
            closed: 3,
            reopened: 0,
            total_complaints: 64,
            total_citizens: 42,
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: err.config,
        })
      }

      // Dashboard predictions
      if (url.includes('/dashboard/predictions')) {
        return Promise.resolve({
          data: [
            { id: 'p1', ward: 'Ward 6 - Baner', category: 'broken_streetlight', risk_score: 0.85, risk_label: 'critical', reasons: ['High complaint frequency in past 14 days', 'Unresolved electrical grid issue'] },
            { id: 'p2', ward: 'Ward 9 - Viman Nagar', category: 'pothole', risk_score: 0.75, risk_label: 'high', reasons: ['Heavy monsoon runoff degradation', 'Repeated asphalt damage'] },
            { id: 'p3', ward: 'Ward 3 - Kothrud', category: 'water_leakage', risk_score: 0.45, risk_label: 'medium', reasons: ['Minor distribution line fluctuation'] },
          ],
          status: 200,
          statusText: 'OK',
          headers: {},
          config: err.config,
        })
      }

      // Dashboard map data
      if (url.includes('/dashboard/map-data')) {
        return Promise.resolve({
          data: MOCK_ISSUES.map(i => ({
            id: i.id,
            issue_number: i.issue_number,
            category: i.category,
            title: i.title,
            latitude: i.latitude,
            longitude: i.longitude,
            severity: i.severity,
            priority: i.priority,
            status: i.status,
            report_count: i.report_count,
            department_name: i.department_name,
          })),
          status: 200,
          statusText: 'OK',
          headers: {},
          config: err.config,
        })
      }

      // Complaints submit
      if (url.includes('/complaints/') && method === 'post') {
        const randNum = Math.floor(1000 + Math.random() * 9000)
        return Promise.resolve({
          data: {
            complaint: {
              id: 'c-' + Date.now(),
              complaint_number: `CMP-2026-${randNum}`,
              user_id: 'usr-citizen-1',
              category: 'pothole',
              description: 'Reported civic issue via citizen mobile portal',
              latitude: 18.5590,
              longitude: 73.7868,
              address: 'Baner Road, Pune',
              status: 'submitted',
              is_duplicate: false,
              created_at: new Date().toISOString(),
            },
            civic_issue_id: 'ci-1',
            civic_issue_number: `CI-2026-${randNum}`,
            ai_classification: {
              category: 'pothole',
              confidence: 0.94,
              severity: 'critical',
              is_mock: true,
              disclaimer: 'PROTOTYPE AI MODEL: Computer vision simulated for hackathon demonstration.',
            },
            is_duplicate: false,
            duplicate_info: null,
            priority: 'critical',
            priority_score: 0.92,
            priority_reasons: [
              'High traffic arterial road identified via GPS coordinates',
              'Severe road cavity safety hazard',
              'AI Vision detected high vehicle hazard density'
            ],
            department: 'Roads & Infrastructure Department',
            message: 'Grievance registered and assigned to Ward Officer.',
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: err.config,
        })
      }

      // My complaints
      if (url.includes('/complaints/my')) {
        return Promise.resolve({
          data: MOCK_ISSUES.map(i => ({
            id: 'cmp-' + i.id,
            complaint_number: 'CMP-' + i.issue_number.replace('CI-', ''),
            civic_issue_id: i.id,
            category: i.category,
            description: i.description,
            latitude: i.latitude,
            longitude: i.longitude,
            address: i.address,
            status: i.status,
            is_duplicate: false,
            created_at: i.created_at,
          })),
          status: 200,
          statusText: 'OK',
          headers: {},
          config: err.config,
        })
      }

      // Safety zones
      if (url.includes('/sos/safety-zones')) {
        return Promise.resolve({
          data: MOCK_SAFETY_ZONES,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: err.config,
        })
      }

      // SOS trigger
      if (url.includes('/sos/trigger')) {
        return Promise.resolve({
          data: {
            id: 'sos-' + Date.now(),
            user_id: 'usr-citizen-1',
            user_name: 'Rahul Sharma',
            latitude: 18.5590,
            longitude: 73.7868,
            address: 'Near Baner Road, Ward 6 - Baner',
            ward: 'Ward 6 - Baner',
            status: 'active',
            created_at: new Date().toISOString(),
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: err.config,
        })
      }

      // SOS contacts / active-alerts
      if (url.includes('/sos/contacts')) {
        return Promise.resolve({
          data: [
            { id: 'cnt-1', name: 'Priya Sharma', phone: '+91 98765 12340', relation: 'Sister' },
            { id: 'cnt-2', name: 'Anil Sharma', phone: '+91 98220 54321', relation: 'Father' },
          ],
          status: 200,
          statusText: 'OK',
          headers: {},
          config: err.config,
        })
      }

      if (url.includes('/sos/active-alert')) {
        return Promise.resolve({ data: null, status: 200, statusText: 'OK', headers: {}, config: err.config })
      }

      if (url.includes('/sos/active-alerts')) {
        return Promise.resolve({ data: [], status: 200, statusText: 'OK', headers: {}, config: err.config })
      }
    }

    return Promise.reject(err)
  }
)

export default api
