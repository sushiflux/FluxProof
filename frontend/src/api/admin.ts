import api from './client'
import type { AdminUser, Role, ActivityLog, PagedResult, AppSetting } from '../types'

export const adminApi = {
  // Users
  getUsers: () => api.get<AdminUser[]>('/admin/users').then((r) => r.data),
  getUser: (id: string) => api.get<AdminUser>(`/admin/users/${id}`).then((r) => r.data),
  createUser: (data: { username: string; password: string; email: string; roleIds: string[] }) =>
    api.post<AdminUser>('/admin/users', data).then((r) => r.data),
  updateUser: (id: string, data: { email: string; isActive: boolean; roleIds: string[] }) =>
    api.put<AdminUser>(`/admin/users/${id}`, data).then((r) => r.data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  resetPassword: (id: string, newPassword: string) =>
    api.post(`/admin/users/${id}/reset-password`, { newPassword }),

  // Roles
  getRoles: () => api.get<Role[]>('/admin/roles').then((r) => r.data),
  createRole: (data: { name: string; description?: string }) =>
    api.post<Role>('/admin/roles', data).then((r) => r.data),
  deleteRole: (id: string) => api.delete(`/admin/roles/${id}`),

  // Activity log
  getActivityLog: (params: {
    page?: number
    pageSize?: number
    username?: string
    action?: number
    from?: string
    to?: string
  }) => api.get<PagedResult<ActivityLog>>('/admin/activity-log', { params }).then((r) => r.data),

  // Settings
  getSettings: (category?: string) =>
    api.get<AppSetting[]>('/admin/settings', { params: { category } }).then((r) => r.data),
  updateSetting: (key: string, value?: string) =>
    api.put(`/admin/settings/${key}`, { value }),
}
