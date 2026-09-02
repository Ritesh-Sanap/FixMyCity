import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import api from '../../services/api'
import { CivicIssue, PRIORITY_COLORS } from '../../types'
import { StatusBadge, PriorityBadge, CategoryIcon } from '../../components/ui/Badges'

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function createPriorityIcon(priority: string) {
  const color = PRIORITY_COLORS[priority] || '#6b7280'
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

export default function NearbyIssues() {
  const navigate = useNavigate()
  const [issues, setIssues] = useState<CivicIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [userPos, setUserPos] = useState<[number, number]>([18.5204, 73.8567])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        setUserPos([lat, lon])
        api.get<CivicIssue[]>(`/civic-issues/nearby?lat=${lat}&lon=${lon}&radius_meters=2000`)
          .then((r) => setIssues(r.data))
          .finally(() => setLoading(false))
      },
      () => {
        // Demo fallback — load all issues near Pune
        api.get<CivicIssue[]>(`/civic-issues/nearby?lat=18.5204&lon=73.8567&radius_meters=20000`)
          .then((r) => setIssues(r.data))
          .finally(() => setLoading(false))
      }
    )
  }, [])

  return (
    <div className="citizen-app min-h-screen bg-white">
      <div className="tricolor-bar w-full" />
      <div className="text-white px-5 pt-10 pb-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          <div>
            <div className="font-bold text-lg">Nearby Issues</div>
            <div className="text-xs" style={{ color: '#94a3b8' }}>{issues.length} issues near you</div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div style={{ height: '300px' }}>
        <MapContainer center={userPos} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {issues.filter(i => i.latitude && i.longitude).map((issue) => (
            <Marker
              key={issue.id}
              position={[issue.latitude!, issue.longitude!]}
              icon={createPriorityIcon(issue.priority)}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold">{issue.title}</div>
                  <div className="text-slate-500">{issue.issue_number}</div>
                  <div className="mt-1">{issue.report_count} reports · {issue.priority.toUpperCase()}</div>
                  <button
                    onClick={() => navigate(`/citizen/issue/${issue.id}`)}
                    className="mt-2 text-blue-600 font-semibold text-xs"
                  >
                    View Details →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 flex gap-4 text-xs text-slate-500 bg-slate-50 border-b border-slate-100">
        {Object.entries(PRIORITY_COLORS).map(([p, c]) => (
          <div key={p} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ background: c }} />
            <span className="capitalize">{p}</span>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="px-5 py-4 space-y-3 pb-8">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)
        ) : issues.map((issue) => (
          <button
            key={issue.id}
            onClick={() => navigate(`/citizen/issue/${issue.id}`)}
            className="w-full text-left bg-slate-50 rounded-2xl p-4 flex items-start gap-3 hover:bg-slate-100 transition-colors"
          >
            <CategoryIcon category={issue.category} size={24} />
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-800 truncate">{issue.title}</div>
              <div className="flex gap-2 mt-1 flex-wrap">
                <StatusBadge status={issue.status} />
                <PriorityBadge priority={issue.priority} />
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <MapPin size={10} /> {issue.address || issue.ward}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
