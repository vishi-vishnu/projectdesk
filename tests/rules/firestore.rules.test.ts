import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  setLogLevel,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

let env: RulesTestEnvironment

const ts = Timestamp.fromDate(new Date('2026-01-01'))
const user = (role: string, status = 'active', extra: Record<string, unknown> = {}) => ({
  name: `Test ${role}`,
  email: `${role}@college.edu`,
  role,
  status,
  department: 'Electronics and Communication Engineering',
  teamId: null,
  createdAt: ts,
  ...extra,
})

const team = (extra: Record<string, unknown> = {}) => ({
  cycleId: 'c1',
  name: 'Team Alpha',
  leadId: 'lead',
  memberIds: ['lead', 'member'],
  guideId: 'guide',
  joinCode: 'ALPHA2',
  project: {
    title: 'A sufficiently long project title',
    abstract: 'x'.repeat(80),
    domain: 'IoT',
    techStack: [],
  },
  proposalStatus: 'approved',
  proposalRemarks: '',
  createdAt: ts,
  updatedAt: ts,
  ...extra,
})

const pdf = {
  name: 'review.pdf',
  url: 'https://res.cloudinary.com/demo/image/upload/v1/projectdesk/teams/t1/review.pdf',
  path: 'projectdesk/teams/t1/review',
  size: 1200,
  contentType: 'application/pdf',
  provider: 'cloudinary',
}

const as = (uid: string, email = `${uid}@college.edu`): Firestore =>
  env.authenticatedContext(uid, { email }).firestore() as unknown as Firestore

beforeAll(async () => {
  setLogLevel('error')
  env = await initializeTestEnvironment({
    projectId: 'demo-projectdesk',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  })
})

afterAll(() => env?.cleanup())

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore
    await setDoc(doc(db, 'users/coord'), user('coordinator'))
    await setDoc(doc(db, 'users/guide'), user('faculty'))
    await setDoc(doc(db, 'users/other-guide'), user('faculty'))
    await setDoc(doc(db, 'users/pending'), user('faculty', 'pending'))
    await setDoc(doc(db, 'users/lead'), user('student', 'active', { teamId: 't1' }))
    await setDoc(doc(db, 'users/member'), user('student', 'active', { teamId: 't1' }))
    await setDoc(doc(db, 'users/outsider'), user('student'))
    await setDoc(doc(db, 'users/newbie'), user('student'))
    await setDoc(doc(db, 'cycles/c1'), {
      name: 'Final Year 2025-26',
      academicYear: '2025-26',
      department: 'ECE',
      isActive: true,
      maxTeamSize: 3,
      reviews: [{ id: 'r1', title: 'Review 1', description: '', dueDate: ts, maxMarks: 20 }],
      createdBy: 'coord',
      createdAt: ts,
    })
    await setDoc(doc(db, 'teams/t1'), team())
    await setDoc(doc(db, 'joinCodes/ALPHA2'), { teamId: 't1', teamName: 'Team Alpha', cycleId: 'c1', leadName: 'Test student' })
    await setDoc(doc(db, 'teams/t1/submissions/s1'), {
      teamId: 't1', cycleId: 'c1', reviewId: 'r1', version: 1, title: 'Review 1', notes: '',
      files: [pdf], submittedBy: 'lead', submittedByName: 'Test student', status: 'submitted',
      evaluation: null, createdAt: ts,
    })
  })
})

