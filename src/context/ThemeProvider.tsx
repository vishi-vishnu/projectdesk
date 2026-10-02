import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { THEME_STORAGE_KEY, ThemeContext, type ThemePreference } from './theme-context'

function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    return v === 'dark' || v === 'system' ? v : 'light'
  } catch {
    return 'light'
  }
}

const media = () => window.matchMedia('(prefers-color-scheme: dark)')

/**
 * Light / dark / follow-the-system theme. Light is the default; the choice is
 * saved per browser and applied as data-theme on <html>, and index.css swaps
 * the colour tokens.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference)
  const [systemDark, setSystemDark] = useState(() => media().matches)

  useEffect(() => {
    const m = media()
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    m.addEventListener('change', onChange)
    return () => m.removeEventListener('change', onChange)
  }, [])

  const resolved = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    document.documentElement.dataset.theme = resolved
    document.documentElement.style.colorScheme = resolved
  }, [resolved])

  const value = useMemo(
    () => ({
      preference,
      resolved,
      setPreference: (p: ThemePreference) => {
        setPreferenceState(p)
        try {
          localStorage.setItem(THEME_STORAGE_KEY, p)
        } catch {
          /* storage unavailable: keep it for this visit only */
        }
      },
    }),
    [preference, resolved],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
