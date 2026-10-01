import { addDoc, collection, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Audience } from '@/lib/types'
import type { Actor } from './activity'

/** Coordinator-only (enforced in firestore.rules): a notice shown on dashboards and in the bell. */
export function postAnnouncement(input: { title: string; body: string; audience: Audience }, actor: Actor) {
  return addDoc(collection(db, 'announcements'), {
    title: input.title.trim(),
    body: input.body.trim(),
    audience: input.audience,
    authorId: actor.uid,
    authorName: actor.name,
    createdAt: serverTimestamp(),
  })
}

export function deleteAnnouncement(id: string) {
  return deleteDoc(doc(db, 'announcements', id))
}
