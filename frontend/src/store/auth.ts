import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'
import { TokenResponse, User } from '../types'

interface AuthState {
  token: string | null
  user: User | null
  isLoggedIn: boolean
  login: (token: string, user: User) => void
  logout: () => void
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoggedIn: false,

      login: (token: string, user: User) => {
        localStorage.setItem('fmc_token', token)
        set({ token, user, isLoggedIn: true })
      },

      logout: () => {
        localStorage.removeItem('fmc_token')
        localStorage.removeItem('fmc_user')
        set({ token: null, user: null, isLoggedIn: false })
        window.location.href = '/'
      },

      fetchMe: async () => {
        try {
          const res = await api.get<User>('/auth/me')
          set({ user: res.data, isLoggedIn: true })
        } catch {
          get().logout()
        }
      },
    }),
    {
      name: 'fmc_auth',
      partialize: (state) => ({ token: state.token, user: state.user, isLoggedIn: state.isLoggedIn }),
    }
  )
)
