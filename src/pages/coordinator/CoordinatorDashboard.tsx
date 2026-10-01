/**
 * Coordinator overview: headline numbers and a progress matrix showing every
 * team's status at every review stage.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarPlus, LayoutGrid } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/domain/StatCard'
import { Button, Card, CardHeader, cn, EmptyState, Skeleton } from '@/components/ui'
import { useActiveCycle, useCycleSubmissions, useTeamsForCycle, useUsersByRole } from '@/hooks/data'
import { dueLabel, formatDate } from '@/lib/format'
import { latestByReview, stageState, stageStateLabel, type StageState, stageShortName } from '@/lib/progress'
import type { Submission } from '@/lib/types'

const cell: Record<StageState, string> = {
  accepted: 'bg-ok text-white',
  submitted: 'bg-brand-soft text-brand ring-1 ring-inset ring-brand-line',
  changes_requested: 'bg-warn-soft text-warn ring-1 ring-inset ring-warn-line',
  overdue: 'bg-bad-soft text-bad ring-1 ring-inset ring-bad-line',
  due_soon: 'bg-surface text-ink-3 ring-1 ring-inset ring-line-strong',
  upcoming: 'bg-surface text-ink-3 ring-1 ring-inset ring-line',
}

const short: Record<StageState, string> = {
  accepted: '✓',
  submitted: 'In',
  changes_requested: 'Fix',
  overdue: '!',
  due_soon: '·',
  upcoming: '',
}

export function CoordinatorDashboard() {
  const { cycle, loading: cycleLoading } = useActiveCycle()
  const { data: teams, loading: teamsLoading } = useTeamsForCycle(cycle?.id)
  const { data: subs } = useCycleSubmissions(cycle?.id)
  const { data: faculty } = useUsersByRole('faculty')
  const { data: students } = useUsersByRole('student')
  const [now] = useState(() => new Date())

  const byTeam = useMemo(() => {
    const map: Record<string, Submission[]> = {}
    for (const s of subs) (map[s.teamId] ??= []).push(s)
    return map
  }, [subs])

  if (cycleLoading) return <Skeleton className="h-96" />

  if (!cycle) {
    return (
      <>
        <PageHeader title="Overview" />
        <Card>
          <EmptyState
            icon={<CalendarPlus />}
            title="Set up your first project cycle"
            description="Define the review stages, due dates and marks. Students can form teams once a cycle is active."
            action={
              <Link to="/cycles">
                <Button variant="primary">Create project cycle</Button>
              </Link>
            }
          />
        </Card>
      </>
    )
  }

  const pendingFaculty = faculty.filter((f) => f.status === 'pending').length
  const activeFaculty = faculty.filter((f) => f.status === 'active').length
  const unassigned = teams.filter((t) => !t.guideId).length
  const withoutTeam = students.filter((s) => !s.teamId).length
  const topicsApproved = teams.filter((t) => t.proposalStatus === 'approved').length
  const nextStage = cycle.reviews.find((r) => r.dueDate.toDate() >= now)

  // Per-stage completion for the summary row
  const stageStats = cycle.reviews.map((r) => {
    let submitted = 0
    let accepted = 0
    for (const t of teams) {
      const s = latestByReview(byTeam[t.id] ?? []).get(r.id)
      if (s) submitted++
      if (s?.status === 'accepted') accepted++
    }
    return { submitted, accepted }
  })

  return (
    <>
      <PageHeader
        title="Overview"
        description={`${cycle.name} · ${cycle.department}`}
        actions={
          <Link to="/teams">
            <Button icon={<LayoutGrid className="size-4" />}>Manage teams</Button>
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Teams registered" value={teamsLoading ? '...' : teams.length} hint={`${topicsApproved} topics approved`} to="/teams" />
        <StatCard
          label="Students"
          value={students.length}
          hint={withoutTeam ? `${withoutTeam} not in a team yet` : 'All in teams'}
          tone={withoutTeam ? 'warn' : undefined}
          to="/people?tab=students"
        />
        <StatCard label="Teams without a guide" value={teamsLoading ? '...' : unassigned} tone={unassigned ? 'warn' : undefined} to="/teams" />
        <StatCard label="Faculty guides" value={activeFaculty} hint={pendingFaculty ? `${pendingFaculty} awaiting approval` : undefined} to="/people" />
        <StatCard
          label="Next review"
          value={nextStage ? formatDate(nextStage.dueDate, 'd MMM') : '-'}
          hint={nextStage ? `${stageShortName(nextStage.title)} · ${dueLabel(nextStage.dueDate)}` : 'All reviews completed'}
          to="/cycles"
        />
      </div>

      <Card>
        <CardHeader
          title="Progress matrix"
          description="Latest status of every team at every review stage."
          actions={
            <Link to="/teams" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline">
              All teams <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          }
        />
        {teamsLoading ? (
          <div className="p-5">
            <Skeleton className="h-40" />
          </div>
        ) : teams.length === 0 ? (
          <EmptyState title="No teams yet" description="Students register and create teams from their dashboard." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead className="border-b border-line text-[12px] text-ink-3">
                <tr>
                  <th className="px-5 py-2 text-left font-medium">Team</th>
                  <th className="px-2 py-2 text-center font-medium">Topic</th>
                  {cycle.reviews.map((r, i) => (
                    <th key={r.id} className="px-2 py-2 text-center font-medium" title={r.title}>
                      R{i + 1}
                      <span className="block text-[11px] font-normal">{formatDate(r.dueDate, 'd MMM')}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {teams.map((t) => {
                  const latest = latestByReview(byTeam[t.id] ?? [])
                  return (
                    <tr key={t.id} className="hover:bg-subtle/60">
                      <td className="max-w-[280px] px-5 py-2">
                        <Link to={`/teams/${t.id}`} className="block truncate font-medium hover:text-brand hover:underline">
                          {t.name}
                        </Link>
                        <span className="block truncate text-[12px] text-ink-3">{t.project.title || 'Untitled project'}</span>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span
                          className={cn(
                            'inline-flex h-7 w-11 items-center justify-center rounded-sm text-[11.5px] font-semibold',
                            t.proposalStatus === 'approved'
                              ? cell.accepted
                              : t.proposalStatus === 'submitted'
                                ? cell.submitted
                                : t.proposalStatus === 'changes_requested'
                                  ? cell.changes_requested
                                  : cell.upcoming,
                          )}
                          title={`Topic: ${t.proposalStatus.replace('_', ' ')}`}
                        >
                          {t.proposalStatus === 'approved' ? '✓' : t.proposalStatus === 'submitted' ? 'In' : t.proposalStatus === 'changes_requested' ? 'Fix' : ''}
                        </span>
                      </td>
                      {cycle.reviews.map((r) => {
                        const s = latest.get(r.id)
                        const st = stageState(r, s)
                        return (
                          <td key={r.id} className="px-2 py-2 text-center">
                            <Link
                              to={`/teams/${t.id}/reviews/${r.id}`}
                              className={cn('inline-flex h-7 w-11 items-center justify-center rounded-sm text-[11.5px] font-semibold', cell[st])}
                              title={`${r.title}: ${stageStateLabel(st)}${s?.evaluation ? ` (${s.evaluation.marks}/${r.maxMarks})` : ''}`}
                            >
                              {st === 'accepted' && s?.evaluation ? s.evaluation.marks : short[st]}
                            </Link>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="border-t border-line text-[12px] text-ink-3">
                <tr>
                  <td className="px-5 py-2 font-medium">Submitted / accepted</td>
                  <td className="px-2 py-2 text-center tabular">
                    {teams.filter((t) => t.proposalStatus !== 'draft').length}/{topicsApproved}
                  </td>
                  {stageStats.map((s, i) => (
                    <td key={i} className="tabular px-2 py-2 text-center">
                      {s.submitted}/{s.accepted}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-line px-5 py-3 text-[12px] text-ink-3">
          {(['accepted', 'submitted', 'changes_requested', 'overdue', 'upcoming'] as StageState[]).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span className={cn('inline-block size-3 rounded-[3px]', cell[s])} aria-hidden />
              {stageStateLabel(s)}
            </span>
          ))}
        </div>
      </Card>
    </>
  )
}
