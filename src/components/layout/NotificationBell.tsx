import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { Bell, Megaphone, UserCheck, Activity as ActivityIcon } from 'lucide-react'
import { cn } from '@/components/ui'
import { useProfile } from '@/context/auth-context'
import { useActivityForTeams, useAnnouncements, useTeamsForGuide, useUsersByRole } from '@/hooks/data'
import { timeAgo } from '@/lib/format'
import { buildNotifications, countUnread, type NotificationItem } from '@/lib/notifications'

const seenKey = (uid: string) => `pd-notifications-seen:${uid}`

function readSeen(uid: string): number {
  try {
    return Number(localStorage.getItem(seenKey(uid))) || 0
  } catch {
    return 0
  }
}

const icons: Record<NotificationItem['kind'], typeof Bell> = {
  announcement: Megaphone,
  activity: ActivityIcon,
  approval: UserCheck,
}

export function NotificationBell({ className }: { className?: string }) {
  const viewer = useProfile()
  const navigate = useNavigate()
  const [lastSeen, setLastSeen] = useState(() => readSeen(viewer.uid))

  const { data: announcements } = useAnnouncements()
  const { data: guidedTeams } = useTeamsForGuide(viewer.role === 'faculty' ? viewer.uid : null)
  const { data: faculty } = useUsersByRole('faculty', viewer.role === 'coordinator')

  const teamIds = useMemo(() => {
    if (viewer.role === 'student') return viewer.teamId ? [viewer.teamId] : []
    if (viewer.role === 'faculty') return guidedTeams.map((t) => t.id)
    return []
  }, [viewer.role, viewer.teamId, guidedTeams])
  const activityByTeam = useActivityForTeams(teamIds, 10)

  const items = useMemo(
    () =>
      buildNotifications({
        viewer,
        announcements,
        activityByTeam,
        teamNames: Object.fromEntries(guidedTeams.map((t) => [t.id, t.name])),
        pendingFaculty: faculty.filter((f) => f.status === 'pending').length,
      }),
    [viewer, announcements, activityByTeam, guidedTeams, faculty],
  )
  const unread = countUnread(items, lastSeen)

  const markSeen = () => {
    const now = Date.now()
    setLastSeen(now)
    try {
      localStorage.setItem(seenKey(viewer.uid), String(now))
    } catch {
      // Private mode: the badge simply resets on reload.
    }
  }

  return (
    <Dropdown.Root onOpenChange={(open) => !open && markSeen()}>
      <Dropdown.Trigger
        className={cn('relative rounded-md p-2 text-ink-2 hover:bg-muted/70 hover:text-ink', className)}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      >
        <Bell className="size-[18px]" aria-hidden />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-bad px-1 text-[10px] leading-4 font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={6}
          className="z-50 w-[min(360px,calc(100vw-24px))] rounded-lg border border-line bg-surface shadow-pop animate-pop-in"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <p className="text-[13.5px] font-semibold">Notifications</p>
            {unread > 0 && <span className="text-[12px] text-ink-3">{unread} new</span>}
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-1">
            {items.length === 0 ? (
              <p className="px-3 py-8 text-center text-[13px] text-ink-3">You're all caught up.</p>
            ) : (
              items.map((item) => {
                const Icon = icons[item.kind]
                const isNew = item.kind === 'approval' || !item.at || item.at.getTime() > lastSeen
                return (
                  <Dropdown.Item
                    key={item.id}
                    onSelect={() => navigate(item.to)}
                    className="flex cursor-pointer gap-3 rounded-md px-3 py-2.5 outline-none data-[highlighted]:bg-subtle"
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full',
                        item.kind === 'announcement'
                          ? 'bg-brand-soft text-brand'
                          : item.kind === 'approval'
                            ? 'bg-warn-soft text-warn'
                            : 'bg-subtle text-ink-3',
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block text-[13px] leading-snug', isNew ? 'font-medium text-ink' : 'text-ink-2')}>
                        {item.title}
                      </span>
                      {item.body && <span className="mt-0.5 line-clamp-2 block text-[12.5px] text-ink-3">{item.body}</span>}
                      {item.at && <span className="mt-0.5 block text-[11.5px] text-ink-3">{timeAgo(item.at)}</span>}
                    </span>
                    {isNew && <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-label="New" />}
                  </Dropdown.Item>
                )
              })
            )}
          </div>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  )
}
