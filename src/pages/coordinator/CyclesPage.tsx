/**
 * Review schedule. A project cycle holds the team size limit and the review
 * stages (title, due date, marks). Only one cycle is active at a time.
 */
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addDays, format } from 'date-fns'
import { CalendarPlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge, Button, Card, CardHeader, Dialog, EmptyState, Field, Input, Select, Skeleton, Textarea } from '@/components/ui'
import { useProfile } from '@/context/auth-context'
import { useCycles } from '@/hooks/data'
import { DEFAULT_REVIEWS, DEPARTMENTS } from '@/lib/constants'
import { dueLabel, formatDate } from '@/lib/format'
import type { Cycle } from '@/lib/types'
import { activateCycle, createCycle, updateCycle } from '@/services/cycles'
import { errorMessage } from '@/pages/auth/errors'

const stageSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(3, 'Required').max(80, 'Keep it under 80 characters'),
  description: z.string().trim().max(600),
  dueDate: z.string().min(1, 'Pick a date'),
  maxMarks: z.coerce.number<number>().int().min(1, 'Min 1').max(100, 'Max 100'),
})

const schema = z.object({
  name: z.string().trim().min(3, 'Give the cycle a name.').max(100),
  academicYear: z.string().trim().min(4, 'For example 2025-26'),
  department: z.string().min(1, 'Choose a department.'),
  maxTeamSize: z.coerce.number<number>().int().min(1).max(6),
  reviews: z.array(stageSchema).min(1, 'Add at least one review stage.').max(8),
})
type Values = z.infer<typeof schema>

const toInputDate = (d: Date) => format(d, 'yyyy-MM-dd')

function defaults(cycle?: Cycle): Values {
  if (cycle) {
    return {
      name: cycle.name,
      academicYear: cycle.academicYear,
      department: cycle.department,
      maxTeamSize: cycle.maxTeamSize,
      reviews: cycle.reviews.map((r) => ({ ...r, dueDate: toInputDate(r.dueDate.toDate()) })),
    }
  }
  const year = new Date().getFullYear()
  return {
    name: `Final Year Project ${year}-${String(year + 1).slice(2)}`,
    academicYear: `${year}-${String(year + 1).slice(2)}`,
    department: '',
    maxTeamSize: 4,
    reviews: DEFAULT_REVIEWS.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      maxMarks: r.maxMarks,
      dueDate: toInputDate(addDays(new Date(), r.offsetDays)),
    })),
  }
}

