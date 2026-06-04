import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/auth'
import { FolderOpen, LogOut, User, Heart } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '../../lib/utils'

const IS_DEV = import.meta.env.DEV

const appVersion = IS_DEV
  ? `${__APP_VERSION__}.${__BUILD_TIMESTAMP__}`
  : __APP_VERSION__

const NAV_ITEMS = [
  { to: '/app/projects', label: 'Projekte', icon: FolderOpen },
]

export function UserLayout() {
  const { user, logout, setPanelMode } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const isDeveloper = user?.roles.includes('Developer')

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    logout()
    navigate('/login')
  }

  const switchToAdmin = () => {
    setPanelMode('admin')
    navigate('/admin/users')
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 text-white flex flex-col shrink-0">

        {/* Logo */}
        <div className="px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="font-bold text-sm">FP</span>
            </div>
            <div>
              <div className="font-semibold text-sm">FluxProof</div>
              <div className="text-xs text-slate-400">User</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                location.pathname.startsWith(to)
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="px-3 py-3 space-y-1">
          {IS_DEV && isDeveloper && (
            <button onClick={switchToAdmin}
              className="w-full text-left text-xs bg-amber-600 text-white px-3 py-2 rounded-lg hover:bg-amber-500 transition-colors mb-2">
              → Admin-Panel
            </button>
          )}
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <User size={14} className="text-slate-400" />
              {user?.username}
            </div>
            <div className="flex items-center gap-1.5">
              <ThemeToggle variant="sidebar" />
              <button onClick={handleLogout} title="Abmelden"
                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Info-Bereich */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
        <div className="bg-slate-800/60 px-3 py-2.5 flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1 text-slate-300 text-[11px]">
            made with <Heart size={9} className="fill-red-500 text-red-500" /> in Berlin
          </div>
          <div className="text-slate-400 text-[10px] font-mono">v{appVersion}</div>
        </div>

      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
        <div className="flex-1 min-h-0 p-6 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
