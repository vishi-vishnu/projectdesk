import { Activity as ActivityIcon, CheckCheck, FileUp, Flag, UserMinus, UserPlus, Users } from 'lucide-react'
import { EmptyState, Skeleton } from '@/components/ui'
import { formatDateTime, timeAgo } from '@/lib/format'
import type { Activity, ActivityType } from '@/lib/types'

const icons: Record<ActivityType, typeof FileUp> = {
  team_created: Users,
  member_joined: UserPlus,
  member_left: UserMinus,
  proposal_submitted: Flag,
  proposal_reviewed: CheckCheck,
  submission_created: FileUp,
  submission_evaluated: CheckCheck,
  guide_assigned: UserPlus,
}

export function ActivityFeed({ items, loading, limit }: { items: Activity[]; loading?: boolean; limit?: number }) {
  if (loading)
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
      </div>
    )
  if (items.length === 0) return <EmptyState icon={<ActivityIcon />} title="No activity yet" className="py-6" />

  const shown = limit ? items.slice(0, limit) : items
  return (
    <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[13px] before:w-px before:bg-line">
      {shown.map((a) => {
        const Icon = icons[a.type] ?? ActivityIcon
        return (
          <li key={a.id} className="relative flex gap-3">
            <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-3">
              <Icon className="size-3.5" aria-hidden />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-[13.5px] text-ink-2">{a.message}</p>
              <time className="text-[12px] text-ink-3" title={formatDateTime(a.createdAt)}>
                {timeAgo(a.createdAt)}
              </time>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
