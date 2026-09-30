import type { Cycle, ReviewStage, Submission, Team } from './types'
import { toDate } from './format'

export type StageState =
  | 'upcoming'
  | 'due_soon'
  | 'overdue'
  | 'submitted'
  | 'changes_requested'
  | 'accepted'

const STAGE_LABELS: Record<StageState, string> = {
  upcoming: 'Not submitted',
  due_soon: 'Due soon',
  overdue: 'Overdue',
  submitted: 'Awaiting review',
  changes_requested: 'Changes requested',
  accepted: 'Accepted',
}

export const stageStateLabel = (state: StageState) => STAGE_LABELS[state]

const DUE_SOON_DAYS = 7
const DAY = 24 * 60 * 60 * 1000

/** Latest submission (highest version) per review stage. */
export function latestByReview(submissions: Submission[]): Map<string, Submission> {
  const map = new Map<string, Submission>()
  for (const s of submissions) {
    const current = map.get(s.reviewId)
    if (!current || s.version > current.version) map.set(s.reviewId, s)
  }
  return map
}

export function stageState(
  stage: Pick<ReviewStage, 'dueDate'>,
  latest: Pick<Submission, 'status'> | undefined,
  now = new Date(),
): StageState {
  if (latest) return latest.status
  const due = toDate(stage.dueDate)
  if (!due) return 'upcoming'
  const diff = due.getTime() - now.getTime()
  if (diff < 0) return 'overdue'
  if (diff <= DUE_SOON_DAYS * DAY) return 'due_soon'
  return 'upcoming'
}

export function isLateSubmission(stage: Pick<ReviewStage, 'dueDate'>, submission: Pick<Submission, 'createdAt'>) {
  const due = toDate(stage.dueDate)
  const at = toDate(submission.createdAt)
  if (!due || !at) return false
  return at.getTime() > due.getTime()
}

export interface TeamProgress {
  accepted: number
  total: number
  marks: number
  maxMarks: number
  /** First stage that is not yet accepted, in order. */
  nextStage: ReviewStage | null
  /** 0–100, weighted by stage count; proposal approval counts as a step. */
  percent: number
}

export function teamProgress(
  team: Pick<Team, 'proposalStatus'>,
  cycle: Pick<Cycle, 'reviews'>,
  submissions: Submission[],
): TeamProgress {
  const latest = latestByReview(submissions)
  let accepted = 0
  let marks = 0
  let maxMarks = 0
  let nextStage: ReviewStage | null = null
  for (const stage of cycle.reviews) {
    maxMarks += stage.maxMarks
    const sub = latest.get(stage.id)
    if (sub?.evaluation) marks += sub.evaluation.marks
    if (sub?.status === 'accepted') accepted += 1
    else if (!nextStage) nextStage = stage
  }
  const steps = cycle.reviews.length + 1
  const done = accepted + (team.proposalStatus === 'approved' ? 1 : 0)
  return {
    accepted,
    total: cycle.reviews.length,
    marks,
    maxMarks,
    nextStage,
    percent: steps === 0 ? 0 : Math.round((done / steps) * 100),
  }
}

const JOIN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I

export function generateJoinCode(length = 6, random: () => number = Math.random): string {
  let code = ''
  for (let i = 0; i < length; i++) code += JOIN_ALPHABET[Math.floor(random() * JOIN_ALPHABET.length)]
  return code
}

export function normalizeJoinCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '')
}
