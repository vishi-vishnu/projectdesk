import type { ReactNode } from 'react'
import { cn } from './cn'

export type Tone = 'neutral' | 'brand' | 'ok' | 'warn' | 'bad'

const tones: Record<Tone, string> = {
  neutral: 'bg-subtle text-ink-2 border-line',
  brand: 'bg-brand-soft text-brand border-brand-line',
  ok: 'bg-ok-soft text-ok border-ok-line',
  warn: 'bg-warn-soft text-warn border-warn-line',
  bad: 'bg-bad-soft text-bad border-bad-line',
}

const dots: Record<Tone, string> = {
  neutral: 'bg-ink-3',
  brand: 'bg-brand',
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
}

export function Badge({ tone = 'neutral', dot, children, className }: { tone?: Tone; dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-1.5 py-px text-[12px] font-medium leading-5',
        tones[tone],
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', dots[tone])} aria-hidden />}
      {children}
    </span>
  )
}
