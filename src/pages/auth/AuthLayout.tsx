import type { ReactNode } from 'react'
import { Check, FileText, MessageSquare } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'

const stages = [
  { name: 'Topic approval', state: 'Approved', tone: 'text-ok' },
  { name: 'Review 1 — Literature survey', state: 'Accepted · 18/20', tone: 'text-ok' },
  { name: 'Review 2 — System design', state: 'Changes requested', tone: 'text-warn' },
  { name: 'Review 3 — Implementation', state: 'Due 14 Mar', tone: 'text-ink-3' },
  { name: 'Review 4 — Final demo & report', state: 'Due 11 Apr', tone: 'text-ink-3' },
]

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[380px]">{children}</div>
        </div>
        <p className="text-[12px] text-ink-3">Final-year project registration and review, in one place.</p>
      </div>

      <aside className="hidden border-l border-line bg-subtle lg:flex lg:flex-col lg:justify-center lg:px-14">
        <div className="max-w-[460px]">
          <p className="text-[12px] font-medium tracking-wide text-ink-3 uppercase">How it works</p>
          <h2 className="mt-2 text-[24px] leading-snug font-semibold tracking-[-0.015em] text-ink">
            Every review, every file and every remark — tracked from topic approval to final viva.
          </h2>

          <div className="mt-8 rounded-lg border border-line bg-surface shadow-card">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div>
                <p className="text-[13px] font-semibold">Smart Irrigation using IoT</p>
                <p className="text-[12px] text-ink-3">Team Aurora · Guide: Dr. R. Meena</p>
              </div>
              <span className="font-mono text-[12px] text-ink-3">62%</span>
            </div>
            <ul className="divide-y divide-line">
              {stages.map((s) => (
                <li key={s.name} className="flex items-center justify-between gap-4 px-4 py-2.5 text-[13px]">
                  <span className="text-ink-2">{s.name}</span>
                  <span className={`shrink-0 text-[12px] font-medium ${s.tone}`}>{s.state}</span>
                </li>
              ))}
            </ul>
          </div>

          <ul className="mt-8 space-y-3 text-[13.5px] text-ink-2">
            <li className="flex gap-3">
              <FileText className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
              Upload review PPTs, reports and screenshots — every resubmission is kept as a version.
            </li>
            <li className="flex gap-3">
              <MessageSquare className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
              Guides comment directly on a submission; the whole team sees the thread.
            </li>
            <li className="flex gap-3">
              <Check className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
              Coordinators see every team's progress without chasing emails.
            </li>
          </ul>
        </div>
      </aside>
    </div>
  )
}
