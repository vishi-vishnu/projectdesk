import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import type { AccountStatus, Role } from '@/lib/types'

export interface RegisterInput {
  name: string
  email: string
  password: string
  role: Extract<Role, 'student' | 'faculty'>
  department: string
  regNo?: string
  designation?: string
}

/**
 * Students are active immediately. Faculty accounts start as "pending" until a
 * coordinator approves them. This is enforced in firestore.rules, not just here.
 */
export async function registerAccount(input: RegisterInput) {
  const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password)
  await updateProfile(cred.user, { displayName: input.name.trim() })
  const status: AccountStatus = input.role === 'student' ? 'active' : 'pending'
  await setDoc(doc(db, 'users', cred.user.uid), {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role,
    status,
    department: input.department,
    ...(input.role === 'student' ? { regNo: input.regNo?.trim() ?? '' } : { designation: input.designation?.trim() ?? '' }),
    teamId: null,
    createdAt: serverTimestamp(),
  })
  return cred.user
}

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email.trim(), password)

export const signOutUser = () => signOut(auth)

export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email.trim())

export function updateOwnProfile(uid: string, data: { name: string; department: string; regNo?: string; designation?: string }) {
  return updateDoc(doc(db, 'users', uid), data)
}

export function setAccountStatus(uid: string, status: AccountStatus) {
  return updateDoc(doc(db, 'users', uid), { status })
}
