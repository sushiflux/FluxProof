import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../api/admin'
import { formatDate } from '../../lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const ACTION_COLORS: Record<string, string> = {
  UserLogin:                'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
  UserLogout:               'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  UserLoginFailed:          'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
  UserCreated:              'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
  UserUpdated:              'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  UserDeleted:              'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
  RoleCreated:              'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400',
  RoleUpdated:              'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  RoleDeleted:              'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
  ProjectCreated:           'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400',
  ProjectUpdated:           'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  RevisionCreated:          'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400',
  RevisionReplaced:         'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
  RevisionItemMarkedDeleted:'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400',
  PermissionChanged:        'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400',
  SettingsChanged:          'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400',
}

export function ActivityLogPage() {
  const [page, setPage] = useState(1)
  const [usernameFilter, setUsernameFilter] = useState('')
  const PAGE_SIZE = 50

  const { data, isLoading } = useQuery({
    queryKey: ['activity-log', page, usernameFilter],
    queryFn: () => adminApi.getActivityLog({ page, pageSize: PAGE_SIZE, username: usernameFilter || undefined }),
  })

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Aktivitätsprotokoll</h1>
        <input value={usernameFilter} onChange={(e) => { setUsernameFilter(e.target.value); setPage(1) }}
          placeholder="Benutzer filtern…"
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {['Zeitpunkt', 'Benutzer', 'Aktion', 'Typ', 'Details', 'IP'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data?.items.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400 dark:text-gray-500">Keine Einträge gefunden</td></tr>
                ) : data?.items.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300">{log.username ?? '–'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${ACTION_COLORS[log.actionName] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                        {log.actionName}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">{log.entityType ?? '–'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400 max-w-xs truncate">{log.details ?? '–'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-400 dark:text-gray-500">{log.ipAddress ?? '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.total > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {data.total} Einträge · Seite {page} von {totalPages}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}
                  className="p-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}
                  className="p-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
