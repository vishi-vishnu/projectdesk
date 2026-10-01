import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { FileRef, ReviewStage, Role, SubmissionStatus, Team } from '@/lib/types'
import { logActivity, type Actor } from './activity'
import type { CommentScope } from './refs'
import { stageShortName } from '@/lib/progress'

/** Reserve an id up front so uploaded files can live under the submission's path. */
export function newSubmissionId(teamId: string) {
  return doc(collection(db, 'teams', teamId, 'submissions')).id
}

export async function createSubmission(
  params: {
    id: string
    team: Team
    stage: ReviewStage
    version: number
    title: string
    notes: string
    files: FileRef[]
  },
  actor: Actor,
) {
  const { id, team, stage, version, title, notes, files } = params
  const batch = writeBatch(db)
  batch.set(doc(db, 'teams', team.id, 'submissions', id), {
    teamId: team.id,
    cycleId: team.cycleId,
    reviewId: stage.id,
    version,
    title: title.trim(),
    notes: notes.trim(),
    files,
    submittedBy: actor.uid,
    submittedByName: actor.name,
    status: 'submitted',
    evaluation: null,
    createdAt: serverTimestamp(),
  })
  const label = version > 1 ? `resubmitted ${stageShortName(stage.title)} (v${version})` : `submitted ${stageShortName(stage.title)}`
  logActivity(batch, team.id, 'submission_created', actor, `${actor.name} ${label}`)
  await batch.commit()
}

export async function evaluateSubmission(
  params: {
    teamId: string
    submissionId: string
    stage: ReviewStage
    status: Exclude<SubmissionStatus, 'submitted'>
    marks: number
    remarks: string
  },
  actor: Actor,
) {
  const { teamId, submissionId, stage, status, marks, remarks } = params
  const batch = writeBatch(db)
  batch.update(doc(db, 'teams', teamId, 'submissions', submissionId), {
    status,
    evaluation: {
      marks,
      remarks: remarks.trim(),
      evaluatedBy: actor.uid,
      evaluatedByName: actor.name,
      evaluatedAt: serverTimestamp(),
    },
  })
  const stageName = stageShortName(stage.title)
  const verb = status === 'accepted' ? `accepted ${stageName} with ${marks}/${stage.maxMarks}` : `requested changes on ${stageName}`
  logActivity(batch, teamId, 'submission_evaluated', actor, `${actor.name} ${verb}`)
  await batch.commit()
}

function commentsPath(scope: CommentScope) {
  return scope.kind === 'submission'
    ? collection(db, 'teams', scope.teamId, 'submissions', scope.submissionId, 'comments')
    : collection(db, 'teams', scope.teamId, 'discussion')
}

export function addComment(
  scope: CommentScope,
  input: { body: string; kind: 'comment' | 'doubt' },
  author: Actor & { role: Role },
) {
  return addDoc(commentsPath(scope), {
    authorId: author.uid,
    authorName: author.name,
    authorRole: author.role,
    body: input.body.trim(),
    kind: input.kind,
    resolved: false,
    createdAt: serverTimestamp(),
  })
}

export function setCommentResolved(scope: CommentScope, commentId: string, resolved: boolean) {
  return updateDoc(doc(commentsPath(scope), commentId), { resolved })
}

export function deleteComment(scope: CommentScope, commentId: string) {
  return deleteDoc(doc(commentsPath(scope), commentId))
}
