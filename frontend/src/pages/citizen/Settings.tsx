import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, User, Mail, Phone, MapPin, Globe, Bell, Shield,
  Key, LogOut, ChevronRight, CheckCircle2, FileText, ShieldAlert,
  Edit3, HelpCircle, FileCheck, Check, Sparkles
} from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { useLanguageStore, SUPPORTED_LANGUAGES } from '../../store/language'
import { useSOSStore } from '../../store/sos'
import api from '../../services/api'
import { Complaint } from '../../types'

export default function Settings() {
  const navigate = useNavigate()
  const { user, logout, login, token } = useAuthStore()
  const { currentLanguage, setLanguage, t } = useLanguageStore()
  const { activeAlert, contacts, fetchContacts } = useSOSStore()

  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [showLangModal, setShowLangModal] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // Edit profile state
  const [editName, setEditName] = useState(user?.name || '')
  const [editWard, setEditWard] = useState(user?.ward || '')
  const [saveSuccess, setSaveSuccess] = useState('')

  // Preference toggles
  const [pushNotifs, setPushNotifs] = useState(true)
  const [smsNotifs, setSmsNotifs] = useState(true)
  const [highAccuracyGPS, setHighAccuracyGPS] = useState(true)

  useEffect(() => {
    fetchContacts()
    api.get<Complaint[]>('/complaints/my')
      .then(res => setComplaints(res.data))
      .catch(() => {})
  }, [])

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0]

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !token) return
    const updatedUser = { ...user, name: editName, ward: editWard }
    login(token, updatedUser)
    setSaveSuccess('Profile updated successfully!')
    setTimeout(() => {
      setSaveSuccess('')
      setShowEditProfile(false)
    }, 1200)
  }

  const resolvedCount = complaints.filter(c => !c.is_duplicate).length

  return (
    <div className="citizen-app min-h-screen bg-slate-50 flex flex-col pb-12">
      {/* Tricolor top stripe */}
      <div className="tricolor-bar w-full" />

      {/* Header */}
      <div
        className="text-white px-5 pt-8 pb-6 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/citizen/home')}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-black text-lg">{t('settings')}</h1>
            <div className="text-xs text-slate-400">Account, Preferences & Activity Hub</div>
          </div>
        </div>
        <img src="/logo.png" alt="FixMyCity" style={{ width: 32, height: 32, objectFit: 'contain' }} />
      </div>

      <div className="px-5 py-5 space-y-5 flex-1">

        {/* ── 1. USER PROFILE CARD ────────────────────────────── */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF9933] to-[#138808] flex items-center justify-center text-white font-black text-xl shadow-md">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-white">
                  <Check size={10} />
                </div>
              </div>
              <div>
                <div className="font-bold text-base text-slate-900 leading-snug">{user?.name || 'Rahul Sharma'}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                    Verified Citizen
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setEditName(user?.name || '')
                setEditWard(user?.ward || '')
                setShowEditProfile(true)
              }}
              className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
            >
              <Edit3 size={15} />
            </button>
          </div>

          {/* Contact & Ward Info */}
          <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 border border-slate-100 text-xs">
            <div className="flex items-center gap-2.5 text-slate-600">
              <Mail size={14} className="text-slate-400 flex-shrink-0" />
              <span className="truncate">{user?.email || 'rahul@gmail.com'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <Phone size={14} className="text-slate-400 flex-shrink-0" />
              <span>{user?.phone || '+91 98765 43210'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <MapPin size={14} className="text-[#FF9933] flex-shrink-0" />
              <span className="font-medium text-slate-800">{user?.ward || 'Ward 6 - Baner, Pune'}</span>
            </div>
          </div>
        </div>

        {/* ── 2. MY ACTIVITY ─────────────────────────────────── */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 px-1">
            {t('activity')}
          </div>
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-1 divide-y divide-slate-100">
            {/* My Complaints */}
            <button
              onClick={() => navigate('/citizen/my-reports')}
              className="w-full py-3 flex items-center justify-between text-left hover:bg-slate-50 px-2 rounded-xl transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">{t('my_reports')}</div>
                  <div className="text-[11px] text-slate-500">{complaints.length} reports submitted</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                  {complaints.length}
                </span>
                <ChevronRight size={16} />
              </div>
            </button>

            {/* SOS History */}
            <button
              onClick={() => navigate('/citizen/sos')}
              className="w-full py-3 flex items-center justify-between text-left hover:bg-slate-50 px-2 rounded-xl transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">{t('sos_history')}</div>
                  <div className="text-[11px] text-slate-500">
                    {contacts.length} emergency contacts active
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="text-xs font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">
                  Protected
                </span>
                <ChevronRight size={16} />
              </div>
            </button>
          </div>
        </div>

        {/* ── 3. PREFERENCES ─────────────────────────────────── */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 px-1">
            {t('preferences')}
          </div>
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-3">
            {/* Language Selection */}
            <button
              onClick={() => setShowLangModal(true)}
              className="w-full p-2 flex items-center justify-between text-left hover:bg-slate-50 rounded-xl transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#FF9933] flex items-center justify-center">
                  <Globe size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">{t('language')} / Language</div>
                  <div className="text-[11px] text-slate-500">
                    {currentLangObj.nativeName} ({currentLangObj.name})
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="text-xs font-bold bg-[#FF9933]/10 text-[#FF9933] px-2 py-0.5 rounded-full">
                  {currentLangObj.nativeName}
                </span>
                <ChevronRight size={16} />
              </div>
            </button>

            {/* Notification Toggle */}
            <div className="p-2 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Bell size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">{t('notifications')}</div>
                  <div className="text-[11px] text-slate-500">Issue status & municipal alerts</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushNotifs}
                  onChange={(e) => setPushNotifs(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#138808]"></div>
              </label>
            </div>

            {/* GPS Permissions */}
            <div className="p-2 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                  <MapPin size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">High-Accuracy GPS</div>
                  <div className="text-[11px] text-slate-500">Auto-tagging complaint coordinates</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={highAccuracyGPS}
                  onChange={(e) => setHighAccuracyGPS(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#138808]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* ── 4. ACCOUNT ACTIONS ─────────────────────────────── */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 px-1">
            {t('account')}
          </div>
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-1 divide-y divide-slate-100">
            {/* Change Password */}
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full py-3 flex items-center justify-between text-left hover:bg-slate-50 px-2 rounded-xl transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Key size={18} />
                </div>
                <div className="text-xs font-bold text-slate-800">{t('change_password')}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="w-full py-3 flex items-center justify-between text-left hover:bg-red-50 px-2 rounded-xl transition text-red-600"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <LogOut size={18} />
                </div>
                <div className="text-xs font-bold">{t('logout')}</div>
              </div>
              <ChevronRight size={16} className="text-red-400" />
            </button>
          </div>
        </div>

        {/* Footer Brand info */}
        <div className="text-center pt-2 pb-4 text-xs text-slate-400 space-y-1">
          <div className="font-semibold text-slate-500">FixMyCity v1.0 • Smart India Hackathon 2026</div>
          <div>Mera Shehar • Meri Awaaz • Hamara Badlav</div>
        </div>
      </div>

      {/* ── LANGUAGE MODAL ───────────────────────────────────── */}
      {showLangModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-[#FF9933]" />
                <h3 className="font-black text-base text-slate-800">{t('select_language')}</h3>
              </div>
              <button
                onClick={() => setShowLangModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-2 flex-1">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = lang.code === currentLanguage
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code)
                      setShowLangModal(false)
                    }}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition ${
                      isSelected
                        ? 'bg-[#FF9933]/10 border-2 border-[#FF9933] text-[#FF9933]'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-transparent'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">{lang.nativeName}</div>
                      <div className="text-xs opacity-75">{lang.name}</div>
                    </div>
                    {isSelected && <Check size={18} className="text-[#FF9933]" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT PROFILE MODAL ───────────────────────────────── */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="font-bold text-base text-slate-800 mb-4 flex items-center gap-2">
              <Edit3 size={18} className="text-blue-600" />
              <span>{t('edit_profile')}</span>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">{t('full_name')}</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-tricolor w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">{t('ward_area')}</label>
                <input
                  type="text"
                  required
                  value={editWard}
                  onChange={(e) => setEditWard(e.target.value)}
                  placeholder="e.g. Ward 6 - Baner"
                  className="input-tricolor w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              {saveSuccess && (
                <div className="bg-green-50 text-green-700 text-xs p-2.5 rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> {saveSuccess}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-saffron flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CHANGE PASSWORD MODAL ────────────────────────────── */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="font-bold text-base text-slate-800 mb-3 flex items-center gap-2">
              <Key size={18} className="text-indigo-600" />
              <span>{t('change_password')}</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input-tricolor w-full border border-slate-200 rounded-xl px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input-tricolor w-full border border-slate-200 rounded-xl px-4 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Password updated successfully (Demo simulation)')
                    setShowPasswordModal(false)
                  }}
                  className="btn-saffron flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
