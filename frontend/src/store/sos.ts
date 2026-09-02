import { create } from 'zustand'
import api from '../services/api'

export interface SOSAlertData {
  id: string
  user_id: string
  user_name?: string
  latitude?: number
  longitude?: number
  address?: string
  ward?: string
  status: 'active' | 'cancelled' | 'safe'
  note?: string
  created_at: string
  resolved_at?: string
}

export interface EmergencyContact {
  id: string
  name: string
  phone: string
  relation?: string
}

export interface SafetyZone {
  ward: string
  latitude: number
  longitude: number
  risk_score: number
  risk_label: 'critical' | 'high' | 'medium' | 'low'
  reasons: string[]
  complaint_count: number
  unresolved_count: number
}

interface SOSState {
  activeAlert: SOSAlertData | null
  contacts: EmergencyContact[]
  safetyZones: SafetyZone[]
  isLoading: boolean

  fetchActiveAlert: () => Promise<void>
  fetchContacts: () => Promise<void>
  fetchSafetyZones: () => Promise<void>
  triggerSOS: (lat?: number, lon?: number, address?: string, ward?: string) => Promise<SOSAlertData>
  cancelSOS: () => Promise<void>
  markSafe: () => Promise<void>
  addContact: (name: string, phone: string, relation: string) => Promise<void>
  removeContact: (id: string) => Promise<void>
}

export const useSOSStore = create<SOSState>((set, get) => ({
  activeAlert: null,
  contacts: [],
  safetyZones: [],
  isLoading: false,

  fetchActiveAlert: async () => {
    try {
      const res = await api.get<SOSAlertData | null>('/sos/active-alert')
      set({ activeAlert: res.data })
    } catch { /* not authenticated yet */ }
  },

  fetchContacts: async () => {
    try {
      const res = await api.get('/sos/contacts')
      const data = res.data
      set({ contacts: Array.isArray(data) ? data : [] })
    } catch { set({ contacts: [] }) }
  },

  fetchSafetyZones: async () => {
    try {
      const res = await api.get('/sos/safety-zones')
      const data = res.data
      set({ safetyZones: Array.isArray(data) ? data : [] })
    } catch { set({ safetyZones: [] }) }
  },

  triggerSOS: async (lat, lon, address, ward) => {
    set({ isLoading: true })
    const res = await api.post<SOSAlertData>('/sos/trigger', {
      latitude: lat,
      longitude: lon,
      address,
      ward,
    })
    set({ activeAlert: res.data, isLoading: false })
    return res.data
  },

  cancelSOS: async () => {
    await api.post('/sos/cancel')
    set({ activeAlert: null })
  },

  markSafe: async () => {
    await api.post('/sos/safe')
    set({ activeAlert: null })
  },

  addContact: async (name, phone, relation) => {
    const res = await api.post<EmergencyContact>('/sos/contacts', { name, phone, relation })
    set(s => ({ contacts: [...s.contacts, res.data] }))
  },

  removeContact: async (id) => {
    await api.delete(`/sos/contacts/${id}`)
    set(s => ({ contacts: s.contacts.filter(c => c.id !== id) }))
  },
}))
