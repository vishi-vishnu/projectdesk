/**
 * Real-time data hooks for each part of the app. Each hook builds a Firestore
 * query and subscribes to it, so screens update as soon as data changes.
 */
import { useEffect, useMemo, useState } from 'react'
import { collectionGroup, limit, onSnapshot, orderBy, query, where, type Query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Activity, Announcement, Comment, Cycle, Submission, Team, UserProfile } from '@/lib/types'
import {
  activityCol,
  announcementsCol,
  commentsCol,
  cycleDoc,
  cyclesCol,
  submissionsCol,
  teamDoc,
  teamsCol,
  userDoc,
  usersCol,
  type CommentScope,
} from '@/services/refs'
import { useCollection, useDocument } from './useFirestore'

export function useActiveCycle() {
  const q = useMemo(() => query(cyclesCol(), where('isActive', '==', true)), [])
  const { data, loading, error } = useCollection<Cycle>(q, 'cycles:active')
  return { cycle: data[0] ?? null, loading, error }
}

export function useCycles(enabled = true) {
  const q = useMemo(() => (enabled ? query(cyclesCol(), orderBy('createdAt', 'desc')) : null), [enabled])
  return useCollection<Cycle>(q, enabled ? 'cycles:all' : null)
}

export function useCycle(id: string | null | undefined) {
  return useDocument<Cycle>(id ? cycleDoc(id) : null, id ? `cycle:${id}` : null)
}

export function useTeam(id: string | null | undefined) {
  return useDocument<Team>(id ? teamDoc(id) : null, id ? `team:${id}` : null)
}

export function useTeamsForCycle(cycleId: string | null | undefined) {
  const q = useMemo(() => (cycleId ? query(teamsCol(), where('cycleId', '==', cycleId)) : null), [cycleId])
  const result = useCollection<Team>(q, cycleId ? `teams:cycle:${cycleId}` : null)
  const sorted = useMemo(() => [...result.data].sort((a, b) => a.name.localeCompare(b.name)), [result.data])
  return { ...result, data: sorted }
}

export function useTeamsForGuide(guideId: string | null | undefined) {
  const q = useMemo(() => (guideId ? query(teamsCol(), where('guideId', '==', guideId)) : null), [guideId])
  const result = useCollection<Team>(q, guideId ? `teams:guide:${guideId}` : null)
  const sorted = useMemo(() => [...result.data].sort((a, b) => a.name.localeCompare(b.name)), [result.data])
  return { ...result, data: sorted }
}

export function useSubmissions(teamId: string | null | undefined) {
  const q = useMemo(() => (teamId ? query(submissionsCol(teamId), orderBy('createdAt', 'desc')) : null), [teamId])
  return useCollection<Submission>(q, teamId ? `subs:${teamId}` : null)
}

/** Coordinator-only: every submission in a cycle (collection-group query). */
export function useCycleSubmissions(cycleId: string | null | undefined) {
  const q = useMemo(
    () =>
      cycleId
        ? (query(collectionGroup(db, 'submissions'), where('cycleId', '==', cycleId)) as Query<Submission>)
        : null,
    [cycleId],
  )
  const withIds = useMemo(() => {
    if (!q) return null
    return q.withConverter<Submission>({
      toFirestore: (d) => d as never,
      fromFirestore: (snap, options) => ({ id: snap.id, ...snap.data(options) }) as Submission,
    })
  }, [q])
  return useCollection<Submission>(withIds, cycleId ? `subs:cycle:${cycleId}` : null)
}

/**
 * Submissions for several teams at once (faculty dashboards). One listener per
 * team, since a guide typically has fewer than ten teams.
 */
