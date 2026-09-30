import { CalendarRange, ClipboardCheck, FolderKanban, LayoutDashboard, UserRound, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { UserProfile } from '@/lib/types'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Match nested routes too (e.g. /teams/123/reviews) */
  prefix?: string
}

export function navFor(profile: UserProfile): NavItem[] {
  switch (profile.role) {
    case 'student':
      return [
        {
          label: profile.teamId ? 'My project' : 'Get started',
          to: profile.teamId ? `/teams/${profile.teamId}` : '/dashboard',
          icon: FolderKanban,
          prefix: '/teams',
        },
        { label: 'Profile', to: '/profile', icon: UserRound },
      ]
    case 'faculty':
      return [
        { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
        { label: 'Review queue', to: '/reviews', icon: ClipboardCheck },
        { label: 'My teams', to: '/teams', icon: FolderKanban, prefix: '/teams' },
        { label: 'Profile', to: '/profile', icon: UserRound },
      ]
    case 'coordinator':
      return [
        { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
        { label: 'Teams', to: '/teams', icon: FolderKanban, prefix: '/teams' },
        { label: 'Review schedule', to: '/cycles', icon: CalendarRange },
        { label: 'People', to: '/people', icon: Users },
        { label: 'Profile', to: '/profile', icon: UserRound },
      ]
  }
}

export const roleLabel: Record<UserProfile['role'], string> = {
  student: 'Student',
  faculty: 'Faculty guide',
  coordinator: 'Project coordinator',
}
