import { describe, expect, it } from 'vitest'
import { planGuideAssignments } from './assign'

const team = (id: string, guideId: string | null = null, preferredGuideId: string | null = null) => ({
  id,
  name: `Team ${id}`,
  guideId,
  project: { title: '', abstract: '', domain: '', techStack: [], preferredGuideId },
})
const guides = [
  { uid: 'g1', name: 'Anita' },
  { uid: 'g2', name: 'Bala' },
  { uid: 'g3', name: 'Chitra' },
]

describe('planGuideAssignments', () => {
  it('only plans teams without a guide', () => {
    const plan = planGuideAssignments([team('a', 'g1'), team('b')], guides)
    expect(plan.map((p) => p.teamId)).toEqual(['b'])
  })

  it('honours the preferred guide when they have room', () => {
    const plan = planGuideAssignments([team('a', null, 'g3')], guides)
    expect(plan).toEqual([{ teamId: 'a', guideId: 'g3', reason: 'preferred' }])
  })

  it('spreads teams evenly and caps a popular guide', () => {
    const teams = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => team(id, null, 'g1'))
    const plan = planGuideAssignments(teams, guides)
    const count = (g: string) => plan.filter((p) => p.guideId === g).length
    expect([count('g1'), count('g2'), count('g3')]).toEqual([2, 2, 2])
    expect(plan.filter((p) => p.reason === 'preferred')).toHaveLength(2)
  })

  it('counts existing assignments in the load', () => {
    const plan = planGuideAssignments([team('a', 'g1'), team('b', 'g1'), team('c'), team('d')], guides)
    expect(plan.map((p) => p.guideId)).toEqual(['g2', 'g3'])
  })

  it('ignores a preference for someone who is not an active guide', () => {
    const plan = planGuideAssignments([team('a', null, 'gone')], guides)
    expect(plan[0]).toMatchObject({ guideId: 'g1', reason: 'balanced' })
  })

  it('returns nothing when there are no guides', () => {
    expect(planGuideAssignments([team('a')], [])).toEqual([])
  })
})
