// ── Auth ────────────────────────────────────────────────────────────────────
export interface TokenResponse {
  access_token: string
  token_type: string
  user_id: string
  name: string
  role: string
}

export interface User {
  id: string
  name: string
  email?: string
  phone?: string
  role: 'citizen' | 'officer' | 'admin'
  ward?: string
  created_at: string
}

// ── Complaints & Issues ──────────────────────────────────────────────────────
export interface Complaint {
  id: string
  complaint_number: string
  category: string
  description?: string
  image_url?: string
  latitude?: number
  longitude?: number
  address?: string
  ward?: string
  is_duplicate: boolean
  civic_issue_id?: string
  submitted_at: string
}

export interface StatusHistoryItem {
  from_status?: string
  to_status: string
  notes?: string
  changed_at: string
}

export interface CivicIssue {
  id: string
  issue_number: string
  category: string
  title: string
  description?: string
  image_url?: string
  latitude?: number
  longitude?: number
  address?: string
  ward?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  priority: 'low' | 'medium' | 'high' | 'critical'
  priority_score: number
  priority_reasons?: string[]
  status: IssueStatus
  report_count: number
  department_name?: string
  first_reported_at: string
  ai_confidence?: number
  ai_is_mock?: number
  status_history?: StatusHistoryItem[]
  assigned_officer_name?: string
}

export type IssueStatus =
  | 'submitted'
  | 'ai_verified'
  | 'assigned'
  | 'work_started'
  | 'resolved'
  | 'closed'
  | 'reopened'

export interface SubmitComplaintResponse {
  complaint: Complaint
  civic_issue_id: string
  civic_issue_number: string
  is_duplicate: boolean
  duplicate_info?: {
    matched_issue_number?: string
    distance_meters?: number
    existing_report_count: number
  }
  ai_classification: {
    category: string
    confidence: number
    severity: string
    is_mock: boolean
    disclaimer: string
  }
  priority: string
  priority_score: number
  priority_reasons: string[]
  department?: string
  message: string
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardStats {
  total_issues: number
  critical: number
  high: number
  medium: number
  low: number
  pending: number
  resolved: number
  closed: number
  reopened: number
  total_complaints: number
  total_citizens: number
}

export interface MapIssue {
  id: string
  issue_number: string
  category: string
  title: string
  latitude?: number
  longitude?: number
  severity: string
  priority: string
  status: string
  report_count: number
  department_name?: string
}

export interface Prediction {
  id: string
  ward: string
  category: string
  risk_score: number
  risk_label: string
  reasons: string[]
  model_version: string
  is_prototype: string
  disclaimer: string
}

// ── UI Helpers ────────────────────────────────────────────────────────────────
export const CATEGORY_LABELS: Record<string, string> = {
  pothole: 'Pothole',
  garbage: 'Garbage',
  water_leakage: 'Water Leakage',
  broken_streetlight: 'Broken Streetlight',
  damaged_road: 'Damaged Road',
}

export const CATEGORY_ICONS: Record<string, string> = {
  pothole: '🕳️',
  garbage: '🗑️',
  water_leakage: '💧',
  broken_streetlight: '💡',
  damaged_road: '🛣️',
}

export const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  ai_verified: 'AI Verified',
  assigned: 'Assigned',
  work_started: 'Work Started',
  resolved: 'Resolved',
  closed: 'Closed ✓',
  reopened: 'Reopened',
}

export const PRIORITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#16a34a',
}
