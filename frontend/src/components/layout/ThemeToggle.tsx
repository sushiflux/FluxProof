import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import { cn } from '../../lib/utils'

interface ThemeToggleProps {
  variant?: 'sidebar' | 'topbar'
}

export function ThemeToggle({ variant = 'topbar' }: ThemeToggleProps) {
  const { theme, toggle } = useThemeStore()
  const isDark = theme === 'dark'

  if (variant === 'sidebar') {
    return (
      <button
        onClick={toggle}
        title={isDark ? 'Heller Modus' : 'Dunkler Modus'}
        className={cn(
          'p-1.5 rounded-lg transition-all',
          isDark
            ? 'bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25'
            : 'bg-slate-600/40 text-slate-300 hover:bg-slate-600/60'
        )}
      >
        {isDark ? <Sun size={15} /> : <Moon size={15} />}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Heller Modus' : 'Dunkler Modus'}
      className={cn(
        'p-1.5 rounded-lg transition-all',
        isDark
          ? 'bg-yellow-400/10 text-yellow-500 hover:bg-yellow-400/20'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      )}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
