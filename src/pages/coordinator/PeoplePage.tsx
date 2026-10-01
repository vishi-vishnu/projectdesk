/**
 * People: approve or reject faculty sign-ups, and see which students have
 * not joined a team yet.
 */
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, Search, UserX, Users } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { AccountBadge } from '@/components/domain/StatusBadge'
import { Avatar, Badge, Button, Card, CardHeader, cn, EmptyState, Input, Skeleton } from '@/components/ui'
import { useActiveCycle, useTeamsForCycle, useUsersByRole } from '@/hooks/data'
import { formatDate } from '@/lib/format'
import type { UserProfile } from '@/lib/types'
import { setAccountStatus } from '@/services/users'
import { errorMessage } from '@/pages/auth/errors'

function PendingRow({ user }: { user: UserProfile }) {
  const [busy, setBusy] = useState<'active' | 'rejected' | null>(null)
  const decide = async (status: 'active' | 'rejected') => {
    setBusy(status)
    try {
      await setAccountStatus(user.uid, status)
      toast.success(status === 'active' ? `${user.name} approved` : `${user.name} rejected`)
    } catch (e) {
      toast.error(errorMessage(e))
      setBusy(null)
    }
  }
  return (
    <li className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={user.name} size={32} />
        <div className="min-w-0">
          <p className="truncate font-medium">{user.name}</p>
          <p className="truncate text-[12.5px] text-ink-3">
            {user.email} · {user.designation || 'Faculty'} · {user.department}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" variant="danger" icon={<UserX className="size-3.5" />} loading={busy === 'rejected'} disabled={busy !== null} onClick={() => decide('rejected')}>
          Reject
        </Button>
        <Button size="sm" variant="success" icon={<Check className="size-3.5" />} loading={busy === 'active'} disabled={busy !== null} onClick={() => decide('active')}>
          Approve
        </Button>
      </div>
    </li>
  )
}

function FacultyTab() {
  const { cycle } = useActiveCycle()
  const { data: faculty, loading } = useUsersByRole('faculty')
  const { data: teams } = useTeamsForCycle(cycle?.id)
  const pending = faculty.filter((f) => f.status === 'pending')
  const others = faculty.filter((f) => f.status !== 'pending')
  const load = (uid: string) => teams.filter((t) => t.guideId === uid).length

  const reactivate = async (u: UserProfile) => {
    try {
      await setAccountStatus(u.uid, 'active')
      toast.success(`${u.name} re-activated`)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  if (loading) return <Skeleton className="h-60" />

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <Card className="border-warn-line">
          <CardHeader title="Awaiting approval" description="Faculty who registered and are waiting to be activated." />
          <ul className="divide-y divide-line">
            {pending.map((u) => (
              <PendingRow key={u.uid} user={u} />
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardHeader title="Faculty" description={`${others.length} registered`} />
        {others.length === 0 ? (
          <EmptyState icon={<Users />} title="No faculty yet" description="Faculty accounts appear here after they register." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13.5px]">
              <thead className="border-b border-line text-[12px] text-ink-3">
                <tr>
                  <th className="px-5 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Designation</th>
                  <th className="px-3 py-2 font-medium">Teams guided</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-5 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {others.map((u) => (
                  <tr key={u.uid}>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size={28} />
                        <div className="min-w-0">
                          <p className="font-medium">{u.name}</p>
                          <p className="text-[12.5px] text-ink-3">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-ink-2">{u.designation || '-'}</td>
                    <td className="tabular px-3 py-2.5 text-ink-2">{load(u.uid)}</td>
                    <td className="px-3 py-2.5">
                      <AccountBadge status={u.status} />
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      {u.status === 'rejected' && (
                        <Button size="sm" onClick={() => reactivate(u)}>
                          Approve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function StudentsTab() {
  const { cycle } = useActiveCycle()
  const { data: students, loading } = useUsersByRole('student')
  const { data: teams } = useTeamsForCycle(cycle?.id)
  const teamById = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t])), [teams])
  const [search, setSearch] = useState('')
  const [onlyUnteamed, setOnlyUnteamed] = useState(false)

  const filtered = students.filter((s) => {
    if (onlyUnteamed && s.teamId) return false
    const q = search.trim().toLowerCase()
    return !q || `${s.name} ${s.regNo} ${s.email}`.toLowerCase().includes(q)
  })

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-line px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, register no. or email" className="pl-9" aria-label="Search students" />
        </div>
        <label className="inline-flex items-center gap-2 text-[13px] text-ink-2 select-none">
          <input type="checkbox" checked={onlyUnteamed} onChange={(e) => setOnlyUnteamed(e.target.checked)} className="size-4 accent-[var(--color-brand)]" />
          Only students without a team ({students.filter((s) => !s.teamId).length})
        </label>
      </div>
      {loading ? (
        <div className="p-5">
          <Skeleton className="h-40" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users />} title="No students found" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-[13.5px]">
            <thead className="border-b border-line text-[12px] text-ink-3">
              <tr>
                <th className="px-5 py-2 font-medium">Student</th>
                <th className="px-3 py-2 font-medium">Register no.</th>
                <th className="px-3 py-2 font-medium">Team</th>
                <th className="px-5 py-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((s) => {
                const team = s.teamId ? teamById[s.teamId] : undefined
                return (
                  <tr key={s.uid}>
                    <td className="px-5 py-2.5">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-[12.5px] text-ink-3">{s.email}</p>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[12.5px] text-ink-2">{s.regNo || '-'}</td>
                    <td className="px-3 py-2.5">
                      {team ? (
                        <Link to={`/teams/${team.id}`} className="hover:text-brand hover:underline">
                          {team.name}
                          {team.leadId === s.uid && <Badge className="ml-2">Lead</Badge>}
                        </Link>
                      ) : s.teamId ? (
                        <span className="text-ink-3">Previous cycle</span>
                      ) : (
                        <Badge tone="warn">No team</Badge>
                      )}
                    </td>
                    <td className="tabular px-5 py-2.5 text-ink-3">{formatDate(s.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export function PeoplePage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'students' ? 'students' : 'faculty'
  const { data: faculty } = useUsersByRole('faculty')
  const pending = faculty.filter((f) => f.status === 'pending').length

  return (
    <>
      <PageHeader title="People" description="Approve faculty accounts and see which students are in a team." />
      <div className="mb-5 flex gap-1 border-b border-line" role="tablist">
        {(['faculty', 'students'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setParams(t === 'faculty' ? {} : { tab: t })}
            className={cn(
              '-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-[13.5px] font-medium capitalize transition-colors',
              tab === t ? 'border-brand text-ink' : 'border-transparent text-ink-3 hover:text-ink',
            )}
          >
            {t}
            {t === 'faculty' && pending > 0 && <Badge tone="warn">{pending}</Badge>}
          </button>
        ))}
      </div>
      {tab === 'faculty' ? <FacultyTab /> : <StudentsTab />}
    </>
  )
}
