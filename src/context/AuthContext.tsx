/**
 * Keeps the signed-in Firebase user and their live profile document
 * (users/{uid}) in React context, so any screen can read the role and status.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { onSnapshot } from 'firebase/firestore'
import { auth } from '@/lib/firebase'
import type { UserProfile } from '@/lib/types'
import { userDoc } from '@/services/refs'
import { AuthContext } from './auth-context'


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileReady, setProfileReady] = useState(false)

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u)
        setProfile(null)
        setProfileReady(!u)
        setAuthReady(true)
      }),
    [],
  )

  useEffect(() => {
    if (!user) return
    // The profile doc is written right after sign-up, so it may not exist for a
    // moment. The snapshot listener picks it up as soon as it lands.
    return onSnapshot(
      userDoc(user.uid),
      (snap) => {
        setProfile(snap.exists() ? snap.data() : null)
        if (snap.exists() || !snap.metadata.fromCache) setProfileReady(true)
      },
      () => setProfileReady(true),
    )
  }, [user])

  const value = useMemo(
    () => ({ user, profile, loading: !authReady || (user !== null && !profileReady) }),
    [user, profile, authReady, profileReady],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

