import { collection, doc, getDocs, query, serverTimestamp, Timestamp, where, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface ReviewStageInput {
  id: string
  title: string
  description: string
  dueDate: Date
  maxMarks: number
}

export interface CycleInput {
  name: string
  academicYear: string
  department: string
  maxTeamSize: number
  reviews: ReviewStageInput[]
}

function serializeReviews(reviews: ReviewStageInput[]) {
  return reviews.map((r) => ({ ...r, dueDate: Timestamp.fromDate(r.dueDate) }))
}

/** Creating a cycle makes it the active one; only one cycle is active at a time. */
export async function createCycle(input: CycleInput, createdBy: string) {
  const batch = writeBatch(db)
  const active = await getDocs(query(collection(db, 'cycles'), where('isActive', '==', true)))
  active.forEach((d) => batch.update(d.ref, { isActive: false }))
  const ref = doc(collection(db, 'cycles'))
  batch.set(ref, {
    ...input,
    reviews: serializeReviews(input.reviews),
    isActive: true,
    createdBy,
    createdAt: serverTimestamp(),
  })
  await batch.commit()
  return ref.id
}

export async function updateCycle(id: string, input: CycleInput) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'cycles', id), { ...input, reviews: serializeReviews(input.reviews) })
  await batch.commit()
}

export async function activateCycle(id: string) {
  const batch = writeBatch(db)
  const active = await getDocs(query(collection(db, 'cycles'), where('isActive', '==', true)))
  active.forEach((d) => d.id !== id && batch.update(d.ref, { isActive: false }))
  batch.update(doc(db, 'cycles', id), { isActive: true })
  await batch.commit()
}
