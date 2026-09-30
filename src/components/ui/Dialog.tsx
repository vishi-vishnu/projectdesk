import * as RadixDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from './cn'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }

export function Dialog({ open, onOpenChange, title, description, children, footer, size = 'md' }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-ink/30 animate-fade-in" />
        <RadixDialog.Content
          className={cn(
            'fixed top-[8vh] left-1/2 z-50 flex max-h-[84vh] w-[calc(100vw-32px)] -translate-x-1/2 flex-col',
            'rounded-lg border border-line bg-surface shadow-pop animate-pop-in focus:outline-none',
            widths[size],
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <RadixDialog.Title className="text-[15px] font-semibold">{title}</RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className="mt-1 text-[13px] text-ink-3">{description}</RadixDialog.Description>
              ) : (
                <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close className="-mr-1 rounded-md p-1 text-ink-3 hover:bg-subtle hover:text-ink" aria-label="Close">
              <X className="size-4" />
            </RadixDialog.Close>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-line bg-subtle/60 px-5 py-3">{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
