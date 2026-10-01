/**
 * Team home: progress tracker, review stages with marks, members (with the
 * join code), the assigned guide and recent activity.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlarmClock, ArrowRight, Copy, Crown, LogOut, MoreHorizontal, UserMinus } from 'lucide-react'
import { toast } from 'sonner'
import { ActivityFeed } from '@/components/domain/ActivityFeed'
import { AnnouncementsCard } from '@/components/domain/AnnouncementsCard'
import { ReviewStepper } from '@/components/domain/ReviewStepper'
import { StageBadge } from '@/components/domain/StatusBadge'
import { Avatar, Badge, Button, Card, CardBody, CardHeader, Menu, MenuContent, MenuItem, MenuTrigger, Notice, ProgressBar } from '@/components/ui'
import { useActivity } from '@/hooks/data'
import { dueLabel, formatDate } from '@/lib/format'
import { stageState, teamProgress } from '@/lib/progress'
import { removeMember } from '@/services/teams'
import { errorMessage } from '@/pages/auth/errors'
import { useTeamContext } from './TeamContext'

export function TeamOverview() {
  const { team, cycle, submissions, latest, members, guide, viewer, perms } = useTeamContext()
  const { data: activity, loading: activityLoading } = useActivity(team.id)
  const progress = teamProgress(team, cycle, submissions)
  const [busy, setBusy] = useState(false)
  const actor = { uid: viewer.uid, name: viewer.name }

  const copyCode = async () => {
    await navigator.clipboard.writeText(team.joinCode)
    toast.success('Join code copied')
  }

  const remove = async (memberId: string) => {
    const name = members[memberId]?.name ?? 'this member'
    const self = memberId === viewer.uid
    if (!window.confirm(self ? 'Leave this team? You can join another team afterwards.' : `Remove ${name} from the team?`)) return
    setBusy(true)
    try {
      await removeMember(team, memberId, name, actor)
      toast.success(self ? 'You left the team' : `${name} was removed`)
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  // The next stage the team has to act on: nothing submitted yet, or sent back.
  const next =
    cycle.reviews.find((r) => {
      const sub = latest.get(r.id)
      return !sub || sub.status === 'changes_requested'
    }) ?? null
  const nextState = next ? stageState(next, latest.get(next.id)) : null
  const orderedMembers = [...team.memberIds].sort((a, b) => (a === team.leadId ? -1 : b === team.leadId ? 1 : 0))

  // Only nag when the team can actually upload (topic approved) and it is close.
  const urgent =
    perms.isMember && team.proposalStatus === 'approved' && next && (nextState === 'overdue' || nextState === 'due_soon')

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        {urgent && next && (
          <Notice tone={nextState === 'overdue' ? 'bad' : 'warn'} icon={<AlarmClock />}>
            <strong className="font-semibold">
              {next.title.split(':')[0]} is {nextState === 'overdue' ? dueLabel(next.dueDate).toLowerCase() : dueLabel(next.dueDate).replace('Due', 'due')}.
            </strong>{' '}
            {nextState === 'overdue'
              ? 'Upload your files as soon as you can. Late uploads are marked as late for your guide.'
              : `Upload your files before ${formatDate(next.dueDate, 'EEEE, d MMM')}.`}{' '}
            <Link to={`reviews/${next.id}`} className="font-medium text-brand hover:underline">
              Open stage
            </Link>
          </Notice>
        )}
        {perms.isMember && team.proposalStatus !== 'approved' && (
          <Notice tone={team.proposalStatus === 'changes_requested' ? 'warn' : 'brand'}>
            {team.proposalStatus === 'draft' && (
              <>
                <strong className="font-semibold">Next step: submit your project proposal.</strong>{' '}
                {perms.isLead ? 'Add the title and abstract, then send it to your guide.' : 'Your team lead submits it.'}{' '}
                <Link to="proposal" className="font-medium text-brand hover:underline">
                  Open proposal
                </Link>
              </>
            )}
            {team.proposalStatus === 'submitted' &&
              'Your proposal is with the guide for approval. Review submissions open once the topic is approved.'}
            {team.proposalStatus === 'changes_requested' && (
              <>
                <strong className="font-semibold">The guide asked for changes to the proposal.</strong>{' '}
                <Link to="proposal" className="font-medium text-brand hover:underline">
                  See remarks
                </Link>
              </>
            )}
          </Notice>
        )}

        <Card>
          <CardHeader
            title="Progress"
            description={`${progress.accepted} of ${progress.total} reviews accepted`}
            actions={<span className="tabular text-[13px] font-medium text-ink-2">{progress.percent}%</span>}
          />
          <CardBody className="space-y-6">
            <ProgressBar value={progress.percent} />
            <div className="overflow-x-auto pb-1">
              <div className="min-w-[460px]">
                <ReviewStepper proposalStatus={team.proposalStatus} cycle={cycle} latest={latest} />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Review stages"
            actions={
              <Link to="reviews" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline">
                All reviews <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[13.5px]">
              <thead className="border-b border-line text-[12px] text-ink-3">
                <tr>
                  <th className="px-5 py-2 font-medium">Stage</th>
                  <th className="px-3 py-2 font-medium">Due</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 text-right font-medium">Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {cycle.reviews.map((r) => {
                  const sub = latest.get(r.id)
                  return (
                    <tr key={r.id} className="hover:bg-subtle/60">
                      <td className="px-5 py-2.5">
                        <Link to={`reviews/${r.id}`} className="font-medium text-ink hover:text-brand hover:underline">
                          {r.title}
                        </Link>
                      </td>
                      <td className="tabular px-3 py-2.5 whitespace-nowrap text-ink-2">{formatDate(r.dueDate)}</td>
                      <td className="px-3 py-2.5">
                        <StageBadge state={stageState(r, sub)} />
                      </td>
                      <td className="tabular px-5 py-2.5 text-right text-ink-2">
                        {sub?.evaluation ? `${sub.evaluation.marks} / ${r.maxMarks}` : `- / ${r.maxMarks}`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="border-t border-line">
                <tr>
                  <td colSpan={3} className="px-5 py-2.5 text-[13px] font-medium text-ink-2">
                    Total
                  </td>
                  <td className="tabular px-5 py-2.5 text-right font-semibold">
                    {progress.marks} / {progress.maxMarks}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent activity" actions={<Link to="activity" className="text-[13px] font-medium text-brand hover:underline">View all</Link>} />
          <CardBody>
            <ActivityFeed items={activity} loading={activityLoading} limit={6} />
          </CardBody>
        </Card>
      </div>

      <div className="space-y-6">
        {viewer.role === 'student' && <AnnouncementsCard limit={3} />}
        {next && (
          <Card>
            <CardBody>
              <p className="text-[12px] font-medium tracking-wide text-ink-3 uppercase">Up next</p>
              <p className="mt-1.5 font-medium text-ink">{next.title}</p>
              <p className="mt-1 text-[13px] text-ink-3">
                {formatDate(next.dueDate, 'EEEE, d MMMM')} ·{' '}
                {nextState === 'changes_requested' ? (
                  <span className="text-warn">Changes requested, please resubmit</span>
                ) : (
                  <span className={nextState === 'overdue' ? 'text-bad' : ''}>{dueLabel(next.dueDate)}</span>
                )}
              </p>
              <Link to={`reviews/${next.id}`} className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline">
                Open stage <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader title="Members" description={`${team.memberIds.length} of ${cycle.maxTeamSize}`} />
          <ul className="divide-y divide-line">
            {orderedMembers.map((id) => {
              const m = members[id]
              const lead = id === team.leadId
              const canRemove = !lead && (perms.isLead || id === viewer.uid)
              return (
                <li key={id} className="flex items-center gap-3 px-5 py-2.5">
                  <Avatar name={m?.name ?? '?'} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-[13.5px] font-medium">
                      {m?.name ?? 'Loading…'}
                      {lead && <Crown className="size-3.5 text-warn" aria-label="Team lead" />}
                    </p>
                    <p className="truncate font-mono text-[12px] text-ink-3">{m?.regNo || m?.email}</p>
                  </div>
                  {canRemove && (
                    <Menu>
                      <MenuTrigger className="rounded-md p-1.5 text-ink-3 hover:bg-subtle" aria-label="Member options" disabled={busy}>
                        <MoreHorizontal className="size-4" />
                      </MenuTrigger>
                      <MenuContent>
                        {id === viewer.uid ? (
                          <MenuItem icon={<LogOut />} danger onSelect={() => remove(id)}>
                            Leave team
                          </MenuItem>
                        ) : (
                          <MenuItem icon={<UserMinus />} danger onSelect={() => remove(id)}>
                            Remove from team
                          </MenuItem>
                        )}
                      </MenuContent>
                    </Menu>
                  )}
                </li>
              )
            })}
          </ul>
          {perms.isMember && team.memberIds.length < cycle.maxTeamSize && (
            <div className="border-t border-line bg-subtle/60 px-5 py-3">
              <p className="text-[12px] text-ink-3">Share this code so classmates can join</p>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="font-mono text-[18px] font-semibold tracking-[0.2em] text-ink">{team.joinCode}</span>
                <Button size="sm" icon={<Copy className="size-3.5" />} onClick={copyCode}>
                  Copy
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Project guide" />
          <CardBody>
            {guide ? (
              <div className="flex items-center gap-3">
                <Avatar name={guide.name} size={36} />
                <div className="min-w-0">
                  <p className="font-medium">{guide.name}</p>
                  <p className="truncate text-[12.5px] text-ink-3">{guide.designation || guide.department}</p>
                  <a href={`mailto:${guide.email}`} className="text-[12.5px] text-brand hover:underline">
                    {guide.email}
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-ink-3">
                The project coordinator hasn't assigned a guide yet.{' '}
                {viewer.role === 'coordinator' && <Badge tone="warn">Assign from the Teams page</Badge>}
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
