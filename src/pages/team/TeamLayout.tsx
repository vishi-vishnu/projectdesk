import { useMemo } from 'react'
import { NavLink, Outlet, useParams } from 'react-router-dom'
import { FolderX } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProposalBadge } from '@/components/domain/StatusBadge'
import { Avatar, Badge, cn, EmptyState, Skeleton } from '@/components/ui'
import { useProfile } from '@/context/auth-context'
import { useCycle, useProfiles, useSubmissions, useTeam } from '@/hooks/data'
import { latestByReview } from '@/lib/progress'
import { computePermissions, type TeamContextValue } from './TeamContext'

const tabs = [
  { to: '', label: 'Overview', end: true },
  { to: 'proposal', label: 'Proposal' },
  { to: 'reviews', label: 'Reviews' },
  { to: 'discussion', label: 'Discussion' },
  { to: 'activity', label: 'Activity' },
]

export function TeamLayout() {
  const { teamId } = useParams<{ teamId: string }>()
  const viewer = useProfile()
  const { data: team, loading: teamLoading, error } = useTeam(teamId)
  const { data: cycle, loading: cycleLoading } = useCycle(team?.cycleId)
  const { data: submissions } = useSubmissions(team ? teamId : null)
  const profiles = useProfiles([...(team?.memberIds ?? []), team?.guideId])

  const value = useMemo<TeamContextValue | null>(() => {
    if (!team || !cycle) return null
    const members: TeamContextValue['members'] = {}
    team.memberIds.forEach((id) => profiles[id] && (members[id] = profiles[id]))
    return {
      team,
      cycle,
      submissions,
      latest: latestByReview(submissions),
      members,
      guide: team.guideId ? (profiles[team.guideId] ?? null) : null,
      viewer,
      perms: computePermissions(team, viewer),
    }
  }, [team, cycle, submissions, profiles, viewer])

  if (teamLoading || (team && cycleLoading)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-9 w-full max-w-xl" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!team || !value || error) {
    return (
      <EmptyState
        icon={<FolderX />}
        title="Team not found"
        description="This team doesn't exist, or you don't have access to it."
        className="mt-16"
      />
    )
  }

  const crumbs =
    viewer.role === 'student'
      ? [{ label: 'My team' }]
      : [{ label: viewer.role === 'faculty' ? 'My teams' : 'Teams', to: '/teams' }, { label: team.name }]

  const orderedMembers = [...team.memberIds].sort((a, b) => (a === team.leadId ? -1 : b === team.leadId ? 1 : 0))

  return (
    <>
      <PageHeader
        breadcrumb={crumbs}
        title={team.project.title || team.name}
        description={team.project.title ? team.name : 'Project title not added yet'}
        meta={
          <>
            <ProposalBadge status={team.proposalStatus} />
            {team.project.domain && <Badge>{team.project.domain}</Badge>}
            <span className="text-[13px] text-ink-3">
              Guide:{' '}
              <span className="text-ink-2">{value.guide ? value.guide.name : 'Not assigned'}</span>
            </span>
          </>
        }
        actions={
          <div className="flex -space-x-1.5" aria-label="Team members">
            {orderedMembers.map((id) => (
              <span key={id} title={value.members[id]?.name} className="rounded-full ring-2 ring-canvas">
                <Avatar name={value.members[id]?.name ?? '?'} size={30} />
              </span>
            ))}
          </div>
        }
      />

      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-line" aria-label="Team sections">
        {tabs.map((t) => (
          <NavLink
            key={t.label}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              cn(
                '-mb-px shrink-0 border-b-2 px-3 py-2.5 text-[13.5px] font-medium transition-colors',
                isActive ? 'border-brand text-ink' : 'border-transparent text-ink-3 hover:text-ink',
              )
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

      <Outlet context={value} />
    </>
  )
}
