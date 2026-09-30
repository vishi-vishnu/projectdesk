import type { Timestamp } from 'firebase/firestore'

export type Role = 'student' | 'faculty' | 'coordinator'
export type AccountStatus = 'active' | 'pending' | 'rejected'

export interface UserProfile {
  uid: string
  name: string
  email: string
  role: Role
  status: AccountStatus
  department: string
  /** Students only: university register number */
  regNo?: string
  /** Faculty only: e.g. "Assistant Professor" */
  designation?: string
  teamId: string | null
  createdAt: Timestamp
}

export interface ReviewStage {
  id: string
  title: string
  description: string
  dueDate: Timestamp
  maxMarks: number
}

export interface Cycle {
  id: string
  name: string
  academicYear: string
  department: string
  isActive: boolean
  maxTeamSize: number
  reviews: ReviewStage[]
  createdBy: string
  createdAt: Timestamp
}

export type ProposalStatus = 'draft' | 'submitted' | 'approved' | 'changes_requested'

export interface ProjectDetails {
  title: string
  abstract: string
  domain: string
  techStack: string[]
}

export interface Team {
  id: string
  cycleId: string
  name: string
  leadId: string
  memberIds: string[]
  guideId: string | null
  joinCode: string
  project: ProjectDetails
  proposalStatus: ProposalStatus
  proposalRemarks: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type StorageProviderId = 'firebase' | 'cloudinary' | 'static'

export interface FileRef {
  name: string
  url: string
  /** Provider-specific key: storage path or Cloudinary public_id */
  path: string
  size: number
  contentType: string
  provider: StorageProviderId
}

export type SubmissionStatus = 'submitted' | 'changes_requested' | 'accepted'

export interface Evaluation {
  marks: number
  remarks: string
  evaluatedBy: string
  evaluatedByName: string
  evaluatedAt: Timestamp
}

export interface Submission {
  id: string
  teamId: string
  cycleId: string
  reviewId: string
  version: number
  title: string
  notes: string
  files: FileRef[]
  submittedBy: string
  submittedByName: string
  createdAt: Timestamp
  status: SubmissionStatus
  evaluation: Evaluation | null
}

export type CommentKind = 'comment' | 'doubt'

export interface Comment {
  id: string
  authorId: string
  authorName: string
  authorRole: Role
  body: string
  kind: CommentKind
  resolved: boolean
  createdAt: Timestamp
}

export type ActivityType =
  | 'team_created'
  | 'member_joined'
  | 'member_left'
  | 'proposal_submitted'
  | 'proposal_reviewed'
  | 'submission_created'
  | 'submission_evaluated'
  | 'guide_assigned'

export interface Activity {
  id: string
  type: ActivityType
  actorId: string
  actorName: string
  message: string
  createdAt: Timestamp
}
