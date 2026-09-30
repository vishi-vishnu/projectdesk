import { createContext, useContext } from 'react'
import type { User } from 'firebase/auth'
import type { UserProfile } from '@/lib/types'

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  /** True until both the auth state and the profile document are known. */
  loading: boolean
}

export const AuthContext = createContext<AuthState>({ user: null, profile: null, loading: true })

export const useAuth = () => useContext(AuthContext)

/** For screens behind <RequireAuth>, where the profile is guaranteed. */
export function useProfile(): UserProfile {
  const { profile } = useContext(AuthContext)
  if (!profile) throw new Error('useProfile() used outside an authenticated route')
  return profile
}
