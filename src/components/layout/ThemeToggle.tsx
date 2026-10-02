import { Moon, Sun } from 'lucide-react'
import { cn } from '@/components/ui'
import { useTheme } from '@/context/theme-context'

/** One-click switch between the light and dark themes. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, setPreference } = useTheme()
  const dark = resolved === 'dark'
  const label = dark ? 'Switch to light mode' : 'Switch to dark mode'
  return (
    <button
      type="button"
      onClick={() => setPreference(dark ? 'light' : 'dark')}
      className={cn('rounded-md p-2 text-ink-2 transition-colors hover:bg-muted/70 hover:text-ink', className)}
      aria-label={label}
      title={label}
    >
      {dark ? <Sun className="size-[18px]" aria-hidden /> : <Moon className="size-[18px]" aria-hidden />}
    </button>
  )
}
