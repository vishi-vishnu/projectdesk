import { useOutletContext } from 'react-router-dom'
import type { Cycle, Submission, Team, UserProfile } from '@/lib/types'

export interface TeamPermissions {
  isMember: boolean
  isLead: boolean
  isGuide: boolean
  isCoordinator: boolean
  /** Lead can edit title/abstract while the proposal is a draft or was sent back. */
  canEditProject: boolean
  /** Members can upload once the topic is approved. */
  canSubmit: boolean
  /** Assigned guide (or coordinator) grades submissions and approves topics. */
  canEvaluate: boolean
}

export interface TeamContextValue {
  team: Team
  cycle: Cycle
  submissions: Submission[]
  latest: Map<string, Submission>
  members: Record<string, UserProfile>
  guide: UserProfile | null
  viewer: UserProfile
  perms: TeamPermissions
}

export const useTeamContext = () => useOutletContext<TeamContextValue>()

export function computePermissions(team: Team, viewer: UserProfile): TeamPermissions {
  const isMember = team.memberIds.includes(viewer.uid)
  const isLead = team.leadId === viewer.uid
  const isGuide = viewer.role === 'faculty' && team.guideId === viewer.uid
  const isCoordinator = viewer.role === 'coordinator'
  return {
    isMember,
    isLead,
    isGuide,
    isCoordinator,
    canEditProject: isLead && (team.proposalStatus === 'draft' || team.proposalStatus === 'changes_requested'),
    canSubmit: isMember && team.proposalStatus === 'approved',
    canEvaluate: isGuide || isCoordinator,
  }
}
