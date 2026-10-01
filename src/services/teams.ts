import { arrayRemove, arrayUnion, collection, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { generateJoinCode, normalizeJoinCode } from '@/lib/progress'
import type { ProjectDetails, ProposalStatus, Team } from '@/lib/types'
import { logActivity, type Actor } from './activity'

export interface JoinCodeInfo {
  teamId: string
  teamName: string
  cycleId: string
  leadName: string
}

async function uniqueJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateJoinCode()
    const existing = await getDoc(doc(db, 'joinCodes', code))
    if (!existing.exists()) return code
  }
  throw new Error('Could not generate a unique join code. Please try again.')
}

/**
 * Creates the team, its join code and links the creator, all in one atomic
 * batch so the rules can cross-check the three writes with getAfter().
 */
export async function createTeam(input: { name: string; cycleId: string }, actor: Actor) {
  const code = await uniqueJoinCode()
  const teamRef = doc(collection(db, 'teams'))
  const batch = writeBatch(db)
  batch.set(teamRef, {
    cycleId: input.cycleId,
    name: input.name.trim(),
    leadId: actor.uid,
    memberIds: [actor.uid],
    guideId: null,
    joinCode: code,
    project: { title: '', abstract: '', domain: '', techStack: [] },
    proposalStatus: 'draft',
    proposalRemarks: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  batch.set(doc(db, 'joinCodes', code), {
    teamId: teamRef.id,
    teamName: input.name.trim(),
    cycleId: input.cycleId,
    leadName: actor.name,
  })
  batch.update(doc(db, 'users', actor.uid), { teamId: teamRef.id })
  logActivity(batch, teamRef.id, 'team_created', actor, `${actor.name} created the team`)
  await batch.commit()
  return teamRef.id
}

export async function lookupJoinCode(rawCode: string): Promise<JoinCodeInfo | null> {
  const code = normalizeJoinCode(rawCode)
  if (code.length !== 6) return null
  const snap = await getDoc(doc(db, 'joinCodes', code))
  return snap.exists() ? (snap.data() as JoinCodeInfo) : null
}

export async function joinTeam(rawCode: string, info: JoinCodeInfo, actor: Actor) {
  const code = normalizeJoinCode(rawCode)
  const batch = writeBatch(db)
  batch.update(doc(db, 'teams', info.teamId), {
    memberIds: arrayUnion(actor.uid),
    // Proof of the join code, bound to this user and checked by the security rules.
    lastJoin: { uid: actor.uid, code },
    updatedAt: serverTimestamp(),
  })
  batch.update(doc(db, 'users', actor.uid), { teamId: info.teamId })
  logActivity(batch, info.teamId, 'member_joined', actor, `${actor.name} joined the team`)
  await batch.commit()
}

/** A member leaving, or the team lead removing someone. */
export async function removeMember(team: Team, memberId: string, memberName: string, actor: Actor) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'teams', team.id), { memberIds: arrayRemove(memberId), updatedAt: serverTimestamp() })
  batch.update(doc(db, 'users', memberId), { teamId: null })
  const message =
    memberId === actor.uid ? `${actor.name} left the team` : `${actor.name} removed ${memberName} from the team`
  logActivity(batch, team.id, 'member_left', actor, message)
  await batch.commit()
}

export async function saveProject(team: Team, name: string, project: ProjectDetails) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'teams', team.id), { name: name.trim(), project, updatedAt: serverTimestamp() })
  if (name.trim() !== team.name) batch.update(doc(db, 'joinCodes', team.joinCode), { teamName: name.trim() })
  await batch.commit()
}

export async function submitProposal(team: Team, actor: Actor) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'teams', team.id), { proposalStatus: 'submitted', updatedAt: serverTimestamp() })
  logActivity(batch, team.id, 'proposal_submitted', actor, `${actor.name} submitted the project proposal for approval`)
  await batch.commit()
}

export async function reviewProposal(
  team: Team,
  decision: Extract<ProposalStatus, 'approved' | 'changes_requested'>,
  remarks: string,
  actor: Actor,
) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'teams', team.id), {
    proposalStatus: decision,
    proposalRemarks: remarks.trim(),
    updatedAt: serverTimestamp(),
  })
  const verb = decision === 'approved' ? 'approved the project proposal' : 'requested changes to the proposal'
  logActivity(batch, team.id, 'proposal_reviewed', actor, `${actor.name} ${verb}`)
  await batch.commit()
}

export async function assignGuide(team: Team, guide: { uid: string; name: string } | null, actor: Actor) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'teams', team.id), { guideId: guide?.uid ?? null, updatedAt: serverTimestamp() })
  logActivity(
    batch,
    team.id,
    'guide_assigned',
    actor,
    guide ? `${actor.name} assigned ${guide.name} as project guide` : `${actor.name} removed the project guide`,
  )
  await batch.commit()
}
