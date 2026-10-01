import { initials } from '@/lib/format'
import { cn } from './cn'

// Muted, distinguishable fills, picked from the name so a person keeps their colour.
const fills = ['#dfe7f3', '#e5efe6', '#f3e9dc', '#ece4f1', '#e2eef0', '#f1e3e3', '#e8e8df']
const inks = ['#1f4f99', '#17663d', '#8a4f00', '#5b3a7a', '#1e6070', '#8f2f2a', '#4d4d40']

function hash(value: string) {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0
  return h
}

export function Avatar({ name, size = 28, className }: { name: string; size?: number; className?: string }) {
  const i = hash(name) % fills.length
  return (
    <span
      aria-hidden
      className={cn('inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold', className)}
      style={{ width: size, height: size, background: fills[i], color: inks[i], fontSize: Math.round(size * 0.38) }}
    >
      {initials(name)}
    </span>
  )
}
