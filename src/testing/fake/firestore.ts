/*
 * In-browser stand-in for `firebase/firestore`, used only for local UI tests
 * and screenshots when the Firestore emulator can't be downloaded
 * (VITE_FAKE_BACKEND=true — see vite.config.ts). It implements the subset of
 * the modular API this app uses. It does NOT enforce security rules; those are
 * covered by tests/rules against the real emulator.
 */
import { docs, persist, Timestamp } from './store'

export { Timestamp }

type Data = Record<string, unknown>
interface Converter {
  toFirestore: (d: unknown) => Data
  fromFirestore: (snap: { id: string; data: (o?: unknown) => Data }, options?: unknown) => unknown
}

class Sentinel {
  kind: 'serverTimestamp' | 'arrayUnion' | 'arrayRemove'
  values: unknown[]
  constructor(kind: Sentinel['kind'], values: unknown[] = []) {
    this.kind = kind
    this.values = values
  }
}
export const serverTimestamp = () => new Sentinel('serverTimestamp')
export const arrayUnion = (...values: unknown[]) => new Sentinel('arrayUnion', values)
export const arrayRemove = (...values: unknown[]) => new Sentinel('arrayRemove', values)

const db = { type: 'firestore' }
export const initializeFirestore = () => db
export const getFirestore = () => db
export const connectFirestoreEmulator = () => {}

const autoId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (let i = 0; i < 20; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id
}

class DocumentReference {
  type = 'document' as const
  path: string
  converter: Converter | null
  constructor(path: string, converter: Converter | null = null) {
    this.path = path
    this.converter = converter
  }
  get id() {
    return this.path.split('/').pop()!
  }
  withConverter(c: Converter | null) {
    return new DocumentReference(this.path, c)
  }
}

class CollectionReference {
  type = 'collection' as const
  path: string
  converter: Converter | null
  constructor(path: string, converter: Converter | null = null) {
    this.path = path
    this.converter = converter
  }
  get id() {
    return this.path.split('/').pop()!
  }
  withConverter(c: Converter | null) {
    return new CollectionReference(this.path, c)
  }
}

type Constraint = { type: 'where'; field: string; op: string; value: unknown } | { type: 'orderBy'; field: string; dir: 'asc' | 'desc' }

class Query {
  type = 'query' as const
  source: { collectionPath?: string; groupId?: string }
  constraints: Constraint[]
  converter: Converter | null
  constructor(source: Query['source'], constraints: Constraint[], converter: Converter | null) {
    this.source = source
    this.constraints = constraints
    this.converter = converter
  }
  withConverter(c: Converter | null) {
    return new Query(this.source, this.constraints, c)
  }
}

function joinPath(base: unknown, segments: string[]) {
  const prefix = base instanceof CollectionReference || base instanceof DocumentReference ? [base.path] : []
  return [...prefix, ...segments].join('/')
}

export function collection(base: unknown, ...segments: string[]) {
  return new CollectionReference(joinPath(base, segments))
}

export function doc(base: unknown, ...segments: string[]) {
  if (base instanceof CollectionReference && segments.length === 0) {
    return new DocumentReference(`${base.path}/${autoId()}`, base.converter)
  }
  return new DocumentReference(joinPath(base, segments), base instanceof CollectionReference ? base.converter : null)
}

export function collectionGroup(_db: unknown, groupId: string) {
  return new Query({ groupId }, [], null)
}

export const where = (field: string, op: string, value: unknown): Constraint => ({ type: 'where', field, op, value })
export const orderBy = (field: string, dir: 'asc' | 'desc' = 'asc'): Constraint => ({ type: 'orderBy', field, dir })

export function query(base: CollectionReference | Query, ...constraints: Constraint[]) {
  if (base instanceof Query) return new Query(base.source, [...base.constraints, ...constraints], base.converter)
  return new Query({ collectionPath: base.path }, constraints, base.converter)
}

// ---------- reading ----------

const get = (data: Data, field: string) => field.split('.').reduce<unknown>((v, k) => (v as Data | undefined)?.[k], data)
const comparable = (v: unknown) => (v instanceof Timestamp ? v.toMillis() : v)

function matches(data: Data, c: Constraint) {
  if (c.type !== 'where') return true
  const v = comparable(get(data, c.field))
  const target = comparable(c.value)
  switch (c.op) {
    case '==':
      return v === target
    case '!=':
      return v !== target
    case 'in':
      return (target as unknown[]).includes(v)
    case 'array-contains':
      return Array.isArray(v) && v.includes(target)
    default:
      throw new Error(`[fake-firestore] unsupported operator ${c.op}`)
  }
}

function runQuery(q: Query) {
  const results: [string, Data][] = []
  for (const [path, data] of docs) {
    const parts = path.split('/')
    const parent = parts.slice(0, -1).join('/')
    if (q.source.collectionPath !== undefined && parent !== q.source.collectionPath) continue
    if (q.source.groupId !== undefined && parts[parts.length - 2] !== q.source.groupId) continue
    if (q.constraints.every((c) => matches(data, c))) results.push([path, data])
  }
  for (const c of [...q.constraints].reverse()) {
    if (c.type !== 'orderBy') continue
    results.sort(([, a], [, b]) => {
      const x = comparable(get(a, c.field)) as number | string
      const y = comparable(get(b, c.field)) as number | string
      return (x < y ? -1 : x > y ? 1 : 0) * (c.dir === 'desc' ? -1 : 1)
    })
  }
  return results
}

