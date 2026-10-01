import { describe, expect, it } from 'vitest'
import type { Activity, Announcement } from './types'
import { announcementVisibleTo, buildNotifications, countUnread } from './notifications'

const at = (iso: string) => ({ toDate: () => new Date(iso) }) as unknown as Announcement['createdAt']

const ann = (id: string, audience: Announcement['audience'], iso: string): Announcement => ({
  id,
  title: `Notice ${id}`,
  body: 'Body',
  audience,
  authorId: 'coord',
  authorName: 'Coordinator',
  createdAt: at(iso),
})

const act = (id: string, actorId: string, iso: string): Activity => ({
  id,
  type: 'submission_created',
  actorId,
  actorName: actorId,
  message: `${actorId} did ${id}`,
  createdAt: at(iso),
})

describe('announcementVisibleTo', () => {
  it('shows each audience to the right roles', () => {
    expect(announcementVisibleTo({ audience: 'students' }, 'faculty')).toBe(false)
    expect(announcementVisibleTo({ audience: 'students' }, 'student')).toBe(true)
    expect(announcementVisibleTo({ audience: 'faculty' }, 'student')).toBe(false)
    expect(announcementVisibleTo({ audience: 'all' }, 'student')).toBe(true)
    expect(announcementVisibleTo({ audience: 'faculty' }, 'coordinator')).toBe(true)
  })
})

describe('buildNotifications', () => {
  const viewer = { uid: 'me', role: 'student' as const, teamId: 't1' }

  it('merges announcements and team activity, newest first, without my own actions', () => {
    const items = buildNotifications({
      viewer,
      announcements: [ann('a1', 'students', '2026-03-01'), ann('a2', 'faculty', '2026-03-05')],
      activityByTeam: { t1: [act('x', 'friend', '2026-03-03'), act('y', 'me', '2026-03-04')] },
    })
    expect(items.map((i) => i.id)).toEqual(['act:t1:x', 'ann:a1'])
    expect(items[0].to).toBe('/teams/t1/activity')
    expect(items[1].to).toBe('/teams/t1')
  })

  it('pins pending approvals on top for the coordinator', () => {
    const items = buildNotifications({
      viewer: { uid: 'coord-2', role: 'coordinator', teamId: null },
      announcements: [ann('a1', 'all', '2026-03-01')],
      activityByTeam: {},
      pendingFaculty: 2,
    })
    expect(items[0]).toMatchObject({ kind: 'approval', to: '/people' })
    expect(items[0].title).toContain('2 faculty accounts')
  })

  it('counts only items newer than the last visit', () => {
    const items = buildNotifications({
      viewer,
      announcements: [ann('old', 'all', '2026-03-01'), ann('new', 'all', '2026-03-10')],
      activityByTeam: {},
    })
    expect(countUnread(items, new Date('2026-03-05').getTime())).toBe(1)
  })
})
