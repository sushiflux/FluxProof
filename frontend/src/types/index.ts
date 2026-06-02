export type BadgeType = 'Update' | 'Change' | 'New' | 'Fix' | 'Security' | 'Deprecated' | 'Note'
export type PermissionType = 'View' | 'Editor'
export type ProjectCategory = 'Software' | 'Hardware'
export type ActivityAction =
  | 'UserLogin' | 'UserLogout' | 'UserLoginFailed'
  | 'UserCreated' | 'UserUpdated' | 'UserDeleted'
  | 'RoleCreated' | 'RoleUpdated' | 'RoleDeleted'
  | 'ProjectCreated' | 'ProjectUpdated'
  | 'RevisionCreated' | 'RevisionReplaced'
  | 'RevisionItemMarkedDeleted' | 'PermissionChanged' | 'SettingsChanged'

export interface LoginResponse {
  token: string
  username: string
  userId: string
  roles: string[]
}

export interface UserInfo {
  id: string
  username: string
  email: string
  isActive: boolean
  roles: string[]
  createdAt: string
  preferences: Record<string, string | null>
}

export interface Project {
  id: string
  name: string
  description?: string
  category: number
  categoryName: string
  createdAt: string
  createdBy: string
  latestRevision?: { version: string; createdAt: string }
  userPermission?: number
}

export interface RevisionItem {
  id: string
  badgeType: number
  badgeName: BadgeType
  text: string
  isDeleted: boolean
  deletedAt?: string
  sortOrder: number
}

export interface Revision {
  id: string
  projectId: string
  version: string
  versionDev: string
  isReplaced: boolean
  replacedByRevisionId?: string
  createdAt: string
  createdBy: string
  notes?: string
  items: RevisionItem[]
}

export interface AdminUser {
  id: string
  username: string
  email: string
  isActive: boolean
  createdAt: string
  roles: Role[]
}

export interface Role {
  id: string
  name: string
  description?: string
  isDevOnly: boolean
  userCount: number
}

export interface ActivityLog {
  id: string
  username?: string
  action: number
  actionName: string
  entityType?: string
  entityId?: string
  details?: string
  timestamp: string
  ipAddress?: string
}

export interface PagedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface AppSetting {
  key: string
  value?: string
  category: string
}

export interface ProjectPermission {
  userId: string
  username: string
  permission: number
  grantedAt: string
}
