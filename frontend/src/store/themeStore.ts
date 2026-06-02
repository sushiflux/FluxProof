import { create } from 'zustand'
import { prefsApi } from '../api/preferences'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme, persist?: boolean) => void
  toggle: () => void
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem('theme', theme)
}

// Start with localStorage / system preference — gets overridden from DB after login
const localTheme =
  (localStorage.getItem('theme') as Theme | null) ??
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

applyTheme(localTheme)

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: localTheme,

  setTheme: (theme, persist = true) => {
    applyTheme(theme)
    set({ theme })
    if (persist) prefsApi.save('theme', theme)
  },

  toggle: () => {
    const next: Theme = get().theme === 'light' ? 'dark' : 'light'
    get().setTheme(next)
  },
}))
