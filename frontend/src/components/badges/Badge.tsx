import { cn } from '../../lib/utils'

const BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  Update:     { label: 'Update',     className: 'bg-blue-100 text-blue-800 border-blue-300' },
  Change:     { label: 'Change',     className: 'bg-purple-100 text-purple-800 border-purple-300' },
  New:        { label: 'New',        className: 'bg-green-100 text-green-800 border-green-300' },
  Fix:        { label: 'Fix',        className: 'bg-orange-100 text-orange-800 border-orange-300' },
  Security:   { label: 'Security',   className: 'bg-red-100 text-red-800 border-red-300' },
  Deprecated: { label: 'Deprecated', className: 'bg-gray-100 text-gray-600 border-gray-300' },
  Note:       { label: 'Note',       className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
}

interface BadgeProps {
  type: string
  size?: 'sm' | 'md'
}

export function Badge({ type, size = 'md' }: BadgeProps) {
  const config = BADGE_CONFIG[type] ?? { label: type, className: 'bg-gray-100 text-gray-700 border-gray-300' }
  return (
    <span className={cn(
      'inline-flex items-center font-semibold border rounded',
      size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs',
      config.className
    )}>
      {config.label}
    </span>
  )
}

export { BADGE_CONFIG }
