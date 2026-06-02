import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function UserGuard({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore()
  if (!token || !user) return <Navigate to="/login" replace />

  const canAccess = user.roles.includes('User') || user.roles.includes('Developer')
  if (!canAccess) return <Navigate to="/admin/users" replace />

  return <>{children}</>
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore()
  if (!token || !user) return <Navigate to="/login" replace />

  const canAccess = user.roles.includes('Admin') || user.roles.includes('Developer')
  if (!canAccess) return <Navigate to="/app/projects" replace />

  return <>{children}</>
}

export function RootRedirect() {
  const { token, user } = useAuthStore()
  if (!token || !user) return <Navigate to="/login" replace />

  if (user.roles.includes('Admin')) return <Navigate to="/admin/users" replace />
  return <Navigate to="/app/projects" replace />
}
