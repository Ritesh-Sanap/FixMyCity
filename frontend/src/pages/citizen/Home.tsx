import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, FileText, Bell, ChevronRight, Home, User, ShieldAlert, Settings as SettingsIcon } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { useLanguageStore } from '../../store/language'
import api from '../../services/api'
import { CivicIssue } from '../../types'
import { StatusBadge, PriorityBadge, CategoryIcon } from '../../components/ui/Badges'

export default function CitizenHome() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { t } = useLanguageStore()
  const [recentIssues, setRecentIssues] = useState<CivicIssue[]>([])
  const [location, setLocation] = useState('Detecting location...')

  // ── All existing data-fetching logic preserved exactly ─────────────────────
  useEffect(() => {
    api.get<CivicIssue[]>('/civic-issues/?limit=5').then((r) => setRecentIssues(r.data)).catch(() => {})
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
        () => setLocation('Pune, Maharashtra (approx.)')
      )
    }
  }, [])

  return (
    <div className="citizen-app bg-white" style={{ paddingBottom: '72px' }}>

      {/* ── Tricolor top stripe ── */}
      <div className="tricolor-bar w-full" />

      {/* ── Header — logo + greeting + Settings & Logout ── */}
      <div
        className="text-white px-5 pt-8 pb-8"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' }}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/citizen/settings')}>
            {/* Mini logo in header */}
            <img
              src="/logo.png"
              alt="FixMyCity"
              className="logo-img"
              style={{ width: 38, height: 38, objectFit: 'contain' }}
            />
            <div>
              <div className="font-black text-lg leading-tight" style={{ color: '#FF9933' }}>FixMyCity</div>
              <div className="text-xs font-medium" style={{ color: '#94a3b8' }}>नमस्ते, {user?.name?.split(' ')[0]} 👋</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/citizen/settings')}
              title="Settings & Profile"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10"
            >
              <SettingsIcon size={16} />
            </button>
            <button
              onClick={logout}
              className="text-xs rounded-full px-3 py-1.5 transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              {t('logout')}
            </button>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs mb-2" style={{ color: '#94a3b8' }}>
          <MapPin size={11} style={{ color: '#138808' }} />
          <span>{location}</span>
        </div>
        <div className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {t('whats_wrong')}
        </div>
      </div>

      {/* ── REPORT A PROBLEM CTA — saffron→green gradient ── */}
      <div className="px-5 -mt-5">
        <button
          onClick={() => navigate('/citizen/report')}
          className="btn-saffron w-full rounded-2xl p-5 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #FF9933 0%, #e67e00 50%, #138808 100%)' }}
        >
          <div className="text-left">
            <div className="text-xl font-black tracking-tight">{t('report_problem')}</div>
            <div className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.85)' }}>{t('report_desc')}</div>
          </div>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.22)' }}
          >
            <span className="text-3xl">📸</span>
          </div>
        </button>
      </div>

      {/* ── Quick Actions — tricolor icons ── */}
      <div className="px-5 mt-4 grid grid-cols-3 gap-3">
        {[
          {
            icon: <FileText size={22} />,
            label: t('my_reports'),
            path: '/citizen/my-reports',
            bg: '#fff7ed',
            color: '#FF9933',
            border: '#FF9933',
          },
          {
            icon: <MapPin size={22} />,
            label: t('nearby_issues'),
            path: '/citizen/nearby',
            bg: '#f0fdf4',
            color: '#138808',
            border: '#138808',
            badge: recentIssues.length > 0 ? recentIssues.length : undefined,
          },
          {
            icon: <Bell size={22} />,
            label: t('notifications'),
            path: '/citizen/settings',
            bg: '#eff6ff',
            color: '#2563eb',
            border: '#2563eb',
          },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="quick-action-btn rounded-2xl py-4 px-3 flex flex-col items-center gap-2 relative"
            style={{ background: item.bg, border: `1.5px solid ${item.border}22` }}
          >
            <span style={{ color: item.color }}>{item.icon}</span>
            <span className="text-xs font-bold" style={{ color: item.color }}>{item.label}</span>
            {item.badge && (
              <span className="notif-badge">{item.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Recent Issues Near You ── */}
      <div className="px-5 mt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-slate-800">{t('recent_issues')}</div>
          <button
            onClick={() => navigate('/citizen/nearby')}
            className="link-saffron text-sm flex items-center gap-1"
          >
            {t('view_all')} <ChevronRight size={15} />
          </button>
        </div>

        <div className="space-y-3">
          {recentIssues.length === 0 ? (
            <div className="text-slate-400 text-sm text-center py-8">Loading nearby issues...</div>
          ) : (
            recentIssues.map((issue) => (
              <button
                key={issue.id}
                onClick={() => navigate(`/citizen/issue/${issue.id}`)}
                className="card-interactive w-full text-left bg-slate-50 rounded-2xl p-4 flex items-start gap-3"
                style={{ border: '1px solid #f1f5f9' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}
                >
                  <CategoryIcon category={issue.category} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate mb-1">{issue.title}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={issue.status} />
                    <PriorityBadge priority={issue.priority} />
                  </div>
                  <div className="text-xs mt-1 flex items-center gap-1" style={{ color: '#94a3b8' }}>
                    <MapPin size={10} />
                    <span className="truncate">{issue.address || issue.ward || 'Location recorded'}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="mt-1 flex-shrink-0" style={{ color: '#cbd5e1' }} />
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Bottom Navigation Bar ── */}
      <nav className="bottom-nav">
        <button className="bottom-nav-item active" onClick={() => navigate('/citizen/home')}>
          <Home size={20} />
          <span>Home</span>
        </button>
        <button className="bottom-nav-item" onClick={() => navigate('/citizen/my-reports')}>
          <FileText size={20} />
          <span>Reports</span>
        </button>

        {/* Centre FAB — saffron report button */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={() => navigate('/citizen/report')}
            className="btn-saffron"
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              fontSize: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '-20px',
              border: '3px solid white',
            }}
          >
            +
          </button>
        </div>

        <button className="bottom-nav-item" onClick={() => navigate('/citizen/nearby')}>
          <MapPin size={20} />
          <span>Nearby</span>
        </button>
        <button
          className="bottom-nav-item"
          style={{ color: '#ef4444' }}
          onClick={() => navigate('/citizen/sos')}
        >
          <ShieldAlert size={20} className="text-red-500" />
          <span className="text-red-600 font-bold">Safety SOS</span>
        </button>
      </nav>
    </div>
  )
}
