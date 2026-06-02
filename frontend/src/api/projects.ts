import api from './client'
import type { Project, Revision, ProjectPermission } from '../types'

export const projectsApi = {
  list: () => api.get<Project[]>('/projects').then((r) => r.data),

  get: (id: string) => api.get<Project>(`/projects/${id}`).then((r) => r.data),

  create: (data: { name: string; description?: string; category: number }) =>
    api.post<Project>('/projects', data).then((r) => r.data),

  getRevisions: (id: string) => api.get<Revision[]>(`/projects/${id}/revisions`).then((r) => r.data),

  createRevision: (id: string, data: { items: { badgeType: number; text: string }[]; notes?: string }) =>
    api.post<Revision>(`/projects/${id}/revisions`, data).then((r) => r.data),

  replaceRevision: (id: string, revId: string, data: { items: { badgeType: number; text: string }[]; notes?: string }) =>
    api.post<Revision>(`/projects/${id}/revisions/${revId}/replace`, data).then((r) => r.data),

  markItemDeleted: (id: string, revId: string, itemId: string) =>
    api.patch(`/projects/${id}/revisions/${revId}/items/${itemId}/mark-deleted`),

  getPermissions: (id: string) =>
    api.get<ProjectPermission[]>(`/projects/${id}/permissions`).then((r) => r.data),

  setPermission: (id: string, data: { userId: string; permission: number }) =>
    api.post(`/projects/${id}/permissions`, data),

  removePermission: (id: string, userId: string) =>
    api.delete(`/projects/${id}/permissions/${userId}`),

  // DEV-only
  deleteProject: (id: string) => api.delete(`/projects/${id}`),
  deleteRevision: (id: string, revId: string) => api.delete(`/projects/${id}/revisions/${revId}`),
}
