import { collection, doc, type CollectionReference, type DocumentData, type QueryDocumentSnapshot, type SnapshotOptions } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Activity, Announcement, Comment, Cycle, Submission, Team, UserProfile } from '@/lib/types'

/** Adds the document id to the data so components never juggle snapshots. */
function converter<T extends { id?: string }>() {
  return {
    toFirestore: (data: T): DocumentData => {
      const rest: Record<string, unknown> = { ...data }
      delete rest.id
      return rest
    },
    fromFirestore: (snap: QueryDocumentSnapshot, options: SnapshotOptions): T =>
      ({ id: snap.id, ...snap.data(options) }) as unknown as T,
  }
}

const userConverter = {
  toFirestore: (data: UserProfile): DocumentData => data as unknown as DocumentData,
  fromFirestore: (snap: QueryDocumentSnapshot, options: SnapshotOptions): UserProfile =>
    ({ uid: snap.id, ...snap.data(options) }) as UserProfile,
}

export const usersCol = () => collection(db, 'users').withConverter(userConverter)
export const userDoc = (uid: string) => doc(db, 'users', uid).withConverter(userConverter)

export const cyclesCol = () => collection(db, 'cycles').withConverter(converter<Cycle>())
export const cycleDoc = (id: string) => doc(db, 'cycles', id).withConverter(converter<Cycle>())

export const teamsCol = () => collection(db, 'teams').withConverter(converter<Team>())
export const teamDoc = (id: string) => doc(db, 'teams', id).withConverter(converter<Team>())

export const joinCodeDoc = (code: string) => doc(db, 'joinCodes', code)

export const submissionsCol = (teamId: string) =>
  collection(db, 'teams', teamId, 'submissions').withConverter(converter<Submission>())
export const submissionDoc = (teamId: string, id: string) =>
  doc(db, 'teams', teamId, 'submissions', id).withConverter(converter<Submission>())

export type CommentScope =
  | { kind: 'submission'; teamId: string; submissionId: string }
  | { kind: 'discussion'; teamId: string }

export const commentsCol = (scope: CommentScope): CollectionReference<Comment> =>
  (scope.kind === 'submission'
    ? collection(db, 'teams', scope.teamId, 'submissions', scope.submissionId, 'comments')
    : collection(db, 'teams', scope.teamId, 'discussion')
  ).withConverter(converter<Comment>())

export const activityCol = (teamId: string) =>
  collection(db, 'teams', teamId, 'activity').withConverter(converter<Activity>())

export const announcementsCol = () => collection(db, 'announcements').withConverter(converter<Announcement>())
