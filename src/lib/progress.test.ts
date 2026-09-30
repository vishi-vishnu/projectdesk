import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'
import { generateJoinCode, isLateSubmission, latestByReview, normalizeJoinCode, stageState, teamProgress } from './progress'
import type { Cycle, Submission } from './types'

const now = new Date('2026-03-01T10:00:00Z')
const days = (n: number) => Timestamp.fromDate(new Date(now.getTime() + n * 86_400_000))

const sub = (reviewId: string, version: number, status: Submission['status'], marks?: number): Submission =>
  ({
    id: `${reviewId}-v${version}`,
    reviewId,
    version,
    status,
    createdAt: days(-1),
    evaluation: marks === undefined ? null : { marks },
  }) as unknown as Submission

const cycle = {
  reviews: [
    { id: 'r1', title: 'R1', description: '', maxMarks: 20, dueDate: days(-10) },
    { id: 'r2', title: 'R2', description: '', maxMarks: 30, dueDate: days(3) },
    { id: 'r3', title: 'R3', description: '', maxMarks: 50, dueDate: days(30) },
  ],
} as unknown as Cycle

describe('latestByReview', () => {
  it('keeps the highest version for each stage', () => {
    const latest = latestByReview([sub('r1', 1, 'changes_requested'), sub('r1', 3, 'submitted'), sub('r1', 2, 'changes_requested')])
    expect(latest.get('r1')?.version).toBe(3)
  })
})

describe('stageState', () => {
  it('uses the submission status when one exists', () => {
    expect(stageState(cycle.reviews[0], sub('r1', 1, 'accepted'), now)).toBe('accepted')
  })

  it('derives deadline state when nothing is submitted', () => {
    expect(stageState(cycle.reviews[0], undefined, now)).toBe('overdue')
    expect(stageState(cycle.reviews[1], undefined, now)).toBe('due_soon')
    expect(stageState(cycle.reviews[2], undefined, now)).toBe('upcoming')
  })
})

describe('isLateSubmission', () => {
  it('flags submissions after the due date', () => {
    expect(isLateSubmission({ dueDate: days(-2) }, { createdAt: days(-1) })).toBe(true)
    expect(isLateSubmission({ dueDate: days(2) }, { createdAt: days(-1) })).toBe(false)
  })
})

describe('teamProgress', () => {
  it('counts accepted stages, marks and the next stage', () => {
    const p = teamProgress({ proposalStatus: 'approved' }, cycle, [sub('r1', 1, 'accepted', 18), sub('r2', 1, 'submitted')])
    expect(p).toMatchObject({ accepted: 1, total: 3, marks: 18, maxMarks: 100 })
    expect(p.nextStage?.id).toBe('r2')
    expect(p.percent).toBe(50) // topic + r1 out of 4 steps
  })

  it('only counts marks from the latest version', () => {
    const p = teamProgress({ proposalStatus: 'approved' }, cycle, [sub('r1', 1, 'changes_requested', 0), sub('r1', 2, 'accepted', 15)])
    expect(p.marks).toBe(15)
  })
})

describe('join codes', () => {
  it('generates 6 unambiguous characters', () => {
    for (let i = 0; i < 50; i++) expect(generateJoinCode()).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
  })

  it('normalises user input', () => {
    expect(normalizeJoinCode(' ab-12 cd ')).toBe('AB12CD')
  })
})
