import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, ShieldCheck, Info, MapPin, Eye, Filter } from 'lucide-react'
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useSOSStore, SafetyZone } from '../../store/sos'

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const RISK_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#16a34a',
}

export default function SafetyMap() {
  const navigate = useNavigate()
  const { safetyZones, fetchSafetyZones } = useSOSStore()
  const [selectedZone, setSelectedZone] = useState<SafetyZone | null>(null)
  const [filter, setFilter] = useState<'all' | 'critical' | 'high'>('all')

  useEffect(() => {
    fetchSafetyZones()
  }, [])

  const filteredZones = safetyZones.filter(z => {
    if (filter === 'critical') return z.risk_label === 'critical'
    if (filter === 'high') return z.risk_label === 'critical' || z.risk_label === 'high'
    return true
  })

  return (
    <div className="citizen-app min-h-screen bg-white flex flex-col pb-6">
      <div className="tricolor-bar w-full" />

      {/* Header */}
      <div className="text-white px-5 pt-8 pb-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/citizen/sos')} className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-bold text-base flex items-center gap-1.5">
              <span>Predictive Safety Map</span>
              <span className="text-[10px] bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full font-bold">AI INTELLIGENCE</span>
            </h1>
            <div className="text-xs text-slate-400">Risk zones detected from civic complaint density</div>
          </div>
        </div>
      </div>

      {/* Concept Explainer Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900 flex items-start gap-2">
        <AlertTriangle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Prevention Mechanism:</span> Unresolved broken streetlights & isolated civic issues automatically mark areas as higher risk.
        </div>
      </div>

      {/* Map Container */}
      <div style={{ height: '340px' }} className="relative">
        <MapContainer center={[18.5308, 73.8474]} zoom={11} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {filteredZones.map((zone, idx) => {
            const color = RISK_COLORS[zone.risk_label] || '#64748b'
            return (
              <React.Fragment key={zone.ward + idx}>
                <Circle
                  center={[zone.latitude, zone.longitude]}
                  radius={1200}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.25,
                    weight: 2
                  }}
                  eventHandlers={{
                    click: () => setSelectedZone(zone),
                  }}
                />
                <Marker
                  position={[zone.latitude, zone.longitude]}
                  eventHandlers={{
                    click: () => setSelectedZone(zone),
                  }}
                >
                  <Popup>
                    <div className="text-xs">
                      <div className="font-bold text-slate-800">{zone.ward}</div>
                      <div className="text-slate-600 mt-1 uppercase font-bold" style={{ color }}>
                        {zone.risk_label} Safety Risk
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {zone.unresolved_count} active complaints in this zone
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            )
          })}
        </MapContainer>

        {/* Floating Filter Pills */}
        <div className="absolute top-3 right-3 z-[1000] bg-white/90 backdrop-blur-md rounded-xl p-1 shadow-md border border-slate-200 flex gap-1 text-[11px] font-bold">
          {(['all', 'critical', 'high'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-lg capitalize transition ${filter === f ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Zone Detail Card or List */}
      <div className="px-5 py-4 space-y-4 flex-1">
        {selectedZone ? (
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 animate-fade-in-up">
            <div className="flex items-center justify-between mb-2">
              <div className="font-black text-sm text-slate-800">{selectedZone.ward}</div>
              <span
                className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full text-white"
                style={{ background: RISK_COLORS[selectedZone.risk_label] }}
              >
                {selectedZone.risk_label} Risk ({Math.round(selectedZone.risk_score * 100)}%)
              </span>
            </div>

            <div className="space-y-1.5 my-3">
              <div className="text-xs font-bold text-slate-700">Identified Safety Factors:</div>
              {selectedZone.reasons.map((r, i) => (
                <div key={i} className="text-xs text-slate-600 flex items-start gap-1.5 bg-white p-2 rounded-lg border border-slate-200/70">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setSelectedZone(null)}
                className="w-full py-2 bg-slate-200 font-bold text-slate-700 rounded-xl hover:bg-slate-300"
              >
                Close Details
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">High Risk Zones in City</span>
              <span className="text-xs text-slate-400">{filteredZones.length} zones</span>
            </div>

            <div className="space-y-2.5">
              {filteredZones.map(zone => {
                const color = RISK_COLORS[zone.risk_label]
                return (
                  <button
                    key={zone.ward}
                    onClick={() => setSelectedZone(zone)}
                    className="w-full text-left bg-slate-50 hover:bg-slate-100/80 p-3.5 rounded-2xl border border-slate-200 flex items-start justify-between transition"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <MapPin size={13} style={{ color }} />
                        <span>{zone.ward}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                        {zone.reasons[0]}
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: `${color}15`, color }}
                    >
                      {zone.risk_label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
