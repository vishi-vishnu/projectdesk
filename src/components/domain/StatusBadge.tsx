import { Badge, type Tone } from '@/components/ui'
import { stageStateLabel, type StageState } from '@/lib/progress'
import type { AccountStatus, ProposalStatus } from '@/lib/types'

const stageTone: Record<StageState, Tone> = {
  upcoming: 'neutral',
  due_soon: 'warn',
  overdue: 'bad',
  submitted: 'brand',
  changes_requested: 'warn',
  accepted: 'ok',
}

export function StageBadge({ state }: { state: StageState }) {
  return (
    <Badge tone={stageTone[state]} dot>
      {stageStateLabel(state)}
    </Badge>
  )
}

const proposal: Record<ProposalStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  submitted: { label: 'Pending approval', tone: 'brand' },
  approved: { label: 'Approved', tone: 'ok' },
  changes_requested: { label: 'Changes requested', tone: 'warn' },
}

export function ProposalBadge({ status }: { status: ProposalStatus }) {
  const s = proposal[status]
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  )
}

const account: Record<AccountStatus, { label: string; tone: Tone }> = {
  active: { label: 'Active', tone: 'ok' },
  pending: { label: 'Pending approval', tone: 'warn' },
  rejected: { label: 'Rejected', tone: 'bad' },
}

export function AccountBadge({ status }: { status: AccountStatus }) {
  const s = account[status]
  return <Badge tone={s.tone}>{s.label}</Badge>
}
