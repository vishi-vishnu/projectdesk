import * as Dropdown from '@radix-ui/react-dropdown-menu'
import type { ReactNode } from 'react'
import { cn } from './cn'

export const Menu = Dropdown.Root
export const MenuTrigger = Dropdown.Trigger

export function MenuContent({ children, align = 'end' }: { children: ReactNode; align?: 'start' | 'end' }) {
  return (
    <Dropdown.Portal>
      <Dropdown.Content
        align={align}
        sideOffset={6}
        className="z-50 min-w-48 rounded-md border border-line bg-surface p-1 shadow-pop animate-pop-in"
      >
        {children}
      </Dropdown.Content>
    </Dropdown.Portal>
  )
}

export function MenuItem({
  children,
  onSelect,
  icon,
  danger,
}: {
  children: ReactNode
  onSelect?: () => void
  icon?: ReactNode
  danger?: boolean
}) {
  return (
    <Dropdown.Item
      onSelect={onSelect}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-[13px] outline-none select-none',
        'data-[highlighted]:bg-subtle [&>svg]:size-4 [&>svg]:text-ink-3',
        danger ? 'text-bad [&>svg]:text-bad' : 'text-ink',
      )}
    >
      {icon}
      {children}
    </Dropdown.Item>
  )
}

export function MenuSeparator() {
  return <Dropdown.Separator className="my-1 h-px bg-line" />
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <Dropdown.Label className="px-2 py-1.5 text-[12px] text-ink-3">{children}</Dropdown.Label>
}
