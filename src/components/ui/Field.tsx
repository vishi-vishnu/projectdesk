import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from './cn'

const control =
  'w-full rounded-md border border-line-strong bg-surface px-3 text-ink placeholder:text-ink-3 ' +
  'transition-colors duration-150 hover:border-ink-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 ' +
  'disabled:bg-subtle disabled:text-ink-3 aria-[invalid=true]:border-bad aria-[invalid=true]:focus:ring-bad/15'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(control, 'h-9', className)} {...props} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(control, 'min-h-24 py-2 leading-relaxed', className)} {...props} />
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(control, 'h-9 appearance-none pr-9', className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
    </div>
  )
})

interface FieldProps {
  label: string
  hint?: ReactNode
  error?: string
  optional?: boolean
  className?: string
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode
}

/** Label + control + hint/error, wired up for screen readers. */
export function Field({ label, hint, error, optional, className, children }: FieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-ink-2">
        {label}
        {optional && <span className="ml-1 font-normal text-ink-3">(optional)</span>}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {error ? (
        <p id={`${id}-error`} className="text-[12.5px] text-bad" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[12.5px] text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
