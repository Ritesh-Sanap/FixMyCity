import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Users, Calendar, CheckCircle2, User, Building2,
  Play, CheckSquare, RefreshCw, AlertTriangle
} from 'lucide-react'
import api from '../../services/api'
import { CivicIssue, STATUS_LABELS } from '../../types'
import { StatusBadge, PriorityBadge, CategoryIcon } from '../../components/ui/Badges'

interface Officer { id: string; name: string; email: string }

export default function IssueDetail() {
  const { issueId } = useParams()
  const navigate = useNavigate()
  const [issue, setIssue] = useState<CivicIssue | null>(null)
  const [officers, setOfficers] = useState<Officer[]>([])
  const [selectedOfficer, setSelectedOfficer] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')

  const reload = () => {
    if (!issueId) return
    api.get<CivicIssue>(`/civic-issues/${issueId}`).then(r => setIssue(r.data))
  }

  useEffect(() => {
    if (!issueId) return
    Promise.all([
      api.get<CivicIssue>(`/civic-issues/${issueId}`),
      api.get<Officer[]>('/dashboard/officers'),
    ]).then(([issueRes, officersRes]) => {
      setIssue(issueRes.data)
      setOfficers(officersRes.data)
    }).finally(() => setLoading(false))
  }, [issueId])

  const action = async (type: 'assign' | 'status', body: any) => {
    setActionLoading(true)
    setMessage('')
    try {
      const endpoint = type === 'assign' ? `/civic-issues/${issueId}/assign` : `/civic-issues/${issueId}/status`
      await api.post(endpoint, body)
      setMessage('✅ Action completed successfully')
      reload()
    } catch (e: any) {
      setMessage(`❌ ${e.response?.data?.detail || 'Action failed'}`)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="text-slate-400 text-center">
        <div className="text-4xl mb-3 animate-pulse">⏳</div>
        Loading issue...
      </div>
    </div>
  )

  if (!issue) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="text-slate-400">Issue not found</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className={`text-white px-6 pt-6 pb-6 ${
        issue.priority === 'critical' ? 'bg-gradient-to-r from-red-700 to-red-800' :
        issue.priority === 'high' ? 'bg-gradient-to-r from-orange-600 to-orange-700' :
        'bg-gradient-to-r from-slate-800 to-slate-900'
      }`}>
        <button
          onClick={() => navigate('/officer/dashboard')}
          className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <CategoryIcon category={issue.category} size={32} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <span className="text-sm opacity-60">{issue.issue_number}</span>
              <StatusBadge status={issue.status} size="md" />
            </div>
            <h1 className="text-2xl font-black leading-tight">{issue.title}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">
        {/* Priority Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-bold text-slate-800 text-lg">Issue Overview</div>
            <PriorityBadge priority={issue.priority} size="md" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="text-3xl font-black text-slate-800">{issue.report_count}</div>
              <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
                <Users size={12} /> Citizens reporting
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="text-xl font-black text-slate-800 capitalize">{issue.severity}</div>
              <div className="text-xs text-slate-500">Severity</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="text-sm font-bold text-slate-700">{issue.department_name || '—'}</div>
              <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
                <Building2 size={12} /> Department
              </div>
            </div>
          </div>

          {/* Priority Reasons */}
          {issue.priority_reasons && issue.priority_reasons.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-slate-600 mb-2">Why this priority:</div>
              <div className="space-y-1.5">
                {issue.priority_reasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    {r}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Image */}
        {issue.image_url && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <img src={issue.image_url} alt="Issue" className="w-full max-h-64 object-cover" />
          </div>
        )}

        {/* Description & Location */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="font-semibold text-slate-700 mb-2">Description</div>
            <div className="text-sm text-slate-600">{issue.description || 'No description provided.'}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <MapPin size={16} /> Location
            </div>
            <div className="text-sm text-slate-600">{issue.address}</div>
            <div className="text-xs text-slate-400 mt-1">{issue.ward}</div>
            {issue.latitude && issue.longitude && (
              <div className="text-xs text-slate-400 mt-1">{issue.latitude.toFixed(5)}, {issue.longitude.toFixed(5)}</div>
            )}
          </div>
        </div>

        {/* AI Classification */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <div className="font-semibold text-blue-800 mb-2 flex items-center gap-2">🤖 AI Classification</div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-blue-700">
              Confidence: <span className="font-bold">{issue.ai_confidence ? `${Math.round(issue.ai_confidence * 100)}%` : '—'}</span>
            </div>
            {issue.ai_is_mock === 1 && (
              <div className="flex items-center gap-1 text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-2 py-1">
                <AlertTriangle size={12} /> Prototype inference
              </div>
            )}
          </div>
        </div>

        {/* Status Timeline */}
        {issue.status_history && issue.status_history.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="font-bold text-slate-800 mb-4">Status Timeline</div>
            <div className="space-y-3">
              {issue.status_history.map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 size={12} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-700">{STATUS_LABELS[h.to_status] || h.to_status}</div>
                    {h.notes && <div className="text-xs text-slate-400">{h.notes}</div>}
                    <div className="text-xs text-slate-400">{new Date(h.changed_at).toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Officer Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="font-bold text-slate-800 mb-4">Officer Actions</div>

          {message && (
            <div className={`mb-4 p-3 rounded-xl text-sm ${message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          {/* Assign */}
          <div className="mb-4">
            <div className="text-sm font-semibold text-slate-600 mb-2">Assign to Field Officer</div>
            <div className="flex gap-2">
              <select
                value={selectedOfficer}
                onChange={e => setSelectedOfficer(e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select officer...</option>
                {officers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <button
                disabled={!selectedOfficer || actionLoading}
                onClick={() => action('assign', { officer_id: selectedOfficer, notes })}
                className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                <User size={16} /> Assign
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-4">
            <div className="text-sm font-semibold text-slate-600 mb-2">Notes</div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes or resolution details..."
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Status Actions */}
          <div className="grid grid-cols-3 gap-3">
            <button
              disabled={actionLoading}
              onClick={() => action('status', { status: 'work_started', notes })}
              className="bg-amber-500 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-amber-600 disabled:opacity-50"
            >
              <Play size={16} /> Start Work
            </button>
            <button
              disabled={actionLoading}
              onClick={() => action('status', { status: 'resolved', notes })}
              className="bg-green-600 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-green-700 disabled:opacity-50"
            >
              <CheckSquare size={16} /> Resolved
            </button>
            <button
              disabled={actionLoading}
              onClick={() => action('status', { status: 'reopened', notes })}
              className="bg-red-100 text-red-600 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-red-200 disabled:opacity-50"
            >
              <RefreshCw size={16} /> Reopen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
