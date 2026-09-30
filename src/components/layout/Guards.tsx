import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import type { Role } from '@/lib/types'
import { Spinner } from '@/components/ui'
import { PendingApproval } from '@/pages/auth/PendingApproval'

export function FullPageSpinner() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Spinner />
    </div>
  )
}

/** Signed in, profile loaded, account active. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!profile) return <FullPageSpinner />
  if (profile.status !== 'active') return <PendingApproval profile={profile} />
  return <>{children}</>
}

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { profile } = useAuth()
  if (!profile || !roles.includes(profile.role)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

/** Login / register pages: bounce signed-in users to their dashboard. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageSpinner />
  if (user && profile) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from && from !== '/login' ? from : '/dashboard'} replace />
  }
  return <>{children}</>
}