describe('user profiles', () => {
  const signup = (role: string, status: string) => ({
    name: 'New Person',
    email: 'fresh@college.edu',
    role,
    status,
    department: 'Information Technology',
    teamId: null,
    createdAt: serverTimestamp(),
  })

  it('lets a student self-register as active', async () => {
    await assertSucceeds(setDoc(doc(as('fresh', 'fresh@college.edu'), 'users/fresh'), signup('student', 'active')))
  })

  it('lets faculty self-register only as pending', async () => {
    const db = as('fresh', 'fresh@college.edu')
    await assertFails(setDoc(doc(db, 'users/fresh'), signup('faculty', 'active')))
    await assertSucceeds(setDoc(doc(db, 'users/fresh'), signup('faculty', 'pending')))
  })

  it('never allows self-registration as coordinator', async () => {
    await assertFails(setDoc(doc(as('fresh', 'fresh@college.edu'), 'users/fresh'), signup('coordinator', 'active')))
  })

  it('rejects a profile whose email differs from the sign-in email', async () => {
    await assertFails(setDoc(doc(as('fresh', 'someone.else@college.edu'), 'users/fresh'), signup('student', 'active')))
  })

  it('stops users from promoting themselves', async () => {
    await assertFails(updateDoc(doc(as('outsider'), 'users/outsider'), { role: 'coordinator' }))
    await assertFails(updateDoc(doc(as('pending'), 'users/pending'), { status: 'active' }))
    await assertSucceeds(updateDoc(doc(as('outsider'), 'users/outsider'), { name: 'Renamed Student' }))
  })

  it('lets the coordinator approve faculty', async () => {
    await assertSucceeds(updateDoc(doc(as('coord'), 'users/pending'), { status: 'active' }))
  })

  it('only lets coordinators list all users', async () => {
    await assertFails(getDocs(collection(as('outsider'), 'users')))
    await assertSucceeds(getDocs(collection(as('coord'), 'users')))
  })

  it('lets any active user list active guides, and nothing more', async () => {
    const db = as('outsider')
    const guides = query(collection(db, 'users'), where('role', '==', 'faculty'), where('status', '==', 'active'))
    await assertSucceeds(getDocs(guides))
    await assertFails(getDocs(query(collection(db, 'users'), where('role', '==', 'faculty'))))
    await assertFails(getDocs(query(collection(db, 'users'), where('role', '==', 'student'), where('status', '==', 'active'))))
  })

  it('keeps pending faculty out of the app data', async () => {
    await assertFails(getDoc(doc(as('pending'), 'cycles/c1')))
    await assertSucceeds(getDoc(doc(as('pending'), 'users/pending')))
  })
})