export function useSubmissionsForTeams(teamIds: string[]) {
  const key = [...teamIds].sort().join(',')
  const [state, setState] = useState<{ key: string; byTeam: Record<string, Submission[]>; loaded: Set<string> }>({
    key,
    byTeam: {},
    loaded: new Set(),
  })
  if (state.key !== key) setState({ key, byTeam: {}, loaded: new Set() })

  useEffect(() => {
    const ids = key ? key.split(',') : []
    const unsubs = ids.map((teamId) =>
      onSnapshot(query(submissionsCol(teamId), orderBy('createdAt', 'desc')), (snap) =>
        setState((prev) => {
          if (prev.key !== key) return prev
          const loaded = new Set(prev.loaded)
          loaded.add(teamId)
          return { ...prev, loaded, byTeam: { ...prev.byTeam, [teamId]: snap.docs.map((d) => d.data()) } }
        }),
      ),
    )
    return () => unsubs.forEach((u) => u())
  }, [key])

  const ids = key ? key.split(',') : []
  return { byTeam: state.byTeam, loading: ids.some((id) => !state.loaded.has(id)) }
}

export function useComments(scope: CommentScope | null) {
  const key = scope
    ? scope.kind === 'submission'
      ? `comments:${scope.teamId}:${scope.submissionId}`
      : `discussion:${scope.teamId}`
    : null
  // eslint-disable-next-line react-hooks/exhaustive-deps -- key identifies scope
  const q = useMemo(() => (scope ? query(commentsCol(scope), orderBy('createdAt', 'asc')) : null), [key])
  return useCollection<Comment>(q, key)
}

export function useActivity(teamId: string | null | undefined) {
  const q = useMemo(() => (teamId ? query(activityCol(teamId), orderBy('createdAt', 'desc')) : null), [teamId])
  return useCollection<Activity>(q, teamId ? `activity:${teamId}` : null)
}

export function useUsersByRole(role: UserProfile['role'], enabled = true) {
  const q = useMemo(() => (enabled ? query(usersCol(), where('role', '==', role)) : null), [role, enabled])
  const result = useCollection<UserProfile>(q, enabled ? `users:${role}` : null)
  const sorted = useMemo(() => [...result.data].sort((a, b) => a.name.localeCompare(b.name)), [result.data])
  return { ...result, data: sorted }
}

/** Live profiles for a set of user ids (team members, guides). */
export function useProfiles(ids: (string | null | undefined)[]) {
  const key = [...new Set(ids.filter((x): x is string => Boolean(x)))].sort().join(',')
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({})

  useEffect(() => {
    if (!key) return
    const unsubs = key.split(',').map((uid) =>
      onSnapshot(userDoc(uid), (snap) => {
        const data = snap.data()
        if (data) setProfiles((prev) => ({ ...prev, [uid]: data }))
      }),
    )
    return () => unsubs.forEach((u) => u())
  }, [key])

  return profiles
}

/** Active faculty, readable by every signed-in user (students pick a preferred guide). */
export function useActiveFaculty(enabled = true) {
  const q = useMemo(
    () => (enabled ? query(usersCol(), where('role', '==', 'faculty'), where('status', '==', 'active')) : null),
    [enabled],
  )
  const result = useCollection<UserProfile>(q, enabled ? 'users:faculty:active' : null)
  const sorted = useMemo(() => [...result.data].sort((a, b) => a.name.localeCompare(b.name)), [result.data])
  return { ...result, data: sorted }
}

export function useAnnouncements() {
  const q = useMemo(() => query(announcementsCol(), orderBy('createdAt', 'desc'), limit(20)), [])
  return useCollection<Announcement>(q, 'announcements')
}

/** Recent activity for several teams (the notification bell). */
export function useActivityForTeams(teamIds: string[], perTeam = 15) {
  const key = [...teamIds].sort().join(',')
  const [state, setState] = useState<{ key: string; byTeam: Record<string, Activity[]> }>({ key, byTeam: {} })
  if (state.key !== key) setState({ key, byTeam: {} })

  useEffect(() => {
    const ids = key ? key.split(',') : []
    const unsubs = ids.map((teamId) =>
      onSnapshot(query(activityCol(teamId), orderBy('createdAt', 'desc'), limit(perTeam)), (snap) =>
        setState((prev) =>
          prev.key !== key ? prev : { ...prev, byTeam: { ...prev.byTeam, [teamId]: snap.docs.map((d) => d.data()) } },
        ),
      ),
    )
    return () => unsubs.forEach((u) => u())
  }, [key, perTeam])

  return state.byTeam
}