function CycleForm({ cycle, onDone }: { cycle?: Cycle; onDone: () => void }) {
  const profile = useProfile()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults(cycle) })
  const { fields, append, remove } = useFieldArray({ control, name: 'reviews', keyName: 'key' })

  const onSubmit = async (v: Values) => {
    const input = {
      ...v,
      reviews: v.reviews.map((r) => ({ ...r, dueDate: new Date(`${r.dueDate}T17:00:00`) })),
    }
    try {
      if (cycle) await updateCycle(cycle.id, input)
      else await createCycle(input, profile.uid)
      toast.success(cycle ? 'Schedule updated' : 'Project cycle created and set as active')
      onDone()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const nextId = () => {
    const used = new Set(fields.map((f) => f.id))
    let i = fields.length + 1
    while (used.has(`r${i}`)) i++
    return `r${i}`
  }

  return (
    <form id="cycle-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cycle name" error={errors.name?.message} className="sm:col-span-2">
          {(p) => <Input {...p} {...register('name')} />}
        </Field>
        <Field label="Academic year" error={errors.academicYear?.message}>
          {(p) => <Input {...p} {...register('academicYear')} />}
        </Field>
        <Field label="Max team size" error={errors.maxTeamSize?.message}>
          {(p) => (
            <Select {...p} {...register('maxTeamSize')}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'student' : 'students'}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Department" error={errors.department?.message} className="sm:col-span-2">
          {(p) => (
            <Select {...p} {...register('department')}>
              <option value="" disabled>
                Select department
              </option>
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[13px] font-medium text-ink-2">Review stages</p>
          <Button
            size="sm"
            variant="ghost"
            icon={<Plus className="size-3.5" />}
            disabled={fields.length >= 8}
            onClick={() =>
              append({
                id: nextId(),
                title: `Review ${fields.length + 1}`,
                description: '',
                maxMarks: 20,
                dueDate: toInputDate(addDays(new Date(), 30)),
              })
            }
          >
            Add stage
          </Button>
        </div>
        <ol className="space-y-3">
          {fields.map((f, i) => (
            <li key={f.key} className="rounded-md border border-line bg-subtle/50 p-3">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px_90px_auto] sm:items-start">
                <Field label={`Stage ${i + 1} title`} error={errors.reviews?.[i]?.title?.message}>
                  {(p) => <Input {...p} {...register(`reviews.${i}.title`)} />}
                </Field>
                <Field label="Due date" error={errors.reviews?.[i]?.dueDate?.message}>
                  {(p) => <Input type="date" {...p} {...register(`reviews.${i}.dueDate`)} />}
                </Field>
                <Field label="Marks" error={errors.reviews?.[i]?.maxMarks?.message}>
                  {(p) => <Input type="number" min={1} max={100} {...p} {...register(`reviews.${i}.maxMarks`)} />}
                </Field>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  disabled={fields.length <= 1 || Boolean(cycle)}
                  title={cycle ? 'Stages can’t be removed once a cycle is running' : 'Remove stage'}
                  className="mt-6 self-start rounded-md p-2 text-ink-3 hover:bg-bad-soft hover:text-bad disabled:pointer-events-none disabled:opacity-40"
                  aria-label={`Remove stage ${i + 1}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <Field label="What to submit" optional className="mt-3">
                {(p) => <Textarea rows={2} className="min-h-0" {...p} {...register(`reviews.${i}.description`)} />}
              </Field>
            </li>
          ))}
        </ol>
        {errors.reviews?.message && <p className="mt-2 text-[12.5px] text-bad">{errors.reviews.message}</p>}
      </div>

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button onClick={onDone}>Cancel</Button>
        <Button type="submit" variant="primary" loading={isSubmitting}>
          {cycle ? 'Save schedule' : 'Create cycle'}
        </Button>
      </div>
    </form>
  )
}

export function CyclesPage() {
  const { data: cycles, loading } = useCycles()
  const [editing, setEditing] = useState<Cycle | 'new' | null>(null)
  const active = cycles.find((c) => c.isActive)
  const past = cycles.filter((c) => !c.isActive)

  const activate = async (c: Cycle) => {
    if (!window.confirm(`Make "${c.name}" the active cycle? Students will register teams into it.`)) return
    try {
      await activateCycle(c.id)
      toast.success(`${c.name} is now active`)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <>
      <PageHeader
        title="Review schedule"
        description="Project cycles define team size, the review stages, their due dates and marks."
        actions={
          <Button variant="primary" icon={<CalendarPlus className="size-4" />} onClick={() => setEditing('new')}>
            New cycle
          </Button>
        }
      />

      {loading ? (
        <Skeleton className="h-72" />
      ) : !active ? (
        <Card>
          <EmptyState
            icon={<CalendarPlus />}
            title="No active cycle"
            description="Create a cycle to open team registration for students."
            action={
              <Button variant="primary" onClick={() => setEditing('new')}>
                Create project cycle
              </Button>
            }
          />
        </Card>
      ) : (
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                {active.name}
                <Badge tone="ok" dot>
                  Active
                </Badge>
              </span>
            }
            description={`${active.department} · ${active.academicYear} · teams of up to ${active.maxTeamSize}`}
            actions={
              <Button size="sm" icon={<Pencil className="size-3.5" />} onClick={() => setEditing(active)}>
                Edit schedule
              </Button>
            }
          />
          <ol className="divide-y divide-line">
            {active.reviews.map((r, i) => (
              <li key={r.id} className="grid gap-2 px-5 py-3.5 sm:grid-cols-[32px_minmax(0,1fr)_150px_80px] sm:items-start">
                <span className="tabular flex size-7 items-center justify-center rounded-md border border-line bg-subtle text-[12.5px] font-semibold text-ink-2">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{r.title}</p>
                  {r.description && <p className="mt-0.5 text-[13px] text-ink-3">{r.description}</p>}
                </div>
                <div className="text-[13px]">
                  <p className="tabular">{formatDate(r.dueDate, 'EEE, d MMM yyyy')}</p>
                  <p className="text-[12px] text-ink-3">{dueLabel(r.dueDate)}</p>
                </div>
                <p className="tabular text-[13px] text-ink-2 sm:text-right">{r.maxMarks} marks</p>
              </li>
            ))}
          </ol>
          <div className="flex justify-end border-t border-line px-5 py-3 text-[13px] text-ink-2">
            Total: <span className="tabular ml-1 font-semibold">{active.reviews.reduce((s, r) => s + r.maxMarks, 0)} marks</span>
          </div>
        </Card>
      )}

      {past.length > 0 && (
        <Card className="mt-6">
          <CardHeader title="Other cycles" />
          <ul className="divide-y divide-line">
            {past.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-[12.5px] text-ink-3">
                    {c.department} · created {formatDate(c.createdAt)}
                  </p>
                </div>
                <Button size="sm" onClick={() => activate(c)}>
                  Make active
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing === 'new' ? 'New project cycle' : 'Edit review schedule'}
        description={
          editing === 'new'
            ? 'The new cycle becomes active immediately. Existing teams stay in their current cycle.'
            : 'Changes apply to all teams in this cycle.'
        }
        size="lg"
      >
        {editing && <CycleForm cycle={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />}
      </Dialog>
    </>
  )
}
