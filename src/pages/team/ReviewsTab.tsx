import { Link } from 'react-router-dom'
import { ChevronRight, Paperclip } from 'lucide-react'
import { StageBadge } from '@/components/domain/StatusBadge'
import { Card } from '@/components/ui'
import { dueLabel, formatDate } from '@/lib/format'
import { stageState } from '@/lib/progress'
import { useTeamContext } from './TeamContext'

export function ReviewsTab() {
  const { cycle, latest, submissions } = useTeamContext()

  return (
    <Card>
      <ul className="divide-y divide-line">
        {cycle.reviews.map((r, i) => {
          const sub = latest.get(r.id)
          const state = stageState(r, sub)
          const versions = submissions.filter((s) => s.reviewId === r.id).length
          return (
            <li key={r.id}>
              <Link to={r.id} className="group flex items-center gap-4 px-5 py-4 hover:bg-subtle/60">
                <span className="tabular flex size-8 shrink-0 items-center justify-center rounded-md border border-line bg-subtle text-[13px] font-semibold text-ink-2">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink group-hover:text-brand">{r.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-[13px] text-ink-3">{r.description}</p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-3">
                    <span className="tabular">Due {formatDate(r.dueDate)}</span>
                    {!sub && <span className={state === 'overdue' ? 'text-bad' : ''}>{dueLabel(r.dueDate)}</span>}
                    {versions > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Paperclip className="size-3" aria-hidden />
                        {versions} {versions === 1 ? 'version' : 'versions'}
                      </span>
                    )}
                    <span className="tabular">
                      {sub?.evaluation ? `${sub.evaluation.marks}/${r.maxMarks} marks` : `${r.maxMarks} marks`}
                    </span>
                  </p>
                </div>
                <StageBadge state={state} />
                <ChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden />
              </Link>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
