import { useProfile } from '@/context/auth-context'
import { CoordinatorDashboard } from './coordinator/CoordinatorDashboard'
import { FacultyDashboard } from './faculty/FacultyDashboard'
import { StudentHome } from './student/StudentHome'

export function Dashboard() {
  const profile = useProfile()
  if (profile.role === 'coordinator') return <CoordinatorDashboard />
  if (profile.role === 'faculty') return <FacultyDashboard />
  return <StudentHome />
}
