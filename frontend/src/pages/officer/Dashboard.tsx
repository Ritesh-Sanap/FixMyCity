import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import {
  LayoutDashboard, Map, List, BarChart3, LogOut, AlertTriangle,
  TrendingUp, Users, CheckCircle2, Clock, AlertCircle, ChevronRight, ShieldAlert, Radio, ShieldCheck, MapPin
} from 'lucide-react'
import api from '../../services/api'
import { DashboardStats, MapIssue, CivicIssue, PRIORITY_COLORS, CATEGORY_ICONS, STATUS_LABELS } from '../../types'
import { useAuthStore } from '../../store/auth'
import { PriorityBadge, StatusBadge, CategoryIcon } from '../../components/ui/Badges'

// Fix Leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function createPriorityIcon(priority: string, status: string) {
  const color = status === 'closed' ? '#22c55e' : status === 'resolved' ? '#4ade80' : (PRIORITY_COLORS[priority] || '#6b7280')
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

type Tab = 'dashboard' | 'map' | 'issues' | 'predictions' | 'sos'

export default function OfficerDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [mapIssues, setMapIssues] = useState<MapIssue[]>([])
  const [issues, setIssues] = useState<CivicIssue[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [activeSosAlerts, setActiveSosAlerts] = useState<any[]>([])
  const [safetyZones, setSafetyZones] = useState<any[]>([])
  const [filterPriority, setFilterPriority] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  useEffect(() => {
    api.get<DashboardStats>('/dashboard/stats').then(r => setStats(r.data)).catch(() => {})
    api.get<MapIssue[]>('/dashboard/map-data').then(r => setMapIssues(r.data)).catch(() => {})
    api.get<CivicIssue[]>('/civic-issues/?limit=100').then(r => setIssues(r.data)).catch(() => {})
    api.get<any[]>('/dashboard/predictions').then(r => setPredictions(r.data)).catch(() => {})
    api.get<any[]>('/sos/active-alerts').then(r => setActiveSosAlerts(r.data)).catch(() => {})
    api.get<any[]>('/sos/safety-zones').then(r => setSafetyZones(r.data)).catch(() => {})
  }, [])

  const filteredIssues = issues.filter(i => {
    if (filterPriority && i.priority !== filterPriority) return false
    if (filterStatus && i.status !== filterStatus) return false
    if (filterCategory && i.category !== filterCategory) return false
    return true
  })

  const KpiCard = ({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) => (
    <div className={`${color} rounded-2xl p-4 flex items-center gap-4`}>
      <div className="opacity-80">{icon}</div>
      <div>
        <div className="text-3xl font-black">{value}</div>
        <div className="text-sm opacity-75 font-medium">{label}</div>
      </div>
    </div>
  )

  const SidebarButton = ({ icon, label, tabKey }: { icon: React.ReactNode; label: string; tabKey: Tab }) => (
    <button
      onClick={() => setTab(tabKey)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        tab === tabKey ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      {icon} {label}
    </button>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0">
        <div className="border-b border-slate-700" style={{ padding: 0 }}>
          <div className="tricolor-bar w-full" />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <img src="/logo.png" alt="FixMyCity" style={{ width: 32, height: 32, objectFit: 'contain' }} />
              <div className="text-xl font-black" style={{ color: '#FF9933' }}>FixMyCity</div>
            </div>
            <div className="text-xs text-slate-400">Civic Command Center</div>
            <div className="text-xs font-medium mt-1" style={{ color: '#138808' }}>🏛️ {user?.name}</div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <SidebarButton icon={<LayoutDashboard size={18} />} label="Dashboard" tabKey="dashboard" />
          <SidebarButton icon={<Map size={18} />} label="Live Map" tabKey="map" />
          <SidebarButton icon={<List size={18} />} label="All Issues" tabKey="issues" />
          <SidebarButton icon={<TrendingUp size={18} />} label="Predictions" tabKey="predictions" />
          <SidebarButton
            icon={<ShieldAlert size={18} className={activeSosAlerts.length > 0 ? "text-red-400 animate-pulse" : ""} />}
            label={`SOS Alerts ${activeSosAlerts.length > 0 ? `(${activeSosAlerts.length})` : ''}`}
            tabKey="sos"
          />
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button onClick={logout} className="w-full flex items-center gap-2 text-slate-400 hover:text-white text-sm py-2">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-auto bg-slate-50">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="font-bold text-xl text-slate-800">
              {tab === 'dashboard' ? '📊 Dashboard Overview' :
               tab === 'map' ? '🗺️ Live Civic Map' :
               tab === 'issues' ? '📋 All Issues' :
               tab === 'predictions' ? '🔮 Predictive Intelligence' : '🚨 Active SOS & Women Safety Response'}
            </div>
            <div className="text-slate-400 text-sm">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stats && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2">
                <AlertCircle size={16} /> {stats.critical} Critical
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* ── DASHBOARD TAB ─────────────────────────────────── */}
          {tab === 'dashboard' && stats && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
                <KpiCard label="Total Issues" value={stats.total_issues} icon={<List size={28} />} color="bg-white border border-slate-200 text-slate-800 shadow-sm" />
                <KpiCard label="Critical" value={stats.critical} icon={<AlertTriangle size={28} />} color="bg-red-500 text-white" />
                <KpiCard label="High Priority" value={stats.high} icon={<AlertCircle size={28} />} color="bg-orange-500 text-white" />
                <KpiCard label="Pending" value={stats.pending} icon={<Clock size={28} />} color="bg-amber-400 text-white" />
                <KpiCard label="Resolved" value={stats.resolved + stats.closed} icon={<CheckCircle2 size={28} />} color="bg-green-500 text-white" />
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Critical Issues */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="font-bold text-slate-800">Recent Critical Issues</div>
                    <button onClick={() => setTab('issues')} className="text-blue-600 text-sm">View all →</button>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {issues.filter(i => i.priority === 'critical').slice(0, 6).map(issue => (
                      <button
                        key={issue.id}
                        onClick={() => navigate(`/officer/issue/${issue.id}`)}
                        className="w-full text-left px-5 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                      >
                        <CategoryIcon category={issue.category} size={20} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">{issue.title}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <StatusBadge status={issue.status} />
                            <span className="text-xs text-slate-400">{issue.report_count} reports</span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-300" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                  <div className="font-bold text-slate-800 mb-4">By Category</div>
                  {Object.entries(CATEGORY_ICONS).map(([cat, icon]) => {
                    const count = issues.filter(i => i.category === cat).length
                    return (
                      <div key={cat} className="flex items-center gap-3 mb-3">
                        <span className="text-xl w-8 text-center">{icon}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600 capitalize">{cat.replace('_', ' ')}</span>
                            <span className="font-bold text-slate-800">{count}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${(count / Math.max(issues.length, 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-center text-sm">
                    <div>
                      <div className="text-2xl font-black text-slate-800">{stats.total_citizens}</div>
                      <div className="text-slate-500">Citizens</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-slate-800">{stats.total_complaints}</div>
                      <div className="text-slate-500">Total Reports</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── MAP TAB ─────────────────────────────────────────── */}
          {tab === 'map' && (
            <div className="space-y-4">
              <div className="flex gap-3 flex-wrap text-sm">
                {Object.entries(PRIORITY_COLORS).map(([p, c]) => (
                  <div key={p} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: c }} />
                    <span className="capitalize text-slate-600">{p}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-slate-600">Resolved</span>
                </div>
              </div>
              <div style={{ height: 'calc(100vh - 220px)' }} className="rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                <MapContainer center={[18.5204, 73.8567]} zoom={12} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  {mapIssues.filter(i => i.latitude && i.longitude).map(issue => (
                    <Marker
                      key={issue.id}
                      position={[issue.latitude!, issue.longitude!]}
                      icon={createPriorityIcon(issue.priority, issue.status)}
                    >
                      <Popup>
                        <div className="text-sm min-w-[200px]">
                          <div className="font-bold text-slate-800">{issue.title}</div>
                          <div className="text-slate-500 text-xs">{issue.issue_number}</div>
                          <div className="mt-2 space-y-1 text-xs">
                            <div>🗂️ {issue.category.replace('_', ' ')}</div>
                            <div>👥 {issue.report_count} reports</div>
                            <div>⚡ {issue.priority.toUpperCase()}</div>
                            <div>🏛️ {issue.department_name || '—'}</div>
                          </div>
                          <button
                            onClick={() => navigate(`/officer/issue/${issue.id}`)}
                            className="mt-3 w-full bg-blue-600 text-white text-xs py-1.5 rounded-lg font-semibold"
                          >
                            Open Issue →
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          )}

          {/* ── ISSUES TAB ─────────────────────────────────────── */}
          {tab === 'issues' && (
            <div>
              {/* Filters */}
              <div className="flex gap-3 mb-4 flex-wrap">
                {[
                  { label: 'Priority', value: filterPriority, options: ['', 'critical', 'high', 'medium', 'low'], setter: setFilterPriority },
                  { label: 'Status', value: filterStatus, options: ['', 'submitted', 'ai_verified', 'assigned', 'work_started', 'resolved', 'closed'], setter: setFilterStatus },
                  { label: 'Category', value: filterCategory, options: ['', 'pothole', 'garbage', 'water_leakage', 'broken_streetlight', 'damaged_road'], setter: setFilterCategory },
                ].map(({ label, value, options, setter }) => (
                  <select
                    key={label}
                    value={value}
                    onChange={e => setter(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">{label}: All</option>
                    {options.filter(o => o).map(o => (
                      <option key={o} value={o}>{o.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                ))}
                <div className="text-sm text-slate-500 flex items-center">{filteredIssues.length} issues</div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {filteredIssues.map(issue => (
                    <button
                      key={issue.id}
                      onClick={() => navigate(`/officer/issue/${issue.id}`)}
                      className="w-full text-left px-5 py-4 hover:bg-slate-50 flex items-center gap-4 transition-colors"
                    >
                      <CategoryIcon category={issue.category} size={22} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-800 truncate">{issue.title}</span>
                          <span className="text-xs text-slate-400 flex-shrink-0">{issue.issue_number}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={issue.status} />
                          <PriorityBadge priority={issue.priority} />
                          <span className="text-xs text-slate-400">👥 {issue.report_count}</span>
                          <span className="text-xs text-slate-400">{issue.department_name}</span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── PREDICTIONS TAB ─────────────────────────────────── */}
          {tab === 'predictions' && (
            <div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-amber-800 text-sm">
                  <span className="font-bold">⚠️ PROTOTYPE PREDICTIONS</span> — Generated using synthetic sample data. 
                  Not based on official government records. For demonstration purposes only.
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {predictions.map(pred => (
                  <div key={pred.id} className={`bg-white rounded-2xl shadow-sm border-2 p-5 ${
                    pred.risk_label === 'critical' ? 'border-red-200' :
                    pred.risk_label === 'high' ? 'border-orange-200' :
                    'border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-bold text-slate-800 text-sm">{pred.ward}</div>
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                        pred.risk_label === 'critical' ? 'bg-red-100 text-red-700' :
                        pred.risk_label === 'high' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{pred.risk_label}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{CATEGORY_ICONS[pred.category] || '📍'}</span>
                      <div>
                        <div className="text-xs text-slate-400">Category</div>
                        <div className="text-sm font-semibold capitalize">{pred.category.replace('_', ' ')}</div>
                      </div>
                    </div>
                    {/* Risk score bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Risk Score</span>
                        <span className="font-bold text-red-600">{Math.round(pred.risk_score * 100)}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full">
                        <div
                          className={`h-full rounded-full ${
                            pred.risk_label === 'critical' ? 'bg-red-500' :
                            pred.risk_label === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${pred.risk_score * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      {(pred.reasons || []).slice(0, 3).map((r: string, i: number) => (
                        <div key={i} className="text-xs text-slate-500 flex items-start gap-1">
                          <span className="text-slate-400">•</span> {r}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SOS ALERTS TAB (NEW) ───────────────────────────── */}
          {tab === 'sos' && (
            <div className="space-y-6">
              {/* Emergency Banner */}
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <ShieldAlert size={28} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-base text-red-900">Women Safety & SOS Command Center</div>
                    <div className="text-xs text-red-700 mt-0.5">
                      Real-time emergency tracking combined with civic complaint safety analytics for preventive action.
                    </div>
                  </div>
                </div>
                <div className="bg-red-600 text-white px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <Radio size={14} className="animate-spin" />
                  <span>{activeSosAlerts.length} Active SOS</span>
                </div>
              </div>

              {/* Active SOS Alerts List */}
              <div>
                <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
                  <Radio size={16} className="text-red-600 animate-pulse" />
                  <span>Active Emergency Broadcasts</span>
                </h3>

                {activeSosAlerts.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400">
                    <ShieldCheck size={36} className="text-green-500 mx-auto mb-2" />
                    <div className="font-bold text-slate-700">No Active SOS Alerts</div>
                    <div className="text-xs text-slate-400 mt-1">All citizens are currently marked safe.</div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {activeSosAlerts.map(alert => (
                      <div key={alert.id} className="bg-white border-2 border-red-300 rounded-2xl p-5 shadow-sm space-y-3 animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="font-black text-slate-900 text-base">{alert.user_name || 'Citizen'}</div>
                          <span className="bg-red-600 text-white text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full">
                            EMERGENCY
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-1.5">
                          <MapPin size={14} className="text-red-600 flex-shrink-0" />
                          <span className="font-medium">{alert.address || 'Pune Central'}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl text-xs text-slate-600 font-mono">
                          Coordinates: {alert.latitude?.toFixed(5) || '18.5204'}, {alert.longitude?.toFixed(5) || '73.8567'}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <span className="text-slate-400">Triggered: {new Date(alert.created_at).toLocaleTimeString('en-IN')}</span>
                          <span className="text-blue-600 font-bold">PCR Unit Dispatched</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Safety Intelligence: High Risk Zones for Preventive Inspection */}
              <div>
                <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500" />
                  <span>Preventive Safety: Risk Zones Derived from Civic Complaints</span>
                </h3>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {safetyZones.map((zone: any) => (
                    <div key={zone.ward} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm text-slate-800 truncate">{zone.ward}</div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          zone.risk_label === 'critical' ? 'bg-red-100 text-red-700' :
                          zone.risk_label === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {zone.risk_label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 space-y-1">
                        {zone.reasons.slice(0, 2).map((r: string, i: number) => (
                          <div key={i} className="flex items-start gap-1">
                            <span className="text-amber-500 font-bold">•</span>
                            <span className="text-slate-500 text-[11px]">{r}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{zone.unresolved_count} active complaints</span>
                        <span className="text-indigo-600 font-semibold">Flagged for Night Patrol</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
