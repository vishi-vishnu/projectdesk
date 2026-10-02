import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Check, ChevronsUpDown, LogOut, Menu as MenuIcon, Monitor, Moon, Sun, UserRound, X } from 'lucide-react'
import { useProfile } from '@/context/auth-context'
import { useTheme, type ThemePreference } from '@/context/theme-context'
import { useActiveCycle } from '@/hooks/data'
import { useSignOut } from '@/hooks/useSignOut'
import { Avatar, cn, Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '@/components/ui'
import { Logo } from './Logo'
import { NotificationBell } from './NotificationBell'
import { ThemeToggle } from './ThemeToggle'
import { navFor, roleLabel } from './nav'

const themeOptions: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'Match system', icon: Monitor },
]

function Sidebar({ onNavigate, showBell = true }: { onNavigate?: () => void; showBell?: boolean }) {
  const { preference, setPreference } = useTheme()
  const profile = useProfile()
  const { cycle } = useActiveCycle()
  const location = useLocation()
  const navigate = useNavigate()
  const signOut = useSignOut()
  const items = navFor(profile)

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between pr-2 pl-4">
        <Logo />
        {showBell && (
          <div className="flex items-center">
            <ThemeToggle />
            <NotificationBell />
          </div>
        )}
      </div>

      <div className="mx-3 mb-3 rounded-md border border-line bg-surface px-3 py-2">
        <p className="text-[11px] font-medium tracking-wide text-ink-3 uppercase">Active cycle</p>
        <p className="truncate text-[13px] font-medium text-ink" title={cycle?.name}>
          {cycle ? cycle.name : 'No active cycle'}
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 px-3" aria-label="Main">
        {items.map((item) => {
          const active =
            location.pathname === item.to ||
            (item.prefix ? location.pathname.startsWith(item.prefix) : location.pathname.startsWith(`${item.to}/`))
          return (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                'flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13.5px] font-medium transition-colors duration-150',
                active ? 'bg-surface text-ink shadow-card ring-1 ring-line' : 'text-ink-2 hover:bg-muted/70 hover:text-ink',
              )}
            >
              <item.icon className={cn('size-4', active ? 'text-brand' : 'text-ink-3')} aria-hidden />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-line p-3">
        <Menu>
          <MenuTrigger className="flex w-full items-center gap-2.5 rounded-md p-1.5 text-left hover:bg-muted/70">
            <Avatar name={profile.name} size={30} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink">{profile.name}</span>
              <span className="block truncate text-[12px] text-ink-3">{roleLabel[profile.role]}</span>
            </span>
            <ChevronsUpDown className="size-4 text-ink-3" aria-hidden />
          </MenuTrigger>
          <MenuContent align="start">
            <MenuLabel>{profile.email}</MenuLabel>
            <MenuSeparator />
            <MenuItem icon={<UserRound />} onSelect={() => navigate('/profile')}>
              Profile
            </MenuItem>
            <MenuSeparator />
            <MenuLabel>Theme</MenuLabel>
            {themeOptions.map((t) => (
              <MenuItem key={t.value} icon={<t.icon />} onSelect={() => setPreference(t.value)}>
                <span className="flex-1">{t.label}</span>
                {preference === t.value && (
                  <span className="text-brand" aria-label="Selected">
                    <Check className="size-3.5" />
                  </span>
                )}
              </MenuItem>
            ))}
            <MenuSeparator />
            <MenuItem icon={<LogOut />} onSelect={() => void signOut()}>
              Sign out
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>
    </div>
  )
}

export function AppShell() {
  const location = useLocation()
  // The drawer belongs to the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === location.pathname
  const setOpen = (value: boolean) => setOpenOn(value ? location.pathname : null)

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh border-r border-line bg-subtle lg:block">
        <Sidebar />
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur lg:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <NotificationBell />
          <button
            onClick={() => setOpen(true)}
            className="rounded-md p-2 text-ink-2 hover:bg-subtle"
            aria-label="Open navigation"
          >
            <MenuIcon className="size-5" />
          </button>
        </div>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-ink/30 animate-fade-in" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[272px] border-r border-line bg-subtle shadow-pop animate-pop-in">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 rounded-md p-1.5 text-ink-3 hover:bg-muted"
              aria-label="Close navigation"
            >
              <X className="size-4" />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} showBell={false} />
          </aside>
        </div>
      )}

      <main className="min-w-0">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
