import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/components/ui'

export function StatCard({
  label,
  value,
  hint,
  to,
  tone,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  to?: string
  tone?: 'warn' | 'bad'
}) {
  const body = (
    <>
      <p className="text-[12.5px] font-medium text-ink-3">{label}</p>
      <p
        className={cn(
          'tabular mt-1 text-[26px] leading-none font-semibold tracking-[-0.02em]',
          tone === 'warn' ? 'text-warn' : tone === 'bad' ? 'text-bad' : 'text-ink',
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-2 text-[12.5px] text-ink-3">{hint}</p>}
    </>
  )
  const cls = 'block rounded-lg border border-line bg-surface px-4 py-3.5 shadow-card'
  return to ? (
    <Link to={to} className={cn(cls, 'transition-colors hover:border-line-strong hover:bg-subtle/40')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}
