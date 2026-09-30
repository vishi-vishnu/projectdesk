import { useNavigate } from 'react-router-dom'
import { signOutUser } from '@/services/users'

/**
 * Explicit sign-out: clear the "return to" location so the next person who
 * signs in on this browser isn't sent to the previous user's page.
 */
export function useSignOut() {
  const navigate = useNavigate()
  return async () => {
    await signOutUser()
    navigate('/login', { replace: true, state: null })
  }
}
