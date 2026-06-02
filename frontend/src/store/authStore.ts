import { create } from 'zustand'
import type { UserInfo } from '../types'
import { useThemeStore } from './themeStore'
import { prefsApi } from '../api/preferences'

interface AuthState {
  token: string | null
  user: UserInfo | null
  panelMode: 'user' | 'admin'
  setAuth: (token: string, user: UserInfo) => void
  setUser: (user: UserInfo) => void
  logout: () => void
  setPanelMode: (mode: 'user' | 'admin') => void
}

function applyPreferences(user: UserInfo) {
  const prefs = user.preferences ?? {}

  // Theme
  if (prefs['theme'] === 'light' || prefs['theme'] === 'dark') {
    useThemeStore.getState().setTheme(prefs['theme'], false) // false = don't re-save
  }
}

const savedToken = localStorage.getItem('token')
const savedUser = localStorage.getItem('user')
const parsedUser: UserInfo | null = savedUser ? JSON.parse(savedUser) : null

// Apply preferences from locally cached user on page reload
if (parsedUser) applyPreferences(parsedUser)

export const useAuthStore = create<AuthState>((set) => ({
  token: savedToken,
  user: parsedUser,
  panelMode: 'user',

  setAuth: (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    applyPreferences(user)
    set({ token, user })
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user))
    applyPreferences(user)
    set({ user })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null })
  },

  setPanelMode: (panelMode) => {
    prefsApi.save('panelMode', panelMode)
    set({ panelMode })
  },
}))
