import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Camera, Upload, Mic, MapPin, ArrowLeft, Send, X,
  AlertCircle, Sparkles, Disc, Trash2, Droplets, LightbulbOff,
  Construction, CheckCircle2, ShieldCheck, FileText, Info
} from 'lucide-react'
import api from '../../services/api'
import { SubmitComplaintResponse } from '../../types'

interface CategoryItem {
  id: string
  label: string
  icon: React.ReactNode
  color: string
}

const CATEGORIES: CategoryItem[] = [
  { id: 'auto', label: 'AI Auto-Detect', icon: <Sparkles size={18} className="text-[#FF9933]" />, color: '#FF9933' },
  { id: 'pothole', label: 'Road Pothole', icon: <Disc size={18} className="text-amber-600" />, color: '#d97706' },
  { id: 'garbage', label: 'Garbage & Waste', icon: <Trash2 size={18} className="text-emerald-600" />, color: '#059669' },
  { id: 'water_leakage', label: 'Water Leakage', icon: <Droplets size={18} className="text-blue-600" />, color: '#2563eb' },
  { id: 'broken_streetlight', label: 'Streetlight Issue', icon: <LightbulbOff size={18} className="text-amber-500" />, color: '#f59e0b' },
  { id: 'damaged_road', label: 'Damaged Road', icon: <Construction size={18} className="text-orange-600" />, color: '#ea580c' },
]

export default function ReportProblem() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [category, setCategory] = useState('auto')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState<{ lat: number; lon: number; address: string } | null>(null)
  const [locLoading, setLocLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isListening, setIsListening] = useState(false)

  // Get GPS location
  const captureLocation = () => {
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          address: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        })
        setLocLoading(false)
      },
      () => {
        // Fallback: use Pune center for demo
        setLocation({ lat: 18.5204, lon: 73.8567, address: 'Pune Municipal Corporation Jurisdiction' })
        setLocLoading(false)
      }
    )
  }

  useEffect(() => { captureLocation() }, [])

  const handleFile = (file: File) => {
    setImage(file)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  // Voice input using Web Speech API
  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { alert('Voice input not supported in this browser'); return }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onresult = (e: any) => {
      setDescription((prev) => prev ? prev + ' ' + e.results[0][0].transcript : e.results[0][0].transcript)
    }
    recognition.start()
  }

  const handleSubmit = async () => {
    if (!description && !image) {
      setError('Please provide photographic evidence or a description of the issue.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('category', category)
      if (description) formData.append('description', description)
      if (location) {
        formData.append('latitude', location.lat.toString())
        formData.append('longitude', location.lon.toString())
        formData.append('address', location.address)
      }
      if (image) formData.append('image', image)

      const res = await api.post<SubmitComplaintResponse>('/complaints/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      navigate('/citizen/ai-analysis', { state: { result: res.data } })
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Submission failed. Please check network and retry.')
      setLoading(false)
    }
  }

  return (
    <div className="citizen-app bg-slate-50 min-h-screen">
      {/* ── Official Tricolor Top Header ── */}
      <div className="tricolor-bar w-full" />

      {/* ── Government Authority Header ── */}
      <div
        className="text-white px-5 pt-7 pb-6 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition border border-white/10"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="font-bold text-base flex items-center gap-1.5">
              <span>Lodge Civic Grievance</span>
            </div>
            <div className="text-[11px] text-slate-400">Pune Municipal Corporation • FixMyCity Portal</div>
          </div>
        </div>
        <img src="/logo.png" alt="FixMyCity" style={{ width: 34, height: 34, objectFit: 'contain' }} />
      </div>

      {/* ── Official Guidelines Note ── */}
      <div className="bg-blue-50/80 border-b border-blue-100 px-5 py-2.5 flex items-center gap-2 text-[11px] text-blue-900">
        <ShieldCheck size={14} className="text-blue-600 flex-shrink-0" />
        <span>Grievances are processed by AI and routed directly to Municipal Ward Officers.</span>
      </div>

      <div className="px-5 py-5 space-y-5 pb-36">

        {/* ── Section 1: Photographic Evidence ── */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Camera size={15} className="text-blue-600" />
              <span>1. Photographic Evidence</span>
            </label>
            <span className="text-[10px] text-slate-400 font-medium">Geo-tagged</span>
          </div>

          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200">
              <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
              <button
                onClick={() => { setImage(null); setImagePreview(null) }}
                className="absolute top-2.5 right-2.5 w-7 h-7 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full flex items-center justify-center transition"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl py-5 px-3 flex flex-col items-center gap-2 text-slate-700 transition active:scale-98"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Camera size={20} />
                </div>
                <span className="text-xs font-semibold">Capture Photo</span>
                <span className="text-[10px] text-slate-400">Direct camera</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl py-5 px-3 flex flex-col items-center gap-2 text-slate-700 transition active:scale-98"
              >
                <div className="w-10 h-10 rounded-full bg-slate-200/70 text-slate-600 flex items-center justify-center">
                  <Upload size={18} />
                </div>
                <span className="text-xs font-semibold">Upload Image</span>
                <span className="text-[10px] text-slate-400">Gallery file</span>
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        {/* ── Section 2: Grievance Category ── */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-3">
            2. Select Issue Category
          </label>

          <div className="grid grid-cols-2 gap-2.5">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-600 text-blue-900 shadow-sm ring-1 ring-blue-600/30'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    {cat.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate">{cat.label}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Section 3: Grievance Description ── */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileText size={15} className="text-slate-600" />
              <span>3. Description & Details</span>
            </label>
            <button
              type="button"
              onClick={toggleVoice}
              className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border transition ${
                isListening
                  ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Mic size={12} className={isListening ? 'text-red-500' : 'text-slate-500'} />
              <span>{isListening ? 'Listening...' : 'Voice Dictate'}</span>
            </button>
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Specify location landmarks, hazard severity, or additional details for the department officer..."
            rows={3}
            className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none text-slate-800 placeholder-slate-400 bg-slate-50/50"
          />
        </div>

        {/* ── Section 4: GPS Geo-Location ── */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <MapPin size={15} className="text-green-600" />
              <span>4. Incident Geo-Location</span>
            </label>
            <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
              Verified GPS
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <MapPin size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-800">
                {locLoading ? 'Locating coordinates...' : (location?.address || 'Pune Municipal Jurisdiction')}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {location ? `Coordinates: ${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}` : 'Detecting GPS position'}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

      </div>

      {/* ── Fixed Submit Button ── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-slate-200 p-4 shadow-xl z-20">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60 transition shadow-md"
          style={{
            background: 'linear-gradient(135deg, #FF9933 0%, #ea580c 50%, #138808 100%)',
          }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing AI Verification & Routing...
            </span>
          ) : (
            <>
              <Send size={16} />
              <span>SUBMIT GRIEVANCE TO MUNICIPALITY</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
