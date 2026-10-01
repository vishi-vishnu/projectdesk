import type { ReactNode } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from './cn'

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span role="status" className={cn('inline-flex items-center gap-2 text-ink-3', className)}>
      <Loader2 className="size-4 animate-spin" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} aria-hidden />
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-10 text-center', className)}>
      {icon && <div className="mb-3 text-ink-3 [&>svg]:size-6">{icon}</div>}
      <p className="text-[14px] font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-ink-3">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorNote({ title = 'Something went wrong', children }: { title?: string; children?: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-md border border-bad-line bg-bad-soft px-4 py-3 text-[13px] text-bad" role="alert">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>
        <p className="font-medium">{title}</p>
        {children && <div className="mt-0.5 text-bad/90">{children}</div>}
      </div>
    </div>
  )
}

export function Notice({ tone = 'neutral', icon, children, className }: { tone?: 'neutral' | 'brand' | 'warn' | 'ok' | 'bad'; icon?: ReactNode; children: ReactNode; className?: string }) {
  const tones = {
    neutral: 'border-line bg-subtle text-ink-2',
    brand: 'border-brand-line bg-brand-soft text-ink',
    warn: 'border-warn-line bg-warn-soft text-ink',
    ok: 'border-ok-line bg-ok-soft text-ink',
    bad: 'border-bad-line bg-bad-soft text-ink',
  }
  return (
    <div className={cn('flex gap-3 rounded-md border px-4 py-3 text-[13px]', tones[tone], className)}>
      {icon && <span className="mt-0.5 shrink-0 [&>svg]:size-4">{icon}</span>}
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export function ProgressBar({ value, className, tone = 'brand' }: { value: number; className?: string; tone?: 'brand' | 'ok' }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-300', tone === 'ok' ? 'bg-ok' : 'bg-brand')} style={{ width: `${pct}%` }} />
    </div>
  )
}
