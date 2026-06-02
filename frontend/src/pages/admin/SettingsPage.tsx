import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/admin'
import { Save, Info } from 'lucide-react'

const INPUT_BASE = 'w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const INPUT = `${INPUT_BASE} border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`
const INPUT_DISABLED = `${INPUT_BASE} border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed`

function SettingRow({ setting, disabled, onChange }: {
  setting: { key: string; value?: string; category: string }
  disabled?: boolean
  onChange: (key: string, value: string) => void
}) {
  const label = setting.key.split('.').slice(1).join('.')
  const isBoolean = setting.value === 'true' || setting.value === 'false'
  const isPassword = setting.key.toLowerCase().includes('password')

  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="w-48 shrink-0">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{label}</div>
        <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">{setting.key}</div>
      </div>
      <div className="flex-1">
        {disabled ? (
          <div className="flex items-center gap-2">
            <input type={isPassword ? 'password' : 'text'} value={setting.value ?? ''} disabled
              className={INPUT_DISABLED} placeholder="—" />
            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded whitespace-nowrap">
              <Info size={12} /> Nicht verfügbar
            </span>
          </div>
        ) : isBoolean ? (
          <select value={setting.value ?? 'false'} onChange={(e) => onChange(setting.key, e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="false">Nein</option>
            <option value="true">Ja</option>
          </select>
        ) : (
          <input type={isPassword ? 'password' : 'text'} value={setting.value ?? ''}
            onChange={(e) => onChange(setting.key, e.target.value)}
            className={INPUT} placeholder="—" />
        )}
      </div>
    </div>
  )
}

export function SettingsPage() {
  const queryClient = useQueryClient()
  const [localValues, setLocalValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const { data: settings } = useQuery({ queryKey: ['admin-settings'], queryFn: () => adminApi.getSettings() })

  const grouped = settings?.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {} as Record<string, typeof settings>)

  const handleChange = (key: string, value: string) =>
    setLocalValues((prev) => ({ ...prev, [key]: value }))

  const getValue = (key: string, orig?: string) =>
    localValues[key] !== undefined ? localValues[key] : (orig ?? '')

  const handleSave = async () => {
    setSaving(true)
    await Promise.all(Object.entries(localValues).map(([key, value]) => adminApi.updateSetting(key, value)))
    await queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
    setLocalValues({})
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Einstellungen</h1>
        <button onClick={handleSave} disabled={!Object.keys(localValues).length || saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          <Save size={16} />
          {saved ? 'Gespeichert ✓' : saving ? 'Speichere…' : 'Speichern'}
        </button>
      </div>

      <div className="space-y-6">
        {grouped?.['General'] && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">Allgemein</h2>
            {grouped['General'].map((s) => (
              <SettingRow key={s.key} setting={{ ...s, value: getValue(s.key, s.value) }} onChange={handleChange} />
            ))}
          </div>
        )}

        {grouped?.['LDAP'] && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Active Directory / LDAP</h2>
              <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700 px-2.5 py-1 rounded-full font-medium">
                Funktion noch nicht verfügbar
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Diese Felder sind vorbereitet für eine zukünftige AD-Integration.
            </p>
            {grouped['LDAP'].map((s) => (
              <SettingRow key={s.key} setting={{ ...s, value: getValue(s.key, s.value) }} disabled onChange={handleChange} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
