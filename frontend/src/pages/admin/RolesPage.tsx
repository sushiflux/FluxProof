import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/admin'
import { Plus, Trash2, Shield } from 'lucide-react'

export function RolesPage() {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  const { data: roles } = useQuery({ queryKey: ['admin-roles'], queryFn: adminApi.getRoles })

  const create = useMutation({
    mutationFn: () => adminApi.createRole({ name, description: desc || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-roles'] }); setName(''); setDesc(''); setShowForm(false) },
  })

  const del = useMutation({
    mutationFn: adminApi.deleteRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-roles'] }),
  })

  const INPUT = 'border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Rollen</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> Neue Rolle
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Neue Rolle erstellen</h2>
          <div className="flex gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rollenname *" className={`flex-1 ${INPUT}`} />
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Beschreibung (optional)" className={`flex-1 ${INPUT}`} />
            <button onClick={() => create.mutate()} disabled={!name || create.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">Speichern</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles?.map((role) => (
          <div key={role.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${role.isDevOnly ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
                  <Shield size={18} className={role.isDevOnly ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'} />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{role.name}</div>
                  {role.isDevOnly && (
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">DEV only</span>
                  )}
                </div>
              </div>
              {!role.isDevOnly && (
                <button onClick={() => { if (confirm(`Rolle "${role.name}" löschen?`)) del.mutate(role.id) }}
                  className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            {role.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">{role.description}</p>}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-400 dark:text-gray-500">{role.userCount} Benutzer</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
