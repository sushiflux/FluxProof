import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { projectsApi } from '../../api/projects'
import { useAuthStore } from '../../store/authStore'
import { formatDate } from '../../lib/utils'
import { FolderOpen, Plus, Cpu, Code2, Clock, Trash2 } from 'lucide-react'
import type { Project } from '../../types'

const IS_DEV = import.meta.env.DEV

const INPUT = 'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

function NewProjectModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(1)
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: () => projectsApi.create({ name, description: description || undefined, category }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); onClose() },
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Neues Projekt</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={INPUT} placeholder="Projektname" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Beschreibung</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className={`${INPUT} resize-none`} placeholder="Optionale Beschreibung" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategorie</label>
            <select value={category} onChange={(e) => setCategory(+e.target.value)} className={INPUT}>
              <option value={1}>Software</option>
              <option value={2}>Hardware</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Abbrechen</button>
          <button onClick={() => create.mutate()} disabled={!name || create.isPending}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {create.isPending ? 'Erstelle…' : 'Erstellen'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProjectCard({ project, canDelete, onDelete }: {
  project: Project
  canDelete: boolean
  onDelete: (id: string) => void
}) {
  const CategoryIcon = project.category === 1 ? Code2 : Cpu
  const isSoftware = project.category === 1

  return (
    <div className="relative group">
    <Link to={`/app/projects/${project.id}`}
      className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md dark:hover:shadow-blue-900/20 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
          <CategoryIcon size={20} className="text-blue-600 dark:text-blue-400" />
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isSoftware ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>
          {project.categoryName}
        </span>
      </div>

      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-1">{project.name}</h3>
      {project.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{project.description}</p>
      )}

      <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3">
        {project.latestRevision ? (
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
              v{project.latestRevision.version}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <Clock size={11} />
              {formatDate(project.latestRevision.createdAt)}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-500">Noch keine Revision</span>
        )}
      </div>
    </Link>

    {/* DEV-only Delete-Button */}
    {canDelete && (
      <button
        onClick={(e) => { e.preventDefault(); onDelete(project.id) }}
        title="Projekt löschen (nur DEV)"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all z-10">
        <Trash2 size={13} />
      </button>
    )}
    </div>
  )
}

export function ProjectsPage() {
  const { user } = useAuthStore()
  const [showNew, setShowNew] = useState(false)
  const queryClient = useQueryClient()
  const isAdmin = user?.roles.includes('Admin') || user?.roles.includes('Developer')
  const canDelete = !!(IS_DEV && isAdmin)

  const { data: projects, isLoading } = useQuery({ queryKey: ['projects'], queryFn: projectsApi.list })

  const deleteProject = useMutation({
    mutationFn: (id: string) => projectsApi.deleteProject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })

  const handleDelete = (id: string) => {
    if (!confirm('Projekt wirklich löschen? (DEV-only)')) return
    deleteProject.mutate(id)
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Projekte</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{projects?.length ?? 0} Projekt{projects?.length !== 1 ? 'e' : ''}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Plus size={16} /> Neues Projekt
          </button>
        )}
      </div>

      {projects?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
          <FolderOpen size={48} className="mb-4 opacity-50" />
          <p className="text-lg font-medium">Keine Projekte</p>
          <p className="text-sm">Erstellen Sie Ihr erstes Projekt.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects?.map((p) => (
            <ProjectCard key={p.id} project={p} canDelete={canDelete} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showNew && <NewProjectModal onClose={() => setShowNew(false)} />}
    </div>
  )
}
