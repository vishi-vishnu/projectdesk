import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  meta,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  breadcrumb?: { label: string; to?: string }[]
  meta?: ReactNode
}) {
  return (
    <div className="mb-6">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1 text-[13px] text-ink-3">
          {breadcrumb.map((b, i) => (
            <span key={`${b.label}-${i}`} className="inline-flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3.5" aria-hidden />}
              {b.to ? (
                <Link to={b.to} className="hover:text-ink hover:underline">
                  {b.label}
                </Link>
              ) : (
                <span className="text-ink-2">{b.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[22px] leading-tight font-semibold tracking-[-0.015em] text-ink">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-[14px] text-ink-3">{description}</p>}
          {meta && <div className="mt-2.5 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
