import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '../../api/projects'
import { Badge, BADGE_CONFIG } from '../../components/badges/Badge'
import { formatDate } from '../../lib/utils'
import { ArrowLeft, Plus, X, RefreshCw, Trash2 } from 'lucide-react'
import type { Revision } from '../../types'
import { useAuthStore } from '../../store/authStore'
import { motion, useInView } from 'framer-motion'

const IS_DEV = import.meta.env.DEV

const BADGE_TYPES = Object.keys(BADGE_CONFIG)
const BADGE_TYPE_NUM: Record<string, number> = {
  Update: 1, Change: 2, New: 3, Fix: 4, Security: 5, Deprecated: 6, Note: 7,
}

const INPUT = 'border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
const TEXTAREA = `${INPUT} resize-none`

function TimelineItem({ revision, projectId, canEdit, canDelete }: {
  revision: Revision; projectId: string; canEdit: boolean; canDelete: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px 0px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative pl-10"
    >
      {/*
        Punkt zentriert auf der Linie (left-4 + -translate-x-1/2).
        top-[38px] = p-5 Padding (20px) + Flex-Zentrierung der Header-Zeile (~18px)
      */}
      <div className={`
        absolute left-4 top-[38px] w-3 h-3 rounded-full -translate-x-1/2 z-10
        border-2 border-gray-50 dark:border-gray-950 shadow-sm
        ${revision.isReplaced ? 'bg-gray-300 dark:bg-gray-600' : 'bg-blue-500'}
      `} />

      <RevisionCard revision={revision} projectId={projectId} canEdit={canEdit} canDelete={canDelete} />
    </motion.div>
  )
}

function BadgeSelector({ onAdd }: { onAdd: (type: string, text: string) => void }) {
  const [selectedType, setSelectedType] = useState(BADGE_TYPES[0])
  const [text, setText] = useState('')

  const handleAdd = () => {
    if (!text.trim()) return
    onAdd(selectedType, text.trim())
    setText('')
  }

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className={INPUT}>
        {BADGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <input value={text} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        className={`flex-1 min-w-48 ${INPUT}`} placeholder="Beschreibung eingeben…" />
      <button onClick={handleAdd} disabled={!text.trim()}
        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-40 transition-colors flex items-center gap-1">
        <Plus size={14} /> Hinzufügen
      </button>
    </div>
  )
}

interface NewRevisionModalProps {
  projectId: string
  replaceRevision?: Revision
  onClose: () => void
}

