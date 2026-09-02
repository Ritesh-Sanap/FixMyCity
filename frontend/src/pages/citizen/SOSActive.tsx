import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ShieldCheck, MapPin, Radio, Phone, Users, ShieldAlert, CheckCircle2, Navigation, BellRing, X } from 'lucide-react'
import { useSOSStore } from '../../store/sos'

export default function SOSActive() {
  const navigate = useNavigate()
  const { activeAlert, contacts, markSafe, cancelSOS, fetchActiveAlert } = useSOSStore()
  const [seconds, setSeconds] = useState(0)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isResolving, setIsResolving] = useState(false)

  useEffect(() => {
    fetchActiveAlert()
    const timer = setInterval(() => {
      setSeconds(s => s + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleMarkSafe = async () => {
    setIsResolving(true)
    try {
      await markSafe()
      navigate('/citizen/home')
    } catch (e) {
      alert('Failed to update status')
    } finally {
      setIsResolving(false)
    }
  }

  const handleCancelSOS = async () => {
    setIsResolving(true)
    try {
      await cancelSOS()
      navigate('/citizen/home')
    } catch (e) {
      alert('Failed to cancel SOS')
    } finally {
      setIsResolving(false)
    }
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="citizen-app min-h-screen bg-slate-900 text-white flex flex-col justify-between pb-6">
      
      {/* Top Red Pulsing Alarm Header */}
      <div>
        <div className="bg-red-600 text-white px-5 py-6 text-center animate-pulse relative shadow-lg">
          <div className="inline-flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest text-red-200 mb-2">
            <Radio size={14} className="animate-spin text-red-400" /> LIVE EMERGENCY BROADCAST
          </div>
          <h1 className="text-3xl font-black tracking-tight flex items-center justify-center gap-2">
            <ShieldAlert size={36} className="text-white animate-bounce" />
            <span>SOS ACTIVE</span>
          </h1>
          <p className="text-xs text-red-100 mt-1 font-medium">
            Active since <span className="font-mono font-bold text-white bg-red-800/80 px-2 py-0.5 rounded">{formatTime(seconds)}</span>
          </p>
        </div>

        <div className="px-5 py-4 space-y-4">
          
          {/* Live Location Card */}
          <div className="bg-slate-800/90 border border-red-500/30 rounded-2xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                <MapPin size={14} /> LIVE GPS STREAMING
              </span>
              <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-mono">
                UPDATING EVERY 5s
              </span>
            </div>
            <div className="text-sm font-bold text-slate-100">
              {activeAlert?.address || 'Near Baner Road, Ward 6 - Baner'}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              Lat: {activeAlert?.latitude?.toFixed(5) || '18.5590'}, Lon: {activeAlert?.longitude?.toFixed(5) || '73.7868'}
            </div>
          </div>

          {/* Emergency Alert Network Status */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <BellRing size={14} className="text-amber-400" /> Emergency Dispatch Status
            </div>

            {/* Police / Authority Simulation Status */}
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-900/60 text-blue-400 flex items-center justify-center font-bold text-xs">
                  🏛️
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Police Control Room (PCR 112)</div>
                  <div className="text-[10px] text-amber-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" /> Alert Dispatched (Demo Simulation)
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-400">Notified</span>
            </div>

            {/* Trusted Contacts */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                <span>SMS & Location Sent to Contacts:</span>
                <span className="text-green-400 font-bold">{contacts.length > 0 ? contacts.length : 2} notified</span>
              </div>
              {contacts.length > 0 ? (
                contacts.map((c) => (
                  <div key={c.id} className="bg-slate-900/50 p-2.5 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-green-400" />
                      <span className="text-slate-200 font-medium">{c.name} ({c.relation})</span>
                    </div>
                    <span className="text-slate-400 text-[10px]">{c.phone}</span>
                  </div>
                ))
              ) : (
                <div className="bg-slate-900/50 p-2.5 rounded-xl flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-400" />
                    <span>Emergency SMS with Live Map link sent to registered family contacts</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Nearby FixMyCity Community Help Points */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Users size={14} className="text-green-400" /> Nearby Verified Help & Safe Havens
            </div>
            <div className="space-y-2">
              <div className="bg-slate-900/70 p-2.5 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-200">Patil Nagar Police Beat Chowki</div>
                  <div className="text-[10px] text-slate-400">320m away • Active patrol unit</div>
                </div>
                <a href="tel:112" className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-[11px] font-bold">
                  Call
                </a>
              </div>
              <div className="bg-slate-900/70 p-2.5 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-200">24/7 Apollo Pharmacy (Safe Haven)</div>
                  <div className="text-[10px] text-slate-400">180m away • Well-lit public point</div>
                </div>
                <span className="text-green-400 text-[10px] font-semibold">Open Now</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-5 pt-4 space-y-3">
        {/* I'M SAFE Button */}
        <button
          onClick={handleMarkSafe}
          disabled={isResolving}
          className="w-full py-4 rounded-2xl font-black text-lg text-white flex items-center justify-center gap-2 transition active:scale-98 shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            boxShadow: '0 4px 20px rgba(22, 163, 74, 0.4)'
          }}
        >
          <ShieldCheck size={24} />
          <span>I AM SAFE NOW (END SOS)</span>
        </button>

        {/* Cancel Accidental Trigger */}
        <button
          onClick={() => setShowCancelModal(true)}
          disabled={isResolving}
          className="w-full py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition"
        >
          Accidental trigger? Cancel SOS
        </button>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl">
            <AlertCircle size={44} className="text-amber-400 mx-auto mb-3" />
            <h3 className="font-bold text-base text-white mb-1">Cancel SOS Alert?</h3>
            <p className="text-xs text-slate-300 mb-5">
              This will stop sharing your live location and inform your contacts that the alert was cancelled.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-700 text-xs font-bold text-slate-200 hover:bg-slate-600"
              >
                Keep Active
              </button>
              <button
                onClick={handleCancelSOS}
                className="flex-1 py-3 rounded-xl bg-red-600 text-xs font-bold text-white hover:bg-red-700"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
