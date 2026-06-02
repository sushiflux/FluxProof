import api from './client'
import type { LoginResponse, UserInfo } from '../types'

export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { username, password }).then((r) => r.data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get<UserInfo>('/auth/me').then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
}
