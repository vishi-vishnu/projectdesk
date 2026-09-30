/* In-browser stand-in for `firebase/auth` (UI tests only). */
import { FirebaseError } from './app'
import { accounts, persist } from './store'

const SESSION_KEY = 'pd-fake-session'
type Listener = (user: FakeUser | null) => void

export interface FakeUser {
  uid: string
  email: string
  displayName: string
  getIdToken: () => Promise<string>
}

const listeners = new Set<Listener>()
const toUser = (email: string): FakeUser | null => {
  const a = accounts.get(email)
  return a ? { uid: a.uid, email: a.email, displayName: a.displayName, getIdToken: async () => `fake-token-${a.uid}` } : null
}

const auth = { currentUser: null as FakeUser | null }
const saved = localStorage.getItem(SESSION_KEY)
if (saved) auth.currentUser = toUser(saved)

function setUser(user: FakeUser | null) {
  auth.currentUser = user
  if (user) localStorage.setItem(SESSION_KEY, user.email)
  else localStorage.removeItem(SESSION_KEY)
  listeners.forEach((l) => l(user))
}

const delay = () => new Promise((r) => setTimeout(r, 250))

export const getAuth = () => auth
export const connectAuthEmulator = () => {}

export function onAuthStateChanged(_auth: unknown, cb: Listener) {
  listeners.add(cb)
  setTimeout(() => cb(auth.currentUser), 0)
  return () => listeners.delete(cb)
}

export async function signInWithEmailAndPassword(_auth: unknown, email: string, password: string) {
  await delay()
  const a = accounts.get(email.toLowerCase())
  if (!a || a.password !== password) throw new FirebaseError('auth/invalid-credential', 'Invalid credential')
  const user = toUser(a.email)!
  setUser(user)
  return { user }
}

export async function createUserWithEmailAndPassword(_auth: unknown, email: string, password: string) {
  await delay()
  const key = email.toLowerCase()
  if (accounts.has(key)) throw new FirebaseError('auth/email-already-in-use', 'Email in use')
  if (password.length < 6) throw new FirebaseError('auth/weak-password', 'Weak password')
  accounts.set(key, { uid: `u-${Math.random().toString(36).slice(2, 12)}`, email: key, password, displayName: '' })
  persist()
  const user = toUser(key)!
  setUser(user)
  return { user }
}

export async function updateProfile(user: FakeUser, data: { displayName?: string }) {
  const a = accounts.get(user.email)
  if (a && data.displayName) {
    a.displayName = data.displayName
    persist()
  }
}

export async function signOut() {
  setUser(null)
}

export async function sendPasswordResetEmail() {
  await delay()
}