describe('teams', () => {
  const createBatch = (db: Firestore, uid: string, overrides: Record<string, unknown> = {}) => {
    const batch = writeBatch(db)
    batch.set(doc(db, 'teams/t2'), {
      ...team({ leadId: uid, memberIds: [uid], guideId: null, joinCode: 'BETA23', proposalStatus: 'draft' }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...overrides,
    })
    batch.set(doc(db, 'joinCodes/BETA23'), { teamId: 't2', teamName: 'Team Alpha', cycleId: 'c1', leadName: 'Test student' })
    batch.update(doc(db, 'users', uid), { teamId: 't2' })
    return batch.commit()
  }

  it('requires linking the creator in the same batch (one team per student)', async () => {
    const db = as('newbie')
    const batch = writeBatch(db)
    batch.set(doc(db, 'teams/t2'), {
      ...team({ leadId: 'newbie', memberIds: ['newbie'], guideId: null, joinCode: 'BETA23', proposalStatus: 'draft' }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    batch.set(doc(db, 'joinCodes/BETA23'), { teamId: 't2', teamName: 'Team Alpha', cycleId: 'c1', leadName: 'Test student' })
    await assertFails(batch.commit())
  })

  it('lets a student without a team create one', async () => {
    await assertSucceeds(createBatch(as('newbie'), 'newbie'))
  })

  it('blocks creating a second team', async () => {
    await assertFails(createBatch(as('lead'), 'lead'))
  })

  it('blocks creating a team with a pre-assigned guide or approved topic', async () => {
    await assertFails(createBatch(as('newbie'), 'newbie', { guideId: 'guide' }))
    await assertFails(createBatch(as('newbie'), 'newbie', { proposalStatus: 'approved' }))
  })

  it('hides a team from students who are not in it', async () => {
    await assertFails(getDoc(doc(as('outsider'), 'teams/t1')))
    await assertSucceeds(getDoc(doc(as('member'), 'teams/t1')))
    await assertSucceeds(getDoc(doc(as('guide'), 'teams/t1')))
    await assertFails(getDoc(doc(as('other-guide'), 'teams/t1')))
    await assertSucceeds(getDoc(doc(as('coord'), 'teams/t1')))
  })

  const join = (db: Firestore, uid: string, code: string, proofUid = uid) => {
    const batch = writeBatch(db)
    batch.update(doc(db, 'teams/t1'), {
      memberIds: arrayUnion(uid),
      lastJoin: { uid: proofUid, code },
      updatedAt: serverTimestamp(),
    })
    batch.update(doc(db, 'users', uid), { teamId: 't1' })
    return batch.commit()
  }

  it("can't reuse someone else's join proof", async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      updateDoc(doc(ctx.firestore() as unknown as Firestore, 'cycles/c1'), { maxTeamSize: 5 }),
    )
    await assertSucceeds(join(as('outsider'), 'outsider', 'ALPHA2'))
    // newbie doesn't know the code and tries to ride on the stored proof
    const db = as('newbie')
    const batch = writeBatch(db)
    batch.update(doc(db, 'teams/t1'), { memberIds: arrayUnion('newbie'), updatedAt: serverTimestamp() })
    batch.update(doc(db, 'users/newbie'), { teamId: 't1' })
    await assertFails(batch.commit())
    await assertFails(join(as('newbie'), 'newbie', 'ALPHA2', 'outsider'))
  })

  it('requires linking the joining student in the same batch', async () => {
    const db = as('outsider')
    await assertFails(
      updateDoc(doc(db, 'teams/t1'), {
        memberIds: arrayUnion('outsider'),
        lastJoin: { uid: 'outsider', code: 'ALPHA2' },
        updatedAt: serverTimestamp(),
      }),
    )
  })

  it('lets a student join with the correct code', async () => {
    await assertSucceeds(join(as('outsider'), 'outsider', 'ALPHA2'))
  })

  it('rejects a wrong join code', async () => {
    await assertFails(join(as('outsider'), 'outsider', 'WRONG1'))
  })

  it('rejects joining a full team', async () => {
    await assertSucceeds(join(as('outsider'), 'outsider', 'ALPHA2'))
    await assertFails(join(as('newbie'), 'newbie', 'ALPHA2'))
  })

  it('does not allow listing join codes', async () => {
    await assertFails(getDocs(collection(as('outsider'), 'joinCodes')))
    await assertSucceeds(getDoc(doc(as('outsider'), 'joinCodes/ALPHA2')))
  })

  it('only lets the assigned guide approve a submitted proposal', async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      updateDoc(doc(ctx.firestore() as unknown as Firestore, 'teams/t1'), { proposalStatus: 'submitted' }),
    )
    const decision = { proposalStatus: 'approved', proposalRemarks: '', updatedAt: serverTimestamp() }
    await assertFails(updateDoc(doc(as('lead'), 'teams/t1'), decision))
    await assertFails(updateDoc(doc(as('other-guide'), 'teams/t1'), decision))
    await assertSucceeds(updateDoc(doc(as('guide'), 'teams/t1'), decision))
  })

  it('stops students from assigning their own guide', async () => {
    await assertFails(updateDoc(doc(as('lead'), 'teams/t1'), { guideId: 'other-guide', updatedAt: serverTimestamp() }))
    await assertSucceeds(updateDoc(doc(as('coord'), 'teams/t1'), { guideId: 'other-guide', updatedAt: serverTimestamp() }))
  })

  it('only lets the coordinator assign active faculty as guide', async () => {
    await assertFails(updateDoc(doc(as('coord'), 'teams/t1'), { guideId: 'pending', updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(doc(as('coord'), 'teams/t1'), { guideId: 'outsider', updatedAt: serverTimestamp() }))
  })
})

describe('submissions and evaluation', () => {
  const submission = (uid: string) => ({
    teamId: 't1', cycleId: 'c1', reviewId: 'r1', version: 2, title: 'Review 1 v2', notes: '',
    files: [pdf], submittedBy: uid, submittedByName: 'Test student', status: 'submitted',
    evaluation: null, createdAt: serverTimestamp(),
  })

  it('lets team members submit', async () => {
    await assertSucceeds(setDoc(doc(as('member'), 'teams/t1/submissions/s2'), submission('member')))
  })

  it('rejects files hosted anywhere else', async () => {
    const bad = { ...submission('member'), files: [{ ...pdf, url: 'https://evil.example.com/phish.pdf' }] }
    await assertFails(setDoc(doc(as('member'), 'teams/t1/submissions/s2'), bad))
  })

  it('blocks outsiders and impersonation', async () => {
    await assertFails(setDoc(doc(as('outsider'), 'teams/t1/submissions/s2'), submission('outsider')))
    await assertFails(setDoc(doc(as('member'), 'teams/t1/submissions/s2'), submission('lead')))
  })

  it('blocks submissions before the topic is approved', async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      updateDoc(doc(ctx.firestore() as unknown as Firestore, 'teams/t1'), { proposalStatus: 'draft' }),
    )
    await assertFails(setDoc(doc(as('member'), 'teams/t1/submissions/s2'), submission('member')))
  })

  it('blocks students from grading themselves', async () => {
    const grade = (uid: string, marks: number) => ({
      status: 'accepted',
      evaluation: { marks, remarks: '', evaluatedBy: uid, evaluatedByName: uid === 'lead' ? 'Test student' : 'Test faculty', evaluatedAt: serverTimestamp() },
    })
    await assertFails(updateDoc(doc(as('lead'), 'teams/t1/submissions/s1'), grade('lead', 20)))
    await assertFails(updateDoc(doc(as('other-guide'), 'teams/t1/submissions/s1'), grade('other-guide', 20)))
    await assertFails(updateDoc(doc(as('guide'), 'teams/t1/submissions/s1'), grade('guide', 500)))
    await assertSucceeds(updateDoc(doc(as('guide'), 'teams/t1/submissions/s1'), grade('guide', 18)))
  })

  it('keeps submissions immutable for the team', async () => {
    await assertFails(updateDoc(doc(as('lead'), 'teams/t1/submissions/s1'), { title: 'Edited after the deadline' }))
  })
})

