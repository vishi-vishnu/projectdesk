import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'

export function NotFound() {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <p className="font-mono text-[13px] text-ink-3">404</p>
      <h1 className="mt-2 text-[20px] font-semibold">Page not found</h1>
      <p className="mt-1 text-[14px] text-ink-3">The page you're looking for doesn't exist or was moved.</p>
      <Link to="/dashboard" className="mt-6">
        <Button variant="primary">Go to dashboard</Button>
      </Link>
    </div>
  )
}
