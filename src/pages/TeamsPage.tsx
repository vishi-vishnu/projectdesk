/**
 * Teams list. Coordinators see every team in the active cycle, can assign a
 * guide and export marks to CSV. Faculty see only the teams they guide.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, FolderKanban, Search } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProposalBadge } from '@/components/domain/StatusBadge'
import { Button, Card, EmptyState, Input, ProgressBar, Select, Skeleton } from '@/components/ui'
import { useProfile } from '@/context/auth-context'
import {
  useActiveCycle,
  useCycleSubmissions,
  useSubmissionsForTeams,
  useTeamsForCycle,
  useTeamsForGuide,
  useUsersByRole,
} from '@/hooks/data'
import { downloadCsv } from '@/lib/csv'
import { teamProgress } from '@/lib/progress'
import type { Cycle, ProposalStatus, Submission, Team, UserProfile } from '@/lib/types'
import { assignGuide } from '@/services/teams'
import { errorMessage } from '@/pages/auth/errors'

function groupByTeam(subs: Submission[]) {
  const map: Record<string, Submission[]> = {}
  for (const s of subs) (map[s.teamId] ??= []).push(s)
  return map
}

function GuideSelect({ team, faculty }: { team: Team; faculty: UserProfile[] }) {
  const profile = useProfile()
  const [saving, setSaving] = useState(false)
  const change = async (guideId: string) => {
    const guide = faculty.find((f) => f.uid === guideId) ?? null
    setSaving(true)
    try {
      await assignGuide(team, guide ? { uid: guide.uid, name: guide.name } : null, { uid: profile.uid, name: profile.name })
      toast.success(guide ? `${guide.name} assigned to ${team.name}` : `Guide removed from ${team.name}`)
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }
  return (
    <Select
      value={team.guideId ?? ''}
      onChange={(e) => change(e.target.value)}
      disabled={saving}
      aria-label={`Guide for ${team.name}`}
      className={team.guideId ? 'h-8 text-[13px]' : 'h-8 border-warn-line bg-warn-soft text-[13px]'}
    >
      <option value="">Unassigned</option>
      {faculty.map((f) => (
        <option key={f.uid} value={f.uid}>
          {f.name}
        </option>
      ))}
    </Select>
  )
}

function TeamsTable({
  teams,
  cycle,
  byTeam,
  faculty,
  students,
  manage,
}: {
  teams: Team[]
  cycle: Cycle
  byTeam: Record<string, Submission[]>
  faculty: UserProfile[]
  students: Record<string, UserProfile>
  manage: boolean
}) {
  const facultyById = Object.fromEntries(faculty.map((f) => [f.uid, f]))
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-[13.5px]">
        <thead className="border-b border-line text-[12px] text-ink-3">
          <tr>
            <th className="px-5 py-2 font-medium">Project</th>
            <th className="px-3 py-2 font-medium">Members</th>
            <th className="px-3 py-2 font-medium">Topic</th>
            <th className="w-[200px] px-3 py-2 font-medium">Guide</th>
            <th className="w-[140px] px-3 py-2 font-medium">Progress</th>
            <th className="px-5 py-2 text-right font-medium">Marks</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {teams.map((t) => {
            const p = teamProgress(t, cycle, byTeam[t.id] ?? [])
            const lead = students[t.leadId]
            return (
              <tr key={t.id} className="hover:bg-subtle/60">
                <td className="max-w-[320px] px-5 py-3">
                  <Link to={`/teams/${t.id}`} className="block truncate font-medium hover:text-brand hover:underline">
                    {t.project.title || 'Untitled project'}
                  </Link>
                  <p className="truncate text-[12.5px] text-ink-3">
                    {t.name}
                    {lead && ` · lead: ${lead.name}`}
                  </p>
                </td>
                <td className="tabular px-3 py-3 text-ink-2">
                  {t.memberIds.length}/{cycle.maxTeamSize}
                </td>
                <td className="px-3 py-3">
                  <ProposalBadge status={t.proposalStatus} />
                </td>
                <td className="px-3 py-3">
                  {manage ? (
                    <GuideSelect team={t} faculty={faculty} />
                  ) : (
                    <span className="text-ink-2">{t.guideId ? (facultyById[t.guideId]?.name ?? '-') : 'Unassigned'}</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={p.percent} />
                    <span className="tabular w-9 text-right text-[12px] text-ink-3">{p.percent}%</span>
                  </div>
                </td>
                <td className="tabular px-5 py-3 text-right text-ink-2">
                  {p.marks}/{p.maxMarks}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function TeamsPage() {
  const profile = useProfile()
  const isCoordinator = profile.role === 'coordinator'
  const { cycle, loading: cycleLoading } = useActiveCycle()

  const cycleTeams = useTeamsForCycle(isCoordinator ? cycle?.id : null)
  const guideTeams = useTeamsForGuide(isCoordinator ? null : profile.uid)
  const teamsResult = isCoordinator ? cycleTeams : guideTeams
  const teams = useMemo(() => teamsResult.data.filter((t) => t.cycleId === cycle?.id), [teamsResult.data, cycle?.id])

  const cycleSubs = useCycleSubmissions(isCoordinator ? cycle?.id : null)
  const guideSubs = useSubmissionsForTeams(isCoordinator ? [] : teams.map((t) => t.id))
  const byTeam = useMemo(
    () => (isCoordinator ? groupByTeam(cycleSubs.data) : guideSubs.byTeam),
    [isCoordinator, cycleSubs.data, guideSubs.byTeam],
  )

  const { data: faculty } = useUsersByRole('faculty', isCoordinator)
  const { data: studentList } = useUsersByRole('student', isCoordinator)
  const activeFaculty = faculty.filter((f) => f.status === 'active')
  const students = useMemo(() => Object.fromEntries(studentList.map((s) => [s.uid, s])), [studentList])

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'' | ProposalStatus | 'unassigned'>('')

  const filtered = teams.filter((t) => {
    const q = search.trim().toLowerCase()
    if (q && !`${t.name} ${t.project.title} ${t.project.domain}`.toLowerCase().includes(q)) return false
    if (status === 'unassigned') return !t.guideId
    if (status) return t.proposalStatus === status
    return true
  })

  const exportCsv = () => {
    if (!cycle) return
    const facultyById = Object.fromEntries(faculty.map((f) => [f.uid, f.name]))
    const rows = teams.map((t) => {
      const p = teamProgress(t, cycle, byTeam[t.id] ?? [])
      const latest = new Map((byTeam[t.id] ?? []).sort((a, b) => a.version - b.version).map((s) => [s.reviewId, s]))
      return {
        Team: t.name,
        'Project title': t.project.title,
        Domain: t.project.domain,
        Members: t.memberIds.map((id) => students[id]?.name ?? id).join('; '),
        'Register numbers': t.memberIds.map((id) => students[id]?.regNo ?? '').join('; '),
        Guide: t.guideId ? (facultyById[t.guideId] ?? '') : '',
        'Topic status': t.proposalStatus,
        ...Object.fromEntries(
          cycle.reviews.map((r, i) => {
            const s = latest.get(r.id)
            return [`Review ${i + 1}`, s ? (s.evaluation ? `${s.evaluation.marks}/${r.maxMarks}` : s.status) : '']
          }),
        ),
        Total: `${p.marks}/${p.maxMarks}`,
      }
    })
    downloadCsv(`${cycle.name.replace(/\W+/g, '-').toLowerCase()}-teams.csv`, rows)
  }

  const loading = cycleLoading || teamsResult.loading

  return (
    <>
      <PageHeader
        title={isCoordinator ? 'Teams' : 'My teams'}
        description={
          isCoordinator
            ? 'Every registered team in the active cycle. Assign a guide from the Guide column.'
            : 'Teams you guide in the active cycle.'
        }
        actions={
          isCoordinator && (
            <Button icon={<Download className="size-4" />} onClick={exportCsv} disabled={!teams.length}>
              Export CSV
            </Button>
          )
        }
      />

      {isCoordinator && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:max-w-xs sm:flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams or projects"
              className="pl-9"
              aria-label="Search teams"
            />
          </div>
          <div className="sm:w-56">
            <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Filter teams">
              <option value="">All teams ({teams.length})</option>
              <option value="unassigned">Without a guide ({teams.filter((t) => !t.guideId).length})</option>
              <option value="submitted">Topic pending approval</option>
              <option value="approved">Topic approved</option>
              <option value="changes_requested">Topic changes requested</option>
              <option value="draft">Topic in draft</option>
            </Select>
          </div>
        </div>
      )}

      <Card>
        {loading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : !cycle ? (
          <EmptyState icon={<FolderKanban />} title="No active cycle" description="Create a project cycle from the Review schedule page." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FolderKanban />}
            title={teams.length ? 'No teams match your filters' : 'No teams yet'}
            description={
              teams.length
                ? undefined
                : isCoordinator
                  ? 'Teams appear here as students register and create them.'
                  : 'The project coordinator assigns teams to guides.'
            }
          />
        ) : (
          <TeamsTable
            teams={filtered}
            cycle={cycle}
            byTeam={byTeam}
            faculty={isCoordinator ? activeFaculty : [profile]}
            students={students}
            manage={isCoordinator}
          />
        )}
      </Card>
    </>
  )
}
