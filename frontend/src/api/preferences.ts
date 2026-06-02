import api from './client'

export const prefsApi = {
  save: (key: string, value: string | null) =>
    api.put(`/user/preferences/${key}`, { value }).catch(() => { /* fire-and-forget */ }),

  saveMany: (prefs: Record<string, string | null>) =>
    api.put('/user/preferences', prefs).catch(() => { /* fire-and-forget */ }),
}
