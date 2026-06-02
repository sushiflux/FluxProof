import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/admin'
import { formatDate } from '../../lib/utils'
import { Plus, Pencil, Trash2, KeyRound, UserCheck, UserX } from 'lucide-react'
import type { AdminUser, Role } from '../../types'

const INPUT = 'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
const MODAL = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50'
const CARD = 'bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6'
const BTN_CANCEL = 'px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
const BTN_PRIMARY = 'px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors'

function UserForm({ user, roles, onClose }: { user?: AdminUser; roles: Role[]; onClose: () => void }) {
  const [username, setUsername] = useState(user?.username ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [isActive, setIsActive] = useState(user?.isActive ?? true)
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user?.roles.map((r) => r.id) ?? [])
  const queryClient = useQueryClient()

  const save = useMutation({
    mutationFn: () => user
      ? adminApi.updateUser(user.id, { email, isActive, roleIds: selectedRoles })
      : adminApi.createUser({ username, password, email, roleIds: selectedRoles }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); onClose() },
  })

  const toggleRole = (id: string) =>
    setSelectedRoles((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id])

  return (
    <div className={MODAL}>
      <div className={CARD}>
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          {user ? 'Benutzer bearbeiten' : 'Neuer Benutzer'}
        </h2>
        <div className="space-y-4">
          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Benutzername *</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} className={INPUT} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-Mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT} />
          </div>
          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Passwort *</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={INPUT} />
            </div>
          )}
          {user && (
            <div className="flex items-center gap-3">
              <input type="checkbox" id="active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4" />
              <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">Benutzer aktiv</label>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rollen</label>
            <div className="space-y-2">
              {roles.filter((r) => !r.isDevOnly).map((role) => (
                <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selectedRoles.includes(role.id)} onChange={() => toggleRole(role.id)} className="w-4 h-4" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{role.name}</span>
                  {role.description && <span className="text-xs text-gray-400 dark:text-gray-500">— {role.description}</span>}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className={BTN_CANCEL}>Abbrechen</button>
          <button onClick={() => save.mutate()} disabled={!user ? (!username || !password) : false} className={BTN_PRIMARY}>
            {save.isPending ? 'Speichere…' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ResetPasswordModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [pw, setPw] = useState('')
  const reset = useMutation({ mutationFn: () => adminApi.resetPassword(userId, pw), onSuccess: onClose })

  return (
    <div className={MODAL}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Passwort zurücksetzen</h2>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Neues Passwort" className={`${INPUT} mb-4`} />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className={BTN_CANCEL}>Abbrechen</button>
          <button onClick={() => reset.mutate()} disabled={!pw || reset.isPending}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
            {reset.isPending ? '…' : 'Zurücksetzen'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function UsersPage() {
  const [editing, setEditing] = useState<AdminUser | null | 'new'>(null)
  const [resetting, setResetting] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: users } = useQuery({ queryKey: ['admin-users'], queryFn: adminApi.getUsers })
  const { data: roles } = useQuery({ queryKey: ['admin-roles'], queryFn: adminApi.getRoles })

  const del = useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Benutzer</h1>
        <button onClick={() => setEditing('new')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> Neuer Benutzer
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {['Benutzer', 'E-Mail', 'Rollen', 'Status', 'Erstellt', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {users?.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400 font-semibold text-sm">
                      {u.username[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{u.username}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{u.email}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map((r) => (
                      <span key={r.id} className={`text-xs px-2 py-0.5 rounded font-medium ${r.isDevOnly ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                        {r.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1 text-xs font-medium ${u.isActive ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {u.isActive ? <UserCheck size={14} /> : <UserX size={14} />}
                    {u.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => setResetting(u.id)} title="Passwort zurücksetzen"
                      className="text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"><KeyRound size={15} /></button>
                    <button onClick={() => setEditing(u)} title="Bearbeiten"
                      className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><Pencil size={15} /></button>
                    <button onClick={() => { if (confirm(`Benutzer "${u.username}" löschen?`)) del.mutate(u.id) }}
                      className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing !== null && roles && (
        <UserForm user={editing === 'new' ? undefined : editing} roles={roles} onClose={() => setEditing(null)} />
      )}
      {resetting && <ResetPasswordModal userId={resetting} onClose={() => setResetting(null)} />}
    </div>
  )
}