describe('comments and activity', () => {
  const comment = (authorId: string, authorRole: string) => ({
    authorId, authorName: `Test ${authorRole}`, authorRole, body: 'Looks good', kind: 'comment', resolved: false, createdAt: serverTimestamp(),
  })

  it('lets members and the guide comment', async () => {
    await assertSucceeds(setDoc(doc(as('member'), 'teams/t1/submissions/s1/comments/c1'), comment('member', 'student')))
    await assertSucceeds(setDoc(doc(as('guide'), 'teams/t1/discussion/d1'), comment('guide', 'faculty')))
  })

  it('rejects spoofed authors, names and roles', async () => {
    await assertFails(setDoc(doc(as('member'), 'teams/t1/discussion/d1'), comment('guide', 'faculty')))
    await assertFails(setDoc(doc(as('member'), 'teams/t1/discussion/d1'), comment('member', 'faculty')))
    await assertFails(
      setDoc(doc(as('member'), 'teams/t1/discussion/d1'), { ...comment('member', 'student'), authorName: 'Test faculty' }),
    )
  })

  it('only allows comments on submissions that exist', async () => {
    await assertFails(setDoc(doc(as('member'), 'teams/t1/submissions/nope/comments/c1'), comment('member', 'student')))
  })

  it('keeps outsiders out of the discussion', async () => {
    await assertFails(getDocs(collection(as('outsider'), 'teams/t1/discussion')))
    await assertFails(setDoc(doc(as('outsider'), 'teams/t1/discussion/d1'), comment('outsider', 'student')))
  })

  it('makes the activity log append-only', async () => {
    const entry = { type: 'member_joined', actorId: 'member', actorName: 'Test student', message: 'hello', createdAt: serverTimestamp() }
    await assertSucceeds(setDoc(doc(as('member'), 'teams/t1/activity/a1'), entry))
    await assertFails(setDoc(doc(as('member'), 'teams/t1/activity/a2'), { ...entry, actorName: 'Test faculty' }))
    await assertFails(setDoc(doc(as('member'), 'teams/t1/activity/a3'), { ...entry, type: 'grade_changed' }))
    await assertFails(updateDoc(doc(as('member'), 'teams/t1/activity/a1'), { message: 'rewritten' }))
  })
})

