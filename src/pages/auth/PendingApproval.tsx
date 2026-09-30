import { Clock, XCircle } from 'lucide-react'
import { Button } from '@/components/ui'
import { Logo } from '@/components/layout/Logo'
import type { UserProfile } from '@/lib/types'
import { useSignOut } from '@/hooks/useSignOut'

export function PendingApproval({ profile }: { profile: UserProfile }) {
  const signOut = useSignOut()
  const rejected = profile.status === 'rejected'
  return (
    <div className="flex min-h-dvh flex-col items-center px-5 py-8">
      <Logo />
      <div className="mt-[14vh] w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-card">
        {rejected ? <XCircle className="size-6 text-bad" aria-hidden /> : <Clock className="size-6 text-warn" aria-hidden />}
        <h1 className="mt-3 text-[18px] font-semibold">
          {rejected ? 'Your account request was declined' : 'Waiting for coordinator approval'}
        </h1>
        <p className="mt-2 text-[14px] text-ink-2">
          {rejected
            ? 'The project coordinator did not approve this faculty account. If you think this is a mistake, contact your department office.'
            : `Thanks, ${profile.name.split(' ')[0]}. Faculty accounts need to be approved by the project coordinator before you can be assigned teams. This page updates automatically once you're approved.`}
        </p>
        <dl className="mt-5 grid grid-cols-[110px_1fr] gap-y-1.5 text-[13px]">
          <dt className="text-ink-3">Email</dt>
          <dd>{profile.email}</dd>
          <dt className="text-ink-3">Department</dt>
          <dd>{profile.department}</dd>
        </dl>
        <Button className="mt-6" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    </div>
  )
}
