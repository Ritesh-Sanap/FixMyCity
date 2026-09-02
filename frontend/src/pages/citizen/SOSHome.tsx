import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldAlert, Users, Plus, Trash2, MapPin, AlertTriangle, ChevronRight, Phone, ShieldCheck, Info } from 'lucide-react'
import { useSOSStore } from '../../store/sos'
import { useAuthStore } from '../../store/auth'

export default function SOSHome() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { contacts, safetyZones, activeAlert, fetchContacts, fetchSafetyZones, fetchActiveAlert, triggerSOS, addContact, removeContact } = useSOSStore()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [relation, setRelation] = useState('Family')
  const [showAddModal, setShowAddModal] = useState(false)
  const [isPressing, setIsPressing] = useState(false)
  const [pressTimer, setPressTimer] = useState<any>(null)
  const [location, setLocation] = useState<{ lat: number; lon: number; address: string; ward: string } | null>(null)
  const [locLoading, setLocLoading] = useState(true)

  useEffect(() => {
    fetchActiveAlert()
    fetchContacts()
    fetchSafetyZones()

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            address: 'Pune, Maharashtra',
            ward: user?.ward || 'Ward 6 - Baner'
          })
          setLocLoading(false)
        },
        () => {
          setLocation({
            lat: 18.5204,
            lon: 73.8567,
            address: 'Pune Central, Maharashtra (Demo)',
            ward: user?.ward || 'Ward 6 - Baner'
          })
          setLocLoading(false)
        }
      )
    } else {
      setLocation({
        lat: 18.5204,
        lon: 73.8567,
        address: 'Pune Central (Demo)',
        ward: user?.ward || 'Ward 6 - Baner'
      })
      setLocLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeAlert && activeAlert.status === 'active') {
      navigate('/citizen/sos/active')
    }
  }, [activeAlert])

  const handleSOS = async () => {
    try {
      await triggerSOS(
        location?.lat || 18.5204,
        location?.lon || 73.8567,
        location?.address || 'Pune, MH',
        location?.ward || 'Ward 6 - Baner'
      )
      navigate('/citizen/sos/active')
    } catch (e) {
      alert('Error triggering SOS. Please try again.')
    }
  }

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !phone) return
    await addContact(name, phone, relation)
    setName('')
    setPhone('')
    setShowAddModal(false)
  }

  // Find risk status for current area
  const currentZone = safetyZones.find(z => location?.ward && z.ward.toLowerCase().includes(location.ward.toLowerCase())) || safetyZones[0]

  return (
    <div className="citizen-app bg-white min-h-screen pb-12">
      {/* Tricolor top stripe */}
      <div className="tricolor-bar w-full" />

      {/* Header */}
      <div className="text-white px-5 pt-8 pb-6 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 60%, #450a0a 100%)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/citizen/home')} className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="font-bold text-lg flex items-center gap-1.5">
              <span>Women Safety SOS</span>
              <span className="text-xs bg-red-500/40 text-red-200 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">24/7</span>
            </div>
            <div className="text-xs text-red-200">Emergency & Preventive Safety Intelligence</div>
          </div>
        </div>
        <img src="/logo.png" alt="FixMyCity" style={{ width: 32, height: 32, objectFit: 'contain' }} />
      </div>

      <div className="px-5 py-5 space-y-6">

        {/* Big SOS Trigger Section */}
        <div className="text-center bg-red-50/70 border-2 border-red-200 rounded-3xl p-6 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-widest text-red-700 mb-2">Emergency Response</div>
          <p className="text-xs text-slate-600 mb-6">Tap to immediately notify authorities, trusted contacts & nearby volunteers with live location.</p>

          <div className="flex justify-center my-3">
            <button
              onClick={handleSOS}
              className="relative group focus:outline-none"
              style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                background: 'radial-gradient(circle, #ef4444 0%, #b91c1c 80%)',
                boxShadow: '0 0 0 10px rgba(239, 68, 68, 0.2), 0 10px 30px rgba(185, 28, 28, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
              onMouseDown={() => setIsPressing(true)}
              onMouseUp={() => setIsPressing(false)}
            >
              <ShieldAlert size={42} className="animate-pulse" />
              <span className="font-black text-2xl tracking-wider mt-1">SOS</span>
              <span className="text-[10px] tracking-tight uppercase text-red-100">Tap for Help</span>
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <MapPin size={13} className="text-red-500" />
            <span>GPS Tracking Active: {locLoading ? 'Locating...' : (location?.address || 'Pune')}</span>
          </div>
        </div>

        {/* Predictive Safety / Preventive Risk Card */}
        {currentZone && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600" />
                <span className="font-bold text-sm text-slate-800">Civic Safety Intelligence</span>
              </div>
              <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${
                currentZone.risk_label === 'critical' ? 'bg-red-100 text-red-700' :
                currentZone.risk_label === 'high' ? 'bg-orange-100 text-orange-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {currentZone.risk_label} Risk Zone
              </span>
            </div>

            <div className="text-xs text-slate-700 mb-2 font-medium">
              Area: <span className="font-bold">{currentZone.ward}</span>
            </div>

            <div className="bg-white/80 rounded-xl p-2.5 border border-amber-100 text-xs space-y-1 mb-3">
              <div className="font-semibold text-slate-700 flex items-center gap-1">
                <Info size={13} className="text-amber-600" /> Safety reasons identified from complaints:
              </div>
              {currentZone.reasons.slice(0, 2).map((r, i) => (
                <div key={i} className="text-slate-600 flex items-start gap-1.5 pl-1">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/citizen/safety-map')}
              className="w-full bg-amber-600 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-amber-700 transition"
            >
              <span>View City Safety Risk Map</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Emergency Contacts Section */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-blue-600" />
              <span className="font-bold text-sm text-slate-800">Emergency Contacts</span>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline"
            >
              <Plus size={14} /> Add Contact
            </button>
          </div>

          {contacts.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
              No emergency contacts added yet.
              <button
                onClick={() => setShowAddModal(true)}
                className="block mx-auto mt-2 text-blue-600 font-semibold"
              >
                + Add Trusted Contact
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((c) => (
                <div key={c.id} className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{c.name} ({c.relation || 'Contact'})</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone size={10} /> {c.phone}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeContact(c.id)}
                    className="text-slate-400 hover:text-red-500 p-1.5 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Emergency Helplines Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Direct Government Helplines</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <a href="tel:112" className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl text-white">
              <div className="font-black text-sm text-red-400">112</div>
              <div className="text-[10px] text-slate-300">National SOS</div>
            </a>
            <a href="tel:1091" className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl text-white">
              <div className="font-black text-sm text-pink-400">1091</div>
              <div className="text-[10px] text-slate-300">Women Helpline</div>
            </a>
            <a href="tel:100" className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl text-white">
              <div className="font-black text-sm text-blue-400">100</div>
              <div className="text-[10px] text-slate-300">Police</div>
            </a>
          </div>
        </div>

      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
            <div className="font-bold text-base text-slate-800 mb-3">Add Emergency Contact</div>
            <form onSubmit={handleAddContactSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Contact Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm input-tricolor"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm input-tricolor"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Relationship</label>
                <select
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                >
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Sister">Sister</option>
                  <option value="Brother">Brother</option>
                  <option value="Friend">Friend</option>
                  <option value="Guardian">Guardian</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
