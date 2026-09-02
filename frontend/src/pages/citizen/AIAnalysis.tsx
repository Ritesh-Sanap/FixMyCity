import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle2, ArrowLeft, AlertTriangle, ChevronRight, Users, Cpu, Building2, ShieldCheck } from 'lucide-react'
import { SubmitComplaintResponse } from '../../types'
import { PriorityBadge, CategoryIcon } from '../../components/ui/Badges'

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  return (
    <div>
      <div className="flex justify-between text-xs font-semibold mb-1">
        <span className="text-slate-600">Model Confidence Rating</span>
        <span className="font-bold text-blue-700 font-mono">{pct}%</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function AIAnalysis() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const result = state?.result as SubmitComplaintResponse | undefined

  if (!result) {
    return (
      <div className="citizen-app flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center text-slate-500 p-8">
          <div className="font-bold text-base mb-2">No Active Assessment Data</div>
          <div className="text-xs text-slate-400">Please submit a grievance report to initiate AI analysis.</div>
          <button onClick={() => navigate('/citizen/report')} className="mt-4 text-xs bg-blue-600 text-white font-bold px-4 py-2 rounded-xl">
            Lodge Report →
          </button>
        </div>
      </div>
    )
  }

  const { ai_classification, duplicate_info, is_duplicate, priority, priority_reasons, department, civic_issue_number, complaint } = result

  return (
    <div className="citizen-app min-h-screen bg-slate-50">
      {/* Tricolor Bar */}
      <div className="tricolor-bar w-full" />

      {/* Authority Header */}
      <div
        className="text-white px-5 pt-7 pb-6"
        style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/citizen/home')} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center border border-white/10">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="font-bold text-base">Grievance Acknowledged</div>
            <div className="text-xs text-slate-400">Reference: {civic_issue_number}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/10 rounded-2xl p-3.5 border border-white/10">
          <CheckCircle2 size={24} className="text-emerald-400 flex-shrink-0" />
          <div>
            <div className="font-bold text-sm">Complaint Successfully Registered</div>
            <div className="text-slate-300 text-xs font-mono">{complaint.complaint_number}</div>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 space-y-4 pb-32">
        {/* AI Classification Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
            <Cpu size={15} className="text-blue-600" />
            <span>AI Automated Classification</span>
          </div>

          <div className="flex items-center gap-3 mb-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center shadow-xs">
              <CategoryIcon category={ai_classification.category} size={24} />
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 capitalize">
                {ai_classification.category.replace('_', ' ')}
              </div>
              <div className="text-xs text-slate-500">Categorized by Computer Vision</div>
            </div>
          </div>

          <ConfidenceBar value={ai_classification.confidence} />

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Assessed Severity:</span>
            <span className={`font-bold uppercase px-2 py-0.5 rounded-md ${
              ai_classification.severity === 'critical' ? 'bg-red-50 text-red-700 border border-red-200' :
              ai_classification.severity === 'high' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
              ai_classification.severity === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              'bg-green-50 text-green-700 border border-green-200'
            }`}>{ai_classification.severity}</span>
          </div>

          {ai_classification.is_mock && (
            <div className="mt-2.5 bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-start gap-1.5 text-[10px] text-slate-500">
              <ShieldCheck size={12} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <span>{ai_classification.disclaimer}</span>
            </div>
          )}
        </div>

        {/* Duplicate Detection Alert */}
        {is_duplicate && duplicate_info && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="font-bold text-xs uppercase tracking-wider text-amber-900 mb-1 flex items-center gap-1.5">
              <Users size={15} className="text-amber-700" />
              <span>Duplicate Issue Clustered</span>
            </div>
            <div className="text-xs text-amber-800 space-y-0.5">
              <div>📍 Distance from cluster origin: {duplicate_info.distance_meters?.toFixed(0)}m</div>
              <div>👥 Total citizen endorsements: {duplicate_info.existing_report_count}</div>
              <div className="font-semibold text-amber-900 mt-1">Grievance consolidated with Master Issue {duplicate_info.matched_issue_number}.</div>
            </div>
          </div>
        )}

        {/* Priority Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-xs uppercase tracking-wider text-slate-700">Triage Priority Score</div>
            <PriorityBadge priority={priority} size="md" />
          </div>
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
            {priority_reasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                <CheckCircle2 size={13} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Department Card */}
        {department && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 flex-shrink-0">
              <Building2 size={20} />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Assigned Department</div>
              <div className="font-bold text-sm text-slate-900">{department}</div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-slate-200 p-4 space-y-2 z-20 shadow-lg">
        <button
          onClick={() => navigate(`/citizen/issue/${result.civic_issue_id}`)}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition"
        >
          <span>Track Live Resolution Progress</span>
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => navigate('/citizen/home')}
          className="w-full text-slate-600 hover:text-slate-900 text-xs font-semibold text-center py-1.5 transition"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  )
}
