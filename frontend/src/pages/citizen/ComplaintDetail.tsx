import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, CheckCircle, XCircle, Clock, User, Building2, ShieldCheck, Share2, Bell } from 'lucide-react'
import api from '../../services/api'
import { CivicIssue } from '../../types'
import { StatusBadge, PriorityBadge, CategoryIcon } from '../../components/ui/Badges'

const TIMELINE_STEPS = [
  { key: 'submitted', label: '1. Grievance Submitted' },
  { key: 'ai_verified', label: '2. AI Verified & Clustered' },
  { key: 'assigned', label: '3. Assigned to Ward Officer' },
  { key: 'work_started', label: '4. On-Site Work Commenced' },
  { key: 'resolved', label: '5. Redressal Completed' },
  { key: 'closed', label: '6. Citizen Verified & Closed' },
]

const STATUS_ORDER = ['submitted', 'ai_verified', 'assigned', 'work_started', 'resolved', 'closed', 'reopened']

export default function ComplaintDetail() {
  const { issueId } = useParams()
  const navigate = useNavigate()
  const [issue, setIssue] = useState<CivicIssue | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState<boolean | null>(null)

  useEffect(() => {
    if (!issueId) return
    api.get<CivicIssue>(`/civic-issues/${issueId}`)
      .then((r) => setIssue(r.data))
      .finally(() => setLoading(false))
  }, [issueId])

  const currentStep = STATUS_ORDER.indexOf(issue?.status || 'submitted')

  if (loading) return (
    <div className="citizen-app min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <div className="text-xs font-semibold">Retrieving Grievance File...</div>
      </div>
    </div>
  )

  if (!issue) return (
    <div className="citizen-app min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center text-slate-500 p-8">
        <div className="font-bold text-sm">Grievance record not found.</div>
        <button onClick={() => navigate('/citizen/home')} className="mt-3 text-xs text-blue-600 font-bold">
          Return to Dashboard
        </button>
      </div>
    </div>
  )

  return (
    <div className="citizen-app min-h-screen bg-slate-50">
      {/* Tricolor Bar */}
      <div className="tricolor-bar w-full" />

      {/* Header */}
      <div
        className="text-white px-5 pt-7 pb-6"
        style={{
          background: issue.priority === 'critical'
            ? 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)'
            : issue.priority === 'high'
            ? 'linear-gradient(135deg, #9a3412 0%, #c2410c 100%)'
            : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center border border-white/10">
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="font-bold text-base font-mono">{issue.issue_number}</div>
              <div className="text-[11px] text-slate-300 uppercase tracking-wider">{issue.category.replace('_', ' ')}</div>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase bg-white/15 px-2.5 py-1 rounded-full border border-white/20">
            {issue.priority} Priority
          </span>
        </div>

        <div className="flex items-start gap-3 mt-4 bg-white/10 p-3 rounded-xl border border-white/10">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-xs">
            <CategoryIcon category={issue.category} size={22} />
          </div>
          <div className="font-bold text-base leading-snug">{issue.title}</div>
        </div>
      </div>

      <div className="px-5 py-5 space-y-4 pb-28">
        {/* Status + Priority */}
        <div className="flex gap-2">
          <StatusBadge status={issue.status} size="md" />
          <PriorityBadge priority={issue.priority} size="md" />
        </div>

        {/* Image */}
        {issue.image_url && (
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
            <img src={issue.image_url} alt="Issue" className="w-full h-48 object-cover rounded-xl" />
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Citizen Endorsements</div>
            <div className="font-black text-2xl text-slate-900 mt-1">{issue.report_count}</div>
            <div className="text-[11px] text-slate-500">consolidated reports</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Responsible Dept</div>
            <div className="font-bold text-sm text-slate-900 leading-snug mt-1">{issue.department_name || 'Municipal Admin'}</div>
          </div>
        </div>

        {/* Location Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center flex-shrink-0">
            <MapPin size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Incident Location</div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">{issue.address || `${issue.latitude?.toFixed(4)}, ${issue.longitude?.toFixed(4)}`}</div>
            <div className="text-[11px] text-slate-500">{issue.ward || 'Municipal Area'}</div>
          </div>
        </div>

        {/* Assigned officer */}
        {issue.assigned_officer_name && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <User size={16} />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Designated Officer</div>
              <div className="font-bold text-xs text-slate-800 mt-0.5">{issue.assigned_officer_name}</div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-1.5">
            <Clock size={14} className="text-slate-500" />
            <span>Resolution Audit Trail</span>
          </div>

          <div className="relative pl-2">
            {TIMELINE_STEPS.map((step, i) => {
              const stepIdx = STATUS_ORDER.indexOf(step.key)
              const done = stepIdx <= currentStep
              const current = step.key === issue.status
              const historyItem = issue.status_history?.find(h => h.to_status === step.key)
              return (
                <div key={step.key} className="flex items-start gap-3.5 mb-4 relative">
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div className={`absolute left-3.5 top-7 w-0.5 h-full ${done ? 'bg-blue-600' : 'bg-slate-200'}`} />
                  )}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 transition-all ${
                    current ? 'border-blue-600 bg-blue-600 text-white' :
                    done ? 'border-blue-600 bg-blue-100 text-blue-700' :
                    'border-slate-300 bg-white text-slate-300'
                  }`}>
                    {done ? <CheckCircle size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                  </div>
                  <div className="pt-0.5">
                    <div className={`text-xs font-bold ${done ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</div>
                    {historyItem && (
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(historyItem.changed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Citizen Verification Workflow */}
        {issue.status === 'resolved' && verified === null && (
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 shadow-xs">
            <div className="font-bold text-sm text-emerald-950 mb-1 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-700" />
              <span>Municipal Redressal Verification</span>
            </div>
            <div className="text-xs text-emerald-800 mb-4">
              Authorities reported this grievance as resolved. Please verify the on-ground resolution.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={verifying}
                onClick={async () => {
                  setVerifying(true)
                  await api.post(`/complaints/${issue.id}/verify`, { is_fixed: true, comment: 'Verified Fixed' }).catch(() => {})
                  setVerified(true)
                  setVerifying(false)
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <CheckCircle size={15} /> CONFIRM RESOLVED
              </button>
              <button
                disabled={verifying}
                onClick={async () => {
                  setVerifying(true)
                  await api.post(`/complaints/${issue.id}/verify`, { is_fixed: false, comment: 'Issue still persists' }).catch(() => {})
                  setVerified(false)
                  setVerifying(false)
                }}
                className="bg-white border border-red-300 text-red-700 hover:bg-red-50 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <XCircle size={15} /> STILL UNRESOLVED
              </button>
            </div>
          </div>
        )}

        {verified !== null && (
          <div className={`rounded-2xl p-4 text-center font-bold text-xs ${verified ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {verified ? 'Grievance verification recorded: Case marked as CLOSED.' : 'Escalation recorded: Issue has been REOPENED for department inspection.'}
          </div>
        )}
      </div>
    </div>
  )
}
