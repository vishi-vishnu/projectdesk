import { differenceInCalendarDays, format, formatDistanceToNowStrict } from 'date-fns'
import type { Timestamp } from 'firebase/firestore'

type DateLike = Timestamp | Date | null | undefined

export function toDate(value: DateLike): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value.toDate === 'function') return value.toDate()
  return null
}

export function formatDate(value: DateLike, pattern = 'd MMM yyyy'): string {
  const d = toDate(value)
  return d ? format(d, pattern) : '-'
}

export function formatDateTime(value: DateLike): string {
  return formatDate(value, 'd MMM yyyy, h:mm a')
}

export function timeAgo(value: DateLike): string {
  const d = toDate(value)
  if (!d) return 'just now'
  const diff = Date.now() - d.getTime()
  if (diff < 45_000) return 'just now'
  return `${formatDistanceToNowStrict(d)} ago`
}

/** "Due in 5 days", "Due today", "3 days overdue" */
export function dueLabel(value: DateLike, now = new Date()): string {
  const d = toDate(value)
  if (!d) return ''
  const days = differenceInCalendarDays(d, now)
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  if (days > 1) return `Due in ${days} days`
  if (days === -1) return '1 day overdue'
  return `${Math.abs(days)} days overdue`
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** i
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}
