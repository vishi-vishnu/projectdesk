/**
 * Seeds demo accounts and data.
 *
 *   Emulator:   npm run seed            (run while `npm run emulators` is up)
 *   Production: GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *               FIREBASE_PROJECT_ID=your-project npm run seed -- --production
 *
 * Every write is an upsert keyed by fixed ids, so running it twice is safe.
 */
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp, type WriteBatch } from 'firebase-admin/firestore'
import { buildSeed, DEMO_PASSWORD } from '../src/testing/seedData.ts'

const production = process.argv.includes('--production')
const usingEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST)

if (!production && !usingEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
}
if (production && usingEmulator) {
  console.error('Unset FIRESTORE_EMULATOR_HOST before seeding production.')
  process.exit(1)
}

const projectId = process.env.FIREBASE_PROJECT_ID ?? (production ? undefined : 'demo-projectdesk')
if (!projectId) {
  console.error('Set FIREBASE_PROJECT_ID for production seeding.')
  process.exit(1)
}

initializeApp(production ? { projectId, credential: applicationDefault() } : { projectId })
const db = getFirestore()
const auth = getAuth()
const ts = (d: Date) => Timestamp.fromDate(d)

async function upsertAuthUser(uid: string, email: string, displayName: string) {
  try {
    await auth.updateUser(uid, { email, displayName, password: DEMO_PASSWORD })
  } catch {
    await auth.createUser({ uid, email, displayName, password: DEMO_PASSWORD, emailVerified: true })
  }
}

async function main() {
  const { users, cycle, teams, announcements } = buildSeed()
  console.log(`Seeding ${production ? `PRODUCTION project "${projectId}"` : 'local emulators'}…`)

  for (const u of users) await upsertAuthUser(u.uid, u.email, u.name)
  console.log(`  ✓ ${users.length} auth accounts (password: ${DEMO_PASSWORD})`)

  const byId = Object.fromEntries(users.map((u) => [u.uid, u]))
  const batches: WriteBatch[] = [db.batch()]
  let ops = 0
  const set = (path: string, data: Record<string, unknown>) => {
    if (ops === 450) {
      batches.push(db.batch())
      ops = 0
    }
    batches[batches.length - 1].set(db.doc(path), data)
    ops++
  }

  for (const u of users) {
    const { uid, ...rest } = u
    set(`users/${uid}`, { ...rest, createdAt: ts(cycle.createdAt) })
  }

  const { id: cycleId, reviews, createdAt, ...cycleRest } = cycle
  set(`cycles/${cycleId}`, {
    ...cycleRest,
    createdAt: ts(createdAt),
    reviews: reviews.map((r) => ({ ...r, dueDate: ts(r.dueDate) })),
  })

  for (const t of teams) {
    set(`teams/${t.id}`, {
      cycleId,
      name: t.name,
      leadId: t.leadId,
      memberIds: t.memberIds,
      guideId: t.guideId,
      joinCode: t.joinCode,
      project: t.project,
      proposalStatus: t.proposalStatus,
      proposalRemarks: t.proposalRemarks,
      createdAt: ts(t.createdAt),
      updatedAt: ts(t.createdAt),
    })
    set(`joinCodes/${t.joinCode}`, {
      teamId: t.id,
      teamName: t.name,
      cycleId,
      leadName: byId[t.leadId].name,
    })
    for (const s of t.submissions) {
      set(`teams/${t.id}/submissions/${s.id}`, {
        teamId: t.id,
        cycleId,
        reviewId: s.reviewId,
        version: s.version,
        title: s.title,
        notes: s.notes,
        files: s.files,
        submittedBy: s.submittedBy,
        submittedByName: byId[s.submittedBy].name,
        status: s.status,
        createdAt: ts(s.at),
        evaluation: s.evaluation
          ? {
              marks: s.evaluation.marks,
              remarks: s.evaluation.remarks,
              evaluatedBy: s.evaluation.by,
              evaluatedByName: byId[s.evaluation.by].name,
              evaluatedAt: ts(s.evaluation.at),
            }
          : null,
      })
      for (const c of s.comments) set(`teams/${t.id}/submissions/${s.id}/comments/${c.id}`, comment(c))
    }
    for (const c of t.discussion) set(`teams/${t.id}/discussion/${c.id}`, comment(c))
    for (const a of t.activity) {
      set(`teams/${t.id}/activity/${a.id}`, {
        type: a.type,
        actorId: a.actorId,
        actorName: byId[a.actorId].name,
        message: a.message,
        createdAt: ts(a.at),
      })
    }
  }

  function comment(c: (typeof teams)[number]['discussion'][number]) {
    const author = byId[c.authorId]
    return {
      authorId: c.authorId,
      authorName: author.name,
      authorRole: author.role,
      body: c.body,
      kind: c.kind,
      resolved: c.resolved,
      createdAt: ts(c.at),
    }
  }

  for (const a of announcements) {
    set(`announcements/${a.id}`, {
      title: a.title,
      body: a.body,
      audience: a.audience,
      authorId: a.authorId,
      authorName: byId[a.authorId].name,
      createdAt: ts(a.at),
    })
  }

  for (const b of batches) await b.commit()
  console.log(`  ✓ 1 cycle, ${teams.length} teams with submissions, comments and activity`)
  console.log('\nSign in with, for example:')
  console.log('  coordinator@demo.projectdesk.app  ·  meena@demo.projectdesk.app  ·  arjun@demo.projectdesk.app')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
