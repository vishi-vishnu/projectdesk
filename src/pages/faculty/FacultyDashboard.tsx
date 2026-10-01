/**
 * Faculty guide dashboard: counts, the submissions and topics waiting for
 * this guide, their teams' progress and the review schedule.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardCheck, FolderKanban } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/domain/StatCard'
import { ProposalBadge } from '@/components/domain/StatusBadge'
import { Badge, Card, CardHeader, EmptyState, ProgressBar, Skeleton } from '@/components/ui'
import { useProfile } from '@/context/auth-context'
import { useActiveCycle, useSubmissionsForTeams, useTeamsForGuide } from '@/hooks/data'
import { dueLabel, formatDate, timeAgo } from '@/lib/format'
import { isLateSubmission, teamProgress, stageTopic } from '@/lib/progress'
import { buildQueue } from '@/lib/queue'

export function FacultyDashboard() {
  const profile = useProfile()
  const { cycle, loading: cycleLoading } = useActiveCycle()
  const [now] = useState(() => new Date())
  const { data: allTeams, loading: teamsLoading } = useTeamsForGuide(profile.uid)
  const teams = allTeams.filter((t) => t.cycleId === cycle?.id)
  const { byTeam, loading: subsLoading } = useSubmissionsForTeams(teams.map((t) => t.id))

  const loading = cycleLoading || teamsLoading || subsLoading
  const queue = cycle ? buildQueue(teams, cycle, byTeam) : []
  const proposals = teams.filter((t) => t.proposalStatus === 'submitted')
  const accepted = cycle ? buildQueue(teams, cycle, byTeam, ['accepted']).length : 0
  const totalStages = cycle ? teams.length * cycle.reviews.length : 0
  const upcoming = cycle?.reviews.find((r) => r.dueDate.toDate() >= now)

  return (
    <>
      <PageHeader
        title={`Good ${now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}, ${profile.name}`}
        description={cycle ? `${cycle.name}` : 'No active project cycle'}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Assigned teams" value={loading ? '...' : teams.length} to="/teams" />
        <StatCard label="Awaiting your review" value={loading ? '...' : queue.length} tone={queue.length ? 'warn' : undefined} to="/reviews" />
        <StatCard label="Topics to approve" value={loading ? '...' : proposals.length} tone={proposals.length ? 'warn' : undefined} />
        <StatCard
          label="Reviews completed"
          value={loading ? '...' : `${accepted}`}
          hint={totalStages ? `of ${totalStages} across your teams` : undefined}
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Needs your attention"
              description="Oldest first"
              actions={
                <Link to="/reviews" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline">
                  Review queue <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              }
            />
            {loading ? (
              <div className="space-y-3 p-5">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : queue.length === 0 && proposals.length === 0 ? (
              <EmptyState icon={<ClipboardCheck />} title="You're all caught up" description="New submissions from your teams will show up here." />
            ) : (
              <ul className="divide-y divide-line">
                {proposals.map((t) => (
                  <li key={`p-${t.id}`}>
                    <Link to={`/teams/${t.id}/proposal`} className="flex items-center gap-4 px-5 py-3 hover:bg-subtle/60">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium">{t.project.title || t.name}</p>
                        <p className="text-[12.5px] text-ink-3">{t.name} · topic approval</p>
                      </div>
                      <ProposalBadge status={t.proposalStatus} />
                    </Link>
                  </li>
                ))}
                {queue.slice(0, 8).map((q) => (
                  <li key={q.submission.id}>
                    <Link
                      to={`/teams/${q.team.id}/reviews/${q.stage.id}`}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-subtle/60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium">{q.team.project.title || q.team.name}</p>
                        <p className="text-[12.5px] text-ink-3">
                          {q.team.name} · Review {q.stageIndex + 1}
                          {q.submission.version > 1 && ` · v${q.submission.version}`} · {timeAgo(q.submission.createdAt)}
                        </p>
                      </div>
                      {isLateSubmission(q.stage, q.submission) && <Badge tone="bad">Late</Badge>}
                      <Badge tone="brand" dot>
                        Awaiting review
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="My teams" />
            {loading ? (
              <div className="p-5">
                <Skeleton className="h-24" />
              </div>
            ) : teams.length === 0 ? (
              <EmptyState
                icon={<FolderKanban />}
                title="No teams assigned yet"
                description="The project coordinator assigns teams to guides. They'll appear here."
              />
            ) : (
              <ul className="divide-y divide-line">
                {teams.map((t) => {
                  const p = cycle ? teamProgress(t, cycle, byTeam[t.id] ?? []) : null
                  return (
                    <li key={t.id}>
                      <Link to={`/teams/${t.id}`} className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-4 px-5 py-3 hover:bg-subtle/60 sm:grid-cols-[minmax(0,1fr)_160px_90px]">
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] font-medium">{t.project.title || 'Untitled project'}</p>
                          <p className="text-[12.5px] text-ink-3">
                            {t.name} · {t.memberIds.length} members
                          </p>
                        </div>
                        <ProgressBar value={p?.percent ?? 0} />
                        <span className="tabular hidden text-right text-[13px] text-ink-2 sm:block">
                          {p ? `${p.marks}/${p.maxMarks}` : ''}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Review schedule" />
            <ul className="divide-y divide-line">
              {cycle?.reviews.map((r, i) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium">Review {i + 1}</p>
                    <p className="truncate text-[12.5px] text-ink-3">{stageTopic(r.title)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tabular text-[13px]">{formatDate(r.dueDate, 'd MMM')}</p>
                    {upcoming?.id === r.id && <p className="text-[12px] text-brand">{dueLabel(r.dueDate)}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  )
}
