import type { Cycle, ReviewStage, Submission, Team } from './types'
import { latestByReview } from './progress'

export interface QueueItem {
  team: Team
  stage: ReviewStage
  stageIndex: number
  submission: Submission
}

/** Latest submission per team & stage, filtered by status, oldest first. */
export function buildQueue(
  teams: Team[],
  cycle: Cycle,
  byTeam: Record<string, Submission[]>,
  statuses: Submission['status'][] = ['submitted'],
): QueueItem[] {
  const items: QueueItem[] = []
  for (const team of teams) {
    const latest = latestByReview(byTeam[team.id] ?? [])
    cycle.reviews.forEach((stage, stageIndex) => {
      const submission = latest.get(stage.id)
      if (submission && statuses.includes(submission.status)) items.push({ team, stage, stageIndex, submission })
    })
  }
  return items.sort(
    (a, b) => (a.submission.createdAt?.toMillis?.() ?? Infinity) - (b.submission.createdAt?.toMillis?.() ?? Infinity),
  )
}
