/**
 * Suggests a guide for every team that doesn't have one yet.
 *
 * 1. A team's preferred guide is used when that guide still has room.
 * 2. Everyone else goes to the guide with the fewest teams, so the load
 *    stays even. Ties go to the guide whose name comes first, which keeps the
 *    result the same every time it runs.
 *
 * "Room" means at most ceil(total teams / guides) teams per guide, so one
 * popular guide can't end up with half the class.
 */
import type { Team, UserProfile } from './types'

export interface AssignmentPlan {
  teamId: string
  guideId: string
  reason: 'preferred' | 'balanced'
}

export function planGuideAssignments(
  teams: Pick<Team, 'id' | 'name' | 'guideId' | 'project'>[],
  guides: Pick<UserProfile, 'uid' | 'name'>[],
): AssignmentPlan[] {
  if (guides.length === 0) return []
  const sortedGuides = [...guides].sort((a, b) => a.name.localeCompare(b.name))
  const guideIds = new Set(sortedGuides.map((g) => g.uid))
  const cap = Math.ceil(teams.length / sortedGuides.length)

  const load = new Map(sortedGuides.map((g) => [g.uid, 0]))
  for (const t of teams) if (t.guideId && load.has(t.guideId)) load.set(t.guideId, load.get(t.guideId)! + 1)

  const waiting = teams.filter((t) => !t.guideId).sort((a, b) => a.name.localeCompare(b.name))
  const plan: AssignmentPlan[] = []
  const rest: typeof waiting = []

  for (const t of waiting) {
    const pref = t.project.preferredGuideId
    if (pref && guideIds.has(pref) && load.get(pref)! < cap) {
      plan.push({ teamId: t.id, guideId: pref, reason: 'preferred' })
      load.set(pref, load.get(pref)! + 1)
    } else {
      rest.push(t)
    }
  }

  for (const t of rest) {
    let best = sortedGuides[0].uid
    for (const g of sortedGuides) if (load.get(g.uid)! < load.get(best)!) best = g.uid
    plan.push({ teamId: t.id, guideId: best, reason: 'balanced' })
    load.set(best, load.get(best)! + 1)
  }

  return plan
}