function makeSnapshot(path: string, data: Data | undefined, converter: Converter | null) {
  const id = path.split('/').pop()!
  const raw = { id, data: () => structuredCloneWithTs(data ?? {}) }
  return {
    id,
    ref: new DocumentReference(path, converter),
    metadata: { fromCache: false, hasPendingWrites: false },
    exists: () => data !== undefined,
    data: (options?: unknown) => (data === undefined ? undefined : converter ? converter.fromFirestore(raw, options) : raw.data()),
  }
}

function structuredCloneWithTs(value: unknown): Data {
  const clone = (v: unknown): unknown => {
    if (v instanceof Timestamp) return v
    if (Array.isArray(v)) return v.map(clone)
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clone(x)]))
    return v
  }
  return clone(value) as Data
}

function evaluate(target: DocumentReference | Query) {
  if (target instanceof DocumentReference) return makeSnapshot(target.path, docs.get(target.path), target.converter)
  const rows = runQuery(target).map(([path, data]) => makeSnapshot(path, data, target.converter))
  return { docs: rows, size: rows.length, empty: rows.length === 0, forEach: (fn: (d: unknown) => void) => rows.forEach(fn), metadata: { fromCache: false } }
}

const signature = (target: DocumentReference | Query) =>
  target instanceof DocumentReference
    ? JSON.stringify(docs.get(target.path) ?? null)
    : JSON.stringify(runQuery(target))

const listeners = new Set<() => void>()
function notify() {
  setTimeout(() => listeners.forEach((l) => l()), 0)
}

export function onSnapshot(target: DocumentReference | Query, next: (snap: unknown) => void, error?: (e: unknown) => void) {
  let last = ''
  const run = () => {
    try {
      const sig = signature(target)
      if (sig === last) return
      last = sig
      next(evaluate(target))
    } catch (e) {
      error?.(e)
    }
  }
  listeners.add(run)
  setTimeout(run, 30)
  return () => listeners.delete(run)
}

const latency = () => new Promise((r) => setTimeout(r, 120))

export async function getDoc(ref: DocumentReference) {
  await latency()
  return evaluate(ref)
}

export async function getDocs(q: Query | CollectionReference) {
  await latency()
  return evaluate(q instanceof CollectionReference ? query(q) : q)
}

// ---------- writing ----------

function resolve(value: unknown, previous: unknown): unknown {
  if (value instanceof Sentinel) {
    if (value.kind === 'serverTimestamp') return Timestamp.now()
    const current = Array.isArray(previous) ? previous : []
    if (value.kind === 'arrayUnion') return [...current, ...value.values.filter((v) => !current.includes(v))]
    return current.filter((v) => !value.values.includes(v))
  }
  if (value instanceof Timestamp || value === null) return value
  if (Array.isArray(value)) return value.map((v) => resolve(v, undefined))
  if (typeof value === 'object' && value !== undefined) {
    return Object.fromEntries(
      Object.entries(value as Data)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, resolve(v, (previous as Data | undefined)?.[k])]),
    )
  }
  return value
}

type Op = { kind: 'set'; ref: DocumentReference; data: Data } | { kind: 'update'; ref: DocumentReference; data: Data } | { kind: 'delete'; ref: DocumentReference }

function apply(op: Op) {
  if (op.kind === 'delete') return void docs.delete(op.ref.path)
  const payload = op.kind === 'set' && op.ref.converter ? op.ref.converter.toFirestore(op.data) : op.data
  if (op.kind === 'set') return void docs.set(op.ref.path, resolve(payload, undefined) as Data)
  const existing = docs.get(op.ref.path)
  if (!existing) {
    const err = new Error(`No document to update: ${op.ref.path}`) as Error & { code: string }
    err.code = 'not-found'
    throw err
  }
  const next = { ...existing }
  for (const [k, v] of Object.entries(payload)) next[k] = resolve(v, existing[k])
  docs.set(op.ref.path, next)
}

async function commit(ops: Op[]) {
  await latency()
  ops.forEach(apply)
  persist()
  notify()
}

export function writeBatch() {
  const ops: Op[] = []
  return {
    set(ref: DocumentReference, data: Data) {
      ops.push({ kind: 'set', ref, data })
      return this
    },
    update(ref: DocumentReference, data: Data) {
      ops.push({ kind: 'update', ref, data })
      return this
    },
    delete(ref: DocumentReference) {
      ops.push({ kind: 'delete', ref })
      return this
    },
    commit: () => commit(ops),
  }
}

export const setDoc = (ref: DocumentReference, data: Data) => commit([{ kind: 'set', ref, data }])
export const updateDoc = (ref: DocumentReference, data: Data) => commit([{ kind: 'update', ref, data }])
export const deleteDoc = (ref: DocumentReference) => commit([{ kind: 'delete', ref }])
export async function addDoc(col: CollectionReference, data: Data) {
  const ref = doc(col)
  await commit([{ kind: 'set', ref, data }])
  return ref
}
