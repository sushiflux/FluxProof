import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import { AlertCircle, Lock, User } from 'lucide-react'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const loginData = await authApi.login(username, password)
      localStorage.setItem('token', loginData.token)
      const userInfo = await authApi.me()
      setAuth(loginData.token, userInfo)
      if (userInfo.roles.includes('Admin')) navigate('/admin/users')
      else navigate('/app/projects')
    } catch {
      localStorage.removeItem('token')
      setError('Ungültiger Benutzername oder Passwort.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left – Login form (1/3) */}
      <div className="w-full md:w-1/3 flex flex-col justify-center px-8 bg-white dark:bg-gray-900">
        <div className="max-w-sm w-full mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">FP</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">FluxProof</h1>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Willkommen zurück</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Melden Sie sich an, um fortzufahren.</p>

          {error && (
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Benutzername</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Benutzername" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Passwort</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Passwort" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors">
              {loading ? 'Anmelden…' : 'Anmelden'}
            </button>
          </form>

          <p className="text-xs text-gray-400 dark:text-gray-600 mt-8 text-center">
            © {new Date().getFullYear()} FluxProof
          </p>
        </div>
      </div>

      {/* Right – Branding (2/3) */}
      <div className="hidden md:flex md:w-2/3 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-300 rounded-full blur-3xl" />
        </div>
        <div className="relative text-center text-white">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-white/30">
            <span className="text-5xl font-black text-white">FP</span>
          </div>
          <h2 className="text-5xl font-black mb-4 tracking-tight">FluxProof</h2>
          <p className="text-xl text-blue-100 mb-8 font-light">Revisionsichere Dokumentation</p>
          <div className="grid grid-cols-3 gap-6 mt-12 max-w-sm mx-auto">
            {[{ label: 'Revisionssicher', icon: '🔒' }, { label: 'Software & Hardware', icon: '⚡' }, { label: 'Nachvollziehbar', icon: '📋' }].map(({ label, icon }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center text-2xl backdrop-blur-sm border border-white/20">{icon}</div>
                <span className="text-xs text-blue-100 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
