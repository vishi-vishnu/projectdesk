import { collection, doc, serverTimestamp, type WriteBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ActivityType } from '@/lib/types'

export interface Actor {
  uid: string
  name: string
}

/** Queue an activity entry in the same batch as the change it describes. */
export function logActivity(batch: WriteBatch, teamId: string, type: ActivityType, actor: Actor, message: string) {
  const ref = doc(collection(db, 'teams', teamId, 'activity'))
  batch.set(ref, {
    type,
    actorId: actor.uid,
    actorName: actor.name,
    message: message.slice(0, 300),
    createdAt: serverTimestamp(),
  })
}
