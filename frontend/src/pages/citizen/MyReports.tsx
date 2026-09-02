import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, ChevronRight } from 'lucide-react'
import api from '../../services/api'
import { Complaint } from '../../types'
import { StatusBadge, CategoryIcon } from '../../components/ui/Badges'

export default function MyReports() {
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/complaints/my')
      .then((r) => {
        const data = r.data
        if (Array.isArray(data)) setComplaints(data)
        else if (data && Array.isArray(data.items)) setComplaints(data.items)
        else if (data && Array.isArray(data.complaints)) setComplaints(data.complaints)
        else setComplaints([])
      })
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="citizen-app min-h-screen bg-white">
      <div className="tricolor-bar w-full" />
      <div className="text-white px-5 pt-10 pb-6 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          <div>
            <div className="font-bold text-lg">My Reports</div>
            <div className="text-xs" style={{ color: '#94a3b8' }}>{complaints.length} complaints submitted</div>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 space-y-3 pb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))
        ) : complaints.length === 0 ? (
          <div className="text-center text-slate-400 py-16">
            <FileText size={48} className="mx-auto mb-4 opacity-30" />
            <div className="font-semibold text-lg">No reports yet</div>
            <div className="text-sm mt-1">See a problem? Report it!</div>
            <button
              onClick={() => navigate('/citizen/report')}
              className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold"
            >
              Report a Problem
            </button>
          </div>
        ) : (
          complaints.map((c) => (
            <button
              key={c.id}
              onClick={() => c.civic_issue_id && navigate(`/citizen/issue/${c.civic_issue_id}`)}
              className="w-full text-left bg-slate-50 rounded-2xl p-4 flex items-start gap-3 hover:bg-slate-100 transition-colors"
            >
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <CategoryIcon category={c.category} size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">{c.complaint_number}</span>
                  <span className="text-xs text-slate-400">{new Date(c.submitted_at).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="text-xs text-slate-500 capitalize mt-0.5">{c.category.replace('_', ' ')}</div>
                <div className="mt-1.5 flex items-center gap-2">
                  {c.is_duplicate && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Linked</span>
                  )}
                  {c.description && (
                    <span className="text-xs text-slate-400 truncate">{c.description.slice(0, 50)}</span>
                  )}
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300 mt-1 flex-shrink-0" />
            </button>
          ))
        )}
      </div>
    </div>
  )
}
