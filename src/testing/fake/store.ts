/* Shared persisted state for the fake backend. */
import { buildSeed, DEMO_PASSWORD } from '../seedData'

export class Timestamp {
  readonly seconds: number
  readonly nanoseconds: number
  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds
    this.nanoseconds = nanoseconds
  }
  static fromDate(d: Date) {
    const ms = d.getTime()
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6)
  }
  static fromMillis(ms: number) {
    return Timestamp.fromDate(new Date(ms))
  }
  static now() {
    return Timestamp.fromDate(new Date())
  }
  toDate() {
    return new Date(this.toMillis())
  }
  toMillis() {
    return this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6)
  }
  isEqual(other: Timestamp) {
    return other.seconds === this.seconds && other.nanoseconds === this.nanoseconds
  }
  valueOf() {
    return String(this.toMillis()).padStart(15, '0')
  }
}

type Json = unknown
const DB_KEY = 'pd-fake-db-v1'
const AUTH_KEY = 'pd-fake-auth-v1'

function encode(value: Json): Json {
  if (value instanceof Timestamp) return { __ts: value.toMillis() }
  if (Array.isArray(value)) return value.map(encode)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encode(v)]))
  return value
}

function decode(value: Json): Json {
  if (Array.isArray(value)) return value.map(decode)
  if (value && typeof value === 'object') {
    const o = value as Record<string, Json>
    if (typeof o.__ts === 'number' && Object.keys(o).length === 1) return Timestamp.fromMillis(o.__ts)
    return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, decode(v)]))
  }
  return value
}

export interface AuthRecord {
  uid: string
  email: string
  password: string
  displayName: string
}

export const docs = new Map<string, Record<string, unknown>>()
export const accounts = new Map<string, AuthRecord>()

export function persist() {
  localStorage.setItem(DB_KEY, JSON.stringify(encode(Object.fromEntries(docs))))
  localStorage.setItem(AUTH_KEY, JSON.stringify(Object.fromEntries(accounts)))
}

function seed() {
  const { users, cycle, teams } = buildSeed()
  const ts = Timestamp.fromDate
  const byId = Object.fromEntries(users.map((u) => [u.uid, u]))
  for (const u of users) {
    const { uid, ...rest } = u
    docs.set(`users/${uid}`, { ...rest, createdAt: ts(cycle.createdAt) })
    accounts.set(u.email, { uid, email: u.email, password: DEMO_PASSWORD, displayName: u.name })
  }
  const { id: cycleId, reviews, createdAt, ...cycleRest } = cycle
  docs.set(`cycles/${cycleId}`, { ...cycleRest, createdAt: ts(createdAt), reviews: reviews.map((r) => ({ ...r, dueDate: ts(r.dueDate) })) })
  const comment = (c: { authorId: string; body: string; kind: string; resolved: boolean; at: Date }) => ({
    authorId: c.authorId,
    authorName: byId[c.authorId].name,
    authorRole: byId[c.authorId].role,
    body: c.body,
    kind: c.kind,
    resolved: c.resolved,
    createdAt: ts(c.at),
  })
  for (const t of teams) {
    docs.set(`teams/${t.id}`, {
      cycleId, name: t.name, leadId: t.leadId, memberIds: t.memberIds, guideId: t.guideId, joinCode: t.joinCode,
      project: t.project, proposalStatus: t.proposalStatus, proposalRemarks: t.proposalRemarks,
      createdAt: ts(t.createdAt), updatedAt: ts(t.createdAt),
    })
    docs.set(`joinCodes/${t.joinCode}`, { teamId: t.id, teamName: t.name, cycleId, leadName: byId[t.leadId].name })
    for (const s of t.submissions) {
      docs.set(`teams/${t.id}/submissions/${s.id}`, {
        teamId: t.id, cycleId, reviewId: s.reviewId, version: s.version, title: s.title, notes: s.notes, files: s.files,
        submittedBy: s.submittedBy, submittedByName: byId[s.submittedBy].name, status: s.status, createdAt: ts(s.at),
        evaluation: s.evaluation
          ? { marks: s.evaluation.marks, remarks: s.evaluation.remarks, evaluatedBy: s.evaluation.by, evaluatedByName: byId[s.evaluation.by].name, evaluatedAt: ts(s.evaluation.at) }
          : null,
      })
      for (const c of s.comments) docs.set(`teams/${t.id}/submissions/${s.id}/comments/${c.id}`, comment(c))
    }
    for (const c of t.discussion) docs.set(`teams/${t.id}/discussion/${c.id}`, comment(c))
    for (const a of t.activity)
      docs.set(`teams/${t.id}/activity/${a.id}`, { type: a.type, actorId: a.actorId, actorName: byId[a.actorId].name, message: a.message, createdAt: ts(a.at) })
  }
  persist()
}

function load() {
  const raw = localStorage.getItem(DB_KEY)
  const rawAuth = localStorage.getItem(AUTH_KEY)
  const empty = new URLSearchParams(location.search).has('fake-empty')
  if (raw && rawAuth) {
    Object.entries(decode(JSON.parse(raw)) as Record<string, Record<string, unknown>>).forEach(([k, v]) => docs.set(k, v))
    Object.entries(JSON.parse(rawAuth) as Record<string, AuthRecord>).forEach(([k, v]) => accounts.set(k, v))
  } else if (!empty) {
    seed()
  }
}

load()

export function resetFakeBackend() {
  localStorage.removeItem(DB_KEY)
  localStorage.removeItem(AUTH_KEY)
}
;(window as unknown as { __resetFakeBackend: () => void }).__resetFakeBackend = resetFakeBackend
