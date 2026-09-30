import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardCheck } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StageBadge } from '@/components/domain/StatusBadge'
import { Badge, Card, cn, EmptyState, Skeleton } from '@/components/ui'
import { useProfile } from '@/context/auth-context'
import { useActiveCycle, useSubmissionsForTeams, useTeamsForGuide } from '@/hooks/data'
import { formatDateTime } from '@/lib/format'
import { isLateSubmission } from '@/lib/progress'
import { buildQueue } from '@/lib/queue'
import type { SubmissionStatus } from '@/lib/types'

const filters: { label: string; statuses: SubmissionStatus[] }[] = [
  { label: 'Awaiting review', statuses: ['submitted'] },
  { label: 'Changes requested', statuses: ['changes_requested'] },
  { label: 'Accepted', statuses: ['accepted'] },
]

export function ReviewQueue() {
  const profile = useProfile()
  const { cycle } = useActiveCycle()
  const { data: allTeams, loading: teamsLoading } = useTeamsForGuide(profile.uid)
  const teams = allTeams.filter((t) => t.cycleId === cycle?.id)
  const { byTeam, loading } = useSubmissionsForTeams(teams.map((t) => t.id))
  const [active, setActive] = useState(0)

  const counts = filters.map((f) => (cycle ? buildQueue(teams, cycle, byTeam, f.statuses).length : 0))
  const items = cycle ? buildQueue(teams, cycle, byTeam, filters[active].statuses) : []
  if (active > 0) items.reverse()

  return (
    <>
      <PageHeader title="Review queue" description="The latest submission for each team and review stage." />
      <div className="mb-4 flex gap-1 overflow-x-auto" role="tablist">
        {filters.map((f, i) => (
          <button
            key={f.label}
            role="tab"
            aria-selected={active === i}
            onClick={() => setActive(i)}
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-[13px] font-medium transition-colors',
              active === i ? 'bg-surface text-ink shadow-card ring-1 ring-line' : 'text-ink-3 hover:bg-muted/60 hover:text-ink',
            )}
          >
            {f.label}
            <span className="tabular rounded-sm bg-subtle px-1.5 text-[12px] text-ink-2">{counts[i]}</span>
          </button>
        ))}
      </div>

      <Card>
        {loading || teamsLoading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={<ClipboardCheck />} title="Nothing here" description="Submissions matching this filter will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13.5px]">
              <thead className="border-b border-line text-[12px] text-ink-3">
                <tr>
                  <th className="px-5 py-2 font-medium">Project</th>
                  <th className="px-3 py-2 font-medium">Stage</th>
                  <th className="px-3 py-2 font-medium">Submitted</th>
                  <th className="px-3 py-2 font-medium">Files</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((q) => (
                  <tr key={q.submission.id} className="hover:bg-subtle/60">
                    <td className="px-5 py-3">
                      <Link to={`/teams/${q.team.id}/reviews/${q.stage.id}`} className="font-medium hover:text-brand hover:underline">
                        {q.team.project.title || q.team.name}
                      </Link>
                      <p className="text-[12.5px] text-ink-3">{q.team.name}</p>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      Review {q.stageIndex + 1}
                      {q.submission.version > 1 && <span className="text-ink-3"> · v{q.submission.version}</span>}
                    </td>
                    <td className="tabular px-3 py-3 whitespace-nowrap text-ink-2">
                      {formatDateTime(q.submission.createdAt)}
                      {isLateSubmission(q.stage, q.submission) && (
                        <Badge tone="bad" className="ml-2">
                          Late
                        </Badge>
                      )}
                    </td>
                    <td className="tabular px-3 py-3 text-ink-2">{q.submission.files.length}</td>
                    <td className="px-5 py-3">
                      <StageBadge state={q.submission.status} />
                      {q.submission.evaluation && q.submission.status === 'accepted' && (
                        <span className="tabular ml-2 text-[13px] text-ink-2">
                          {q.submission.evaluation.marks}/{q.stage.maxMarks}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
