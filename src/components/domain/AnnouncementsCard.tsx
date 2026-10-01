/**
 * Notices from the coordinator ("Review 2 moved to Friday"). The coordinator
 * can post and delete; everyone else sees the ones meant for their role.
 */
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Megaphone, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card, CardHeader, Dialog, EmptyState, Field, Input, Select, Skeleton, Textarea } from '@/components/ui'
import { useProfile } from '@/context/auth-context'
import { useAnnouncements } from '@/hooks/data'
import { timeAgo } from '@/lib/format'
import { announcementVisibleTo } from '@/lib/notifications'
import type { Audience } from '@/lib/types'
import { deleteAnnouncement, postAnnouncement } from '@/services/announcements'
import { errorMessage } from '@/pages/auth/errors'

const audienceLabel: Record<Audience, string> = { all: 'Everyone', students: 'Students', faculty: 'Faculty' }

const schema = z.object({
  title: z.string().trim().min(3, 'Add a short title.').max(120),
  body: z.string().trim().min(3, 'Write the message.').max(2000),
  audience: z.enum(['all', 'students', 'faculty']),
})
type Values = z.infer<typeof schema>

function PostDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const profile = useProfile()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { title: '', body: '', audience: 'all' } })

  const onSubmit = async (v: Values) => {
    try {
      await postAnnouncement(v, { uid: profile.uid, name: profile.name })
      toast.success('Announcement posted')
      reset()
      onOpenChange(false)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="New announcement"
      description="It shows on dashboards and in the notification bell."
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
            Post announcement
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Title" error={errors.title?.message}>
          {(p) => <Input {...p} placeholder="Review 2 moved to Friday" {...register('title')} />}
        </Field>
        <Field label="Message" error={errors.body?.message}>
          {(p) => <Textarea {...p} rows={5} {...register('body')} />}
        </Field>
        <Field label="Who should see it">
          {(p) => (
            <Select {...p} {...register('audience')}>
              <option value="all">Everyone</option>
              <option value="students">Students only</option>
              <option value="faculty">Faculty only</option>
            </Select>
          )}
        </Field>
      </form>
    </Dialog>
  )
}

export function AnnouncementsCard({ limit = 5 }: { limit?: number }) {
  const profile = useProfile()
  const manage = profile.role === 'coordinator'
  const { data, loading } = useAnnouncements()
  const [open, setOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const visible = data.filter((a) => announcementVisibleTo(a, profile.role))
  const shown = showAll ? visible : visible.slice(0, limit)

  // Students and guides don't need an empty card taking up space.
  if (!manage && !loading && visible.length === 0) return null

  const remove = async (id: string) => {
    try {
      await deleteAnnouncement(id)
      toast.success('Announcement deleted')
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <Card>
      <CardHeader
        title="Announcements"
        actions={
          manage && (
            <Button size="sm" icon={<Plus className="size-3.5" />} onClick={() => setOpen(true)}>
              New
            </Button>
          )
        }
      />
      {loading ? (
        <div className="space-y-2 p-5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-10" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Megaphone />}
          title="No announcements"
          description="Post schedule changes or reminders for students and guides."
        />
      ) : (
        <ul className="divide-y divide-line">
          {shown.map((a) => (
            <li key={a.id} className="group px-5 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13.5px] font-medium text-ink">{a.title}</p>
                {manage && (
                  <button
                    onClick={() => void remove(a.id)}
                    className="-mt-0.5 -mr-1 rounded-md p-1 text-ink-3 hover:bg-bad-soft hover:text-bad"
                    aria-label={`Delete announcement: ${a.title}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-1 text-[13px] whitespace-pre-line text-ink-2">{a.body}</p>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-3">
                <span>
                  {a.authorName} · {timeAgo(a.createdAt)}
                </span>
                {manage && <Badge className="text-[11px]">{audienceLabel[a.audience]}</Badge>}
              </p>
            </li>
          ))}
        </ul>
      )}
      {visible.length > limit && (
        <div className="border-t border-line px-5 py-2.5">
          <button onClick={() => setShowAll((s) => !s)} className="text-[13px] font-medium text-brand hover:underline">
            {showAll ? 'Show fewer' : `Show all ${visible.length}`}
          </button>
        </div>
      )}
      {manage && <PostDialog open={open} onOpenChange={setOpen} />}
    </Card>
  )
}
