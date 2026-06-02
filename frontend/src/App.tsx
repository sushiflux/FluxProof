import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginPage } from './pages/LoginPage'
import { UserLayout } from './components/layout/UserLayout'
import { AdminLayout } from './components/layout/AdminLayout'
import { UserGuard, AdminGuard, RootRedirect } from './components/layout/Guards'
import { ProjectsPage } from './pages/user/ProjectsPage'
import { ProjectDetailPage } from './pages/user/ProjectDetailPage'
import { UsersPage } from './pages/admin/UsersPage'
import { RolesPage } from './pages/admin/RolesPage'
import { ActivityLogPage } from './pages/admin/ActivityLogPage'
import { SettingsPage } from './pages/admin/SettingsPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/app" element={
            <UserGuard><UserLayout /></UserGuard>
          }>
            <Route index element={<Navigate to="projects" replace />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
          </Route>

          <Route path="/admin" element={
            <AdminGuard><AdminLayout /></AdminGuard>
          }>
            <Route index element={<Navigate to="users" replace />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="activity" element={<ActivityLogPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
