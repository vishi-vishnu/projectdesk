import { createContext, useContext } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

export interface ThemeState {
  preference: ThemePreference
  /** What is actually on screen after resolving "system". */
  resolved: 'light' | 'dark'
  setPreference: (p: ThemePreference) => void
}

export const ThemeContext = createContext<ThemeState>({
  preference: 'system',
  resolved: 'light',
  setPreference: () => {},
})

export const useTheme = () => useContext(ThemeContext)

export const THEME_STORAGE_KEY = 'pd-theme'
