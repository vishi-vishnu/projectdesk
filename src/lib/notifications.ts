/**
 * Builds the list shown under the bell icon. Kept free of React and Firebase
 * so it is easy to unit test.
 */
import type { Activity, Announcement, Role, UserProfile } from './types'
import { toDate } from './format'

export interface NotificationItem {
  id: string
  kind: 'announcement' | 'activity' | 'approval'
  title: string
  body?: string
  at: Date | null
  to: string
}

export function announcementVisibleTo(a: Pick<Announcement, 'audience'>, role: Role): boolean {
  if (a.audience === 'all') return true
  if (a.audience === 'students') return role === 'student' || role === 'coordinator'
  return role === 'faculty' || role === 'coordinator'
}

export function buildNotifications(input: {
  viewer: Pick<UserProfile, 'uid' | 'role' | 'teamId'>
  announcements: Announcement[]
  activityByTeam: Record<string, Activity[]>
  teamNames?: Record<string, string>
  pendingFaculty?: number
  max?: number
}): NotificationItem[] {
  const { viewer, announcements, activityByTeam, teamNames = {}, pendingFaculty = 0, max = 20 } = input
  const home = viewer.role === 'student' && viewer.teamId ? `/teams/${viewer.teamId}` : '/dashboard'
  const items: NotificationItem[] = []

  for (const a of announcements) {
    if (!announcementVisibleTo(a, viewer.role) || a.authorId === viewer.uid) continue
    items.push({ id: `ann:${a.id}`, kind: 'announcement', title: a.title, body: a.body, at: toDate(a.createdAt), to: home })
  }

  for (const [teamId, list] of Object.entries(activityByTeam)) {
    for (const act of list) {
      if (act.actorId === viewer.uid) continue
      const team = teamNames[teamId]
      items.push({
        id: `act:${teamId}:${act.id}`,
        kind: 'activity',
        title: act.message,
        body: viewer.role === 'student' ? undefined : team,
        at: toDate(act.createdAt),
        to: `/teams/${teamId}/activity`,
      })
    }
  }

  items.sort((a, b) => (b.at?.getTime() ?? Date.now()) - (a.at?.getTime() ?? Date.now()))
  const trimmed = items.slice(0, max)

  // Pending approvals are a standing task, not an event, so they stay on top.
  if (pendingFaculty > 0) {
    trimmed.unshift({
      id: 'approval:faculty',
      kind: 'approval',
      title: `${pendingFaculty} faculty ${pendingFaculty === 1 ? 'account is' : 'accounts are'} waiting for approval`,
      at: null,
      to: '/people',
    })
  }
  return trimmed
}

export function countUnread(items: NotificationItem[], lastSeen: number): number {
  return items.filter((i) => i.kind === 'approval' || (i.at ? i.at.getTime() > lastSeen : true)).length
}