describe('preferred guide', () => {
  const draft = async () =>
    env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore() as unknown as Firestore, 'teams/t1'), { proposalStatus: 'draft', guideId: null })
    })
  const project = (preferredGuideId: unknown) => ({
    project: { title: 'A sufficiently long project title', abstract: 'x'.repeat(80), domain: 'IoT', techStack: [], preferredGuideId },
    updatedAt: serverTimestamp(),
  })

  it('accepts an active guide or no preference', async () => {
    await draft()
    await assertSucceeds(updateDoc(doc(as('lead'), 'teams/t1'), project('guide')))
    await assertSucceeds(updateDoc(doc(as('lead'), 'teams/t1'), project(null)))
  })

  it('rejects pending faculty, students and unknown ids', async () => {
    await draft()
    await assertFails(updateDoc(doc(as('lead'), 'teams/t1'), project('pending')))
    await assertFails(updateDoc(doc(as('lead'), 'teams/t1'), project('member')))
    await assertFails(updateDoc(doc(as('lead'), 'teams/t1'), project('nobody')))
  })

  it('rejects extra fields inside the project', async () => {
    await draft()
    await assertFails(
      updateDoc(doc(as('lead'), 'teams/t1'), {
        project: { title: 'A sufficiently long project title', abstract: '', domain: '', techStack: [], marks: 100 },
        updatedAt: serverTimestamp(),
      }),
    )
  })
})

describe('announcements', () => {
  const notice = (extra: Record<string, unknown> = {}) => ({
    title: 'Review 2 moved',
    body: 'Review 2 is now on Friday.',
    audience: 'all',
    authorId: 'coord',
    authorName: 'Test coordinator',
    createdAt: serverTimestamp(),
    ...extra,
  })

  it('lets only the coordinator post, with their own name', async () => {
    await assertSucceeds(addDoc(collection(as('coord'), 'announcements'), notice()))
    await assertFails(addDoc(collection(as('coord'), 'announcements'), notice({ authorName: 'Someone else' })))
    await assertFails(addDoc(collection(as('coord'), 'announcements'), notice({ audience: 'parents' })))
    await assertFails(addDoc(collection(as('guide'), 'announcements'), notice({ authorId: 'guide', authorName: 'Test faculty' })))
    await assertFails(addDoc(collection(as('lead'), 'announcements'), notice({ authorId: 'lead', authorName: 'Test student' })))
  })

  it('is readable by active users only', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as unknown as Firestore, 'announcements/a1'), { ...notice(), createdAt: ts })
    })
    await assertSucceeds(getDoc(doc(as('outsider'), 'announcements/a1')))
    await assertFails(getDoc(doc(as('pending'), 'announcements/a1')))
    await assertFails(updateDoc(doc(as('coord'), 'announcements/a1'), { title: 'Changed title' }))
    await assertFails(deleteDoc(doc(as('guide'), 'announcements/a1')))
    await assertSucceeds(deleteDoc(doc(as('coord'), 'announcements/a1')))
  })
})