function NewRevisionModal({ projectId, replaceRevision, onClose }: NewRevisionModalProps) {
  const [items, setItems] = useState<{ type: string; text: string }[]>([])
  const [notes, setNotes] = useState('')
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: () => {
      const data = { items: items.map((i) => ({ badgeType: BADGE_TYPE_NUM[i.type], text: i.text })), notes: notes || undefined }
      return replaceRevision
        ? projectsApi.replaceRevision(projectId, replaceRevision.id, data)
        : projectsApi.createRevision(projectId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revisions', projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {replaceRevision ? `Revision ${replaceRevision.version} ersetzen` : 'Neue Revision erstellen'}
          </h2>
          {replaceRevision && <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">⚠ Die alte Revision wird als "ersetzt" markiert.</p>}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <BadgeSelector onAdd={(type, text) => setItems((prev) => [...prev, { type, text }])} />

          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                  <Badge type={item.type} />
                  <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{item.text}</span>
                  <button onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}
                    className="text-gray-400 hover:text-red-500 transition-colors"><X size={14} /></button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg">
              Noch keine Einträge. Fügen Sie einen Badge hinzu.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notizen (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="Interne Notizen" className={`w-full ${TEXTAREA}`} />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Abbrechen</button>
          <button onClick={() => create.mutate()} disabled={items.length === 0 || create.isPending}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {create.isPending ? 'Speichere…' : replaceRevision ? 'Revision ersetzen' : 'Revision erstellen'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RevisionCard({ revision, projectId, canEdit, canDelete }: {
  revision: Revision; projectId: string; canEdit: boolean; canDelete: boolean
}) {
  const [replacing, setReplacing] = useState(false)
  const queryClient = useQueryClient()

  const deleteRevision = useMutation({
    mutationFn: () => projectsApi.deleteRevision(projectId, revision.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revisions', projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const markDeleted = useMutation({
    mutationFn: (itemId: string) => projectsApi.markItemDeleted(projectId, revision.id, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['revisions', projectId] }),
  })

  return (
    <div className={`bg-white dark:bg-gray-800 border rounded-xl p-5 ${revision.isReplaced ? 'border-gray-200 dark:border-gray-700 opacity-60' : 'border-gray-200 dark:border-gray-700'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={`font-mono font-bold text-lg ${revision.isReplaced ? 'text-gray-400 line-through' : 'text-blue-700 dark:text-blue-400'}`}>
            v{revision.version}
          </span>
          {revision.isReplaced && (
            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded">Ersetzt</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(revision.createdAt)} · {revision.createdBy}</span>
          {canEdit && !revision.isReplaced && (
            <button onClick={() => setReplacing(true)}
              className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 border border-amber-300 dark:border-amber-700 px-2 py-1 rounded hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors flex items-center gap-1">
              <RefreshCw size={11} /> Ersetzen
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => { if (confirm('Revision wirklich unwiderruflich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) deleteRevision.mutate() }}
              title="Revision permanent löschen (nur DEV)"
              className="p-1 rounded text-red-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {revision.notes && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 italic">{revision.notes}</p>}

      <div className="space-y-2">
        {revision.items.map((item) => (
          <div key={item.id} className={`flex items-start gap-3 py-1.5 group ${item.isDeleted ? 'opacity-50' : ''}`}>
            <Badge type={item.badgeName} />
            <span className={`flex-1 text-sm ${item.isDeleted ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
              {item.text}
            </span>
            {canEdit && !item.isDeleted && !revision.isReplaced && (
              <button onClick={() => markDeleted.mutate(item.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-all">
                <Trash2 size={14} />
              </button>
            )}
            {item.isDeleted && <span className="text-xs text-red-400">gelöscht</span>}
          </div>
        ))}
      </div>

      {replacing && <NewRevisionModal projectId={projectId} replaceRevision={revision} onClose={() => setReplacing(false)} />}
    </div>
  )
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [showNew, setShowNew] = useState(false)
  const { user } = useAuthStore()

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id!),
    enabled: !!id,
  })

  const { data: revisions, isLoading } = useQuery({
    queryKey: ['revisions', id],
    queryFn: () => projectsApi.getRevisions(id!),
    enabled: !!id,
  })

  const canEdit = project?.userPermission === 2 || project?.userPermission === undefined
  const isAdminOrDev = user?.roles.some(r => r === 'Admin' || r === 'Developer')
  const canDelete = !!(isAdminOrDev && IS_DEV)

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link to="/app/projects" className="p-2 -ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{project?.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${project?.category === 1 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>
              {project?.categoryName}
            </span>
          </div>
          {project?.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{project.description}</p>}
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {/*
          Timeline-Linie läuft bei left:16px (= left-4).
          Dots sitzen ebenfalls bei left-4, zentriert mit -translate-x-1/2.
          pl-10 (40px) rückt die Card nach rechts, Linie bleibt sichtbar.
        */}
        <div className="relative space-y-4">
          {/* Vertikale Linie – 16px von links, durchgehend ohne Verlauf */}
          <div className="absolute left-4 top-0 bottom-0 w-px
            bg-gray-200 dark:bg-gray-700 pointer-events-none" />

          {/* Add-Button als erstes Timeline-Item */}
          {canEdit && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="relative pl-10"
            >
              {/* grüner Punkt – gleiche Position wie Revision-Punkte */}
              <div className="absolute left-4 top-[38px] w-3 h-3 rounded-full -translate-x-1/2 z-10
                bg-green-400 border-2 border-gray-50 dark:border-gray-950 shadow-sm" />
              <button
                onClick={() => setShowNew(true)}
                className="w-full flex items-center gap-3 px-5 py-4 rounded-xl
                  border-2 border-dashed border-gray-200 dark:border-gray-700
                  text-gray-400 dark:text-gray-500
                  hover:border-blue-400 dark:hover:border-blue-600
                  hover:text-blue-600 dark:hover:text-blue-400
                  hover:bg-blue-50/50 dark:hover:bg-blue-900/10
                  transition-all group"
              >
                <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800
                  flex items-center justify-center shrink-0
                  group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                  <Plus size={15} />
                </div>
                <span className="text-sm font-medium">Neue Revision erstellen</span>
              </button>
            </motion.div>
          )}

          {/* Revisionen */}
          {revisions?.length === 0 && !canEdit ? (
            <div className="pl-10 py-12 text-gray-400 dark:text-gray-500 text-center">
              Noch keine Revisionen
            </div>
          ) : (
            revisions?.map((r) => (
              <TimelineItem key={r.id} revision={r} projectId={id!} canEdit={canEdit} canDelete={canDelete} />
            ))
          )}
        </div>
      </div>

      {showNew && <NewRevisionModal projectId={id!} onClose={() => setShowNew(false)} />}
    </div>
  )
}
