import { Check } from 'lucide-react'
import { cn } from '@/components/ui'
import { formatDate } from '@/lib/format'
import { stageState, type StageState } from '@/lib/progress'
import type { Cycle, ProposalStatus, Submission } from '@/lib/types'

interface Step {
  label: string
  sub: string
  state: 'done' | 'current' | 'attention' | 'todo'
}

function fromStage(state: StageState): Step['state'] {
  if (state === 'accepted') return 'done'
  if (state === 'changes_requested' || state === 'overdue') return 'attention'
  if (state === 'submitted') return 'current'
  return 'todo'
}

/** Horizontal milestone track: topic approval → Review 1..n. */
export function ReviewStepper({
  proposalStatus,
  cycle,
  latest,
}: {
  proposalStatus: ProposalStatus
  cycle: Cycle
  latest: Map<string, Submission>
}) {
  const steps: Step[] = [
    {
      label: 'Topic',
      sub:
        proposalStatus === 'approved'
          ? 'Approved'
          : proposalStatus === 'submitted'
            ? 'Pending'
            : proposalStatus === 'changes_requested'
              ? 'Revise'
              : 'Draft',
      state:
        proposalStatus === 'approved'
          ? 'done'
          : proposalStatus === 'submitted'
            ? 'current'
            : proposalStatus === 'changes_requested'
              ? 'attention'
              : 'todo',
    },
    ...cycle.reviews.map((r, i) => {
      const sub = latest.get(r.id)
      const state = stageState(r, sub)
      return {
        label: `Review ${i + 1}`,
        sub: sub?.evaluation && state === 'accepted' ? `${sub.evaluation.marks}/${r.maxMarks}` : formatDate(r.dueDate, 'd MMM'),
        state: fromStage(state),
      }
    }),
  ]

  return (
    <ol className="grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((step, i) => (
        <li key={step.label} className="relative flex flex-col items-center text-center">
          {i > 0 && (
            <span
              aria-hidden
              className={cn(
                'absolute top-3 right-1/2 h-px w-full',
                steps[i - 1].state === 'done' ? 'bg-ok' : 'bg-line-strong',
              )}
            />
          )}
          <span
            className={cn(
              'relative z-10 flex size-6 items-center justify-center rounded-full border text-[11px] font-semibold',
              step.state === 'done' && 'border-ok-solid bg-ok-solid text-white',
              step.state === 'current' && 'border-brand bg-brand-soft text-brand',
              step.state === 'attention' && 'border-warn bg-warn-soft text-warn',
              step.state === 'todo' && 'border-line-strong bg-surface text-ink-3',
            )}
          >
            {step.state === 'done' ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : i === 0 ? 'T' : i}
          </span>
          <span className="mt-2 text-[12.5px] font-medium text-ink">{step.label}</span>
          <span className="tabular text-[12px] text-ink-3">{step.sub}</span>
        </li>
      ))}
    </ol>
  )
}
