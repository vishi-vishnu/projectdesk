import { cn } from '@/components/ui'

/** Wordmark: a simple stacked-sheets mark, drawn inline. */
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="6" width="14" height="15" rx="2" fill="#c3d3ea" />
        <rect x="7" y="3" width="14" height="15" rx="2" fill="#1f4f99" />
        <path d="M10.5 8.5h7M10.5 11.5h7M10.5 14.5h4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {!compact && <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">ProjectDesk</span>}
    </span>
  )
}
