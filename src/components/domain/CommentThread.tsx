import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CheckCircle2, CircleHelp, MessageSquare, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, Badge, Button, cn, EmptyState, Skeleton, Textarea } from '@/components/ui'
import { useComments } from '@/hooks/data'
import { formatDateTime, timeAgo } from '@/lib/format'
import type { Comment, UserProfile } from '@/lib/types'
import { addComment, deleteComment, setCommentResolved } from '@/services/submissions'
import type { CommentScope } from '@/services/refs'
import { errorMessage } from '@/pages/auth/errors'

const roleTag: Record<Comment['authorRole'], string | null> = {
  faculty: 'Guide',
  coordinator: 'Coordinator',
  student: null,
}

function CommentItem({
  comment,
  viewer,
  scope,
}: {
  comment: Comment
  viewer: UserProfile
  scope: CommentScope
}) {
  const isDoubt = comment.kind === 'doubt'
  const staff = comment.authorRole !== 'student'

  const toggleResolved = async () => {
    try {
      await setCommentResolved(scope, comment.id, !comment.resolved)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const remove = async () => {
    if (!window.confirm('Delete this comment?')) return
    try {
      await deleteComment(scope, comment.id)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <li className="group flex gap-3 py-3.5">
      <Avatar name={comment.authorName} size={30} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[13.5px] font-semibold text-ink">{comment.authorName}</span>
          {roleTag[comment.authorRole] && <Badge tone="brand">{roleTag[comment.authorRole]}</Badge>}
          {isDoubt && (
            <Badge tone={comment.resolved ? 'ok' : 'warn'}>{comment.resolved ? 'Doubt · resolved' : 'Doubt'}</Badge>
          )}
          <time className="text-[12px] text-ink-3" title={formatDateTime(comment.createdAt)}>
            {timeAgo(comment.createdAt)}
          </time>
        </div>
        <p
          className={cn(
            'mt-1 text-[14px] leading-relaxed whitespace-pre-wrap text-ink-2',
            staff && 'text-ink',
            isDoubt && comment.resolved && 'text-ink-3',
          )}
        >
          {comment.body}
        </p>
        <div className="mt-1.5 flex gap-3 text-[12.5px]">
          {isDoubt && (
            <button onClick={toggleResolved} className="font-medium text-ink-3 hover:text-ink">
              {comment.resolved ? 'Reopen' : 'Mark resolved'}
            </button>
          )}
          {comment.authorId === viewer.uid && (
            <button
              onClick={remove}
              className="inline-flex items-center gap-1 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100 hover:text-bad focus:opacity-100"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Delete
            </button>
          )}
        </div>
      </div>
    </li>
  )
}

export function CommentThread({
  scope,
  viewer,
  canPost,
  emptyTitle = 'No comments yet',
  emptyDescription,
  placeholder = 'Write a comment…',
}: {
  scope: CommentScope
  viewer: UserProfile
  canPost: boolean
  emptyTitle?: string
  emptyDescription?: string
  placeholder?: string
}) {
  const { data: comments, loading } = useComments(scope)
  const [body, setBody] = useState('')
  const [asDoubt, setAsDoubt] = useState(false)
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const count = useRef(0)

  useEffect(() => {
    // Keep the newest message in view when someone posts.
    if (comments.length > count.current && count.current > 0) endRef.current?.scrollIntoView({ block: 'nearest' })
    count.current = comments.length
  }, [comments.length])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setSending(true)
    try {
      await addComment(
        scope,
        { body, kind: asDoubt ? 'doubt' : 'comment' },
        { uid: viewer.uid, name: viewer.name, role: viewer.role },
      )
      setBody('')
      setAsDoubt(false)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  const openDoubts = comments.filter((c) => c.kind === 'doubt' && !c.resolved).length

  return (
    <div>
      {openDoubts > 0 && (
        <p className="mb-2 inline-flex items-center gap-1.5 text-[12.5px] text-warn">
          <CircleHelp className="size-3.5" aria-hidden />
          {openDoubts} open {openDoubts === 1 ? 'doubt' : 'doubts'}
        </p>
      )}

      {loading ? (
        <div className="space-y-4 py-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-2/3" />
        </div>
      ) : comments.length === 0 ? (
        <EmptyState icon={<MessageSquare />} title={emptyTitle} description={emptyDescription} className="py-8" />
      ) : (
        <ul className="divide-y divide-line">
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} viewer={viewer} scope={scope} />
          ))}
        </ul>
      )}
      <div ref={endRef} />

      {canPost && (
        <form onSubmit={submit} className="mt-3 rounded-md border border-line-strong bg-surface focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15">
          <label htmlFor={`composer-${scope.kind}`} className="sr-only">
            Comment
          </label>
          <Textarea
            id={`composer-${scope.kind}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void submit(e)
            }}
            placeholder={placeholder}
            maxLength={2000}
            className="min-h-20 resize-y border-0 hover:border-0 focus:ring-0"
          />
          <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2">
            {viewer.role === 'student' ? (
              <label className="inline-flex items-center gap-2 text-[13px] text-ink-2 select-none">
                <input
                  type="checkbox"
                  checked={asDoubt}
                  onChange={(e) => setAsDoubt(e.target.checked)}
                  className="size-4 accent-[var(--color-brand)]"
                />
                Mark as a doubt for the guide
              </label>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-3">
                <CheckCircle2 className="size-3.5" aria-hidden />
                Visible to all team members
              </span>
            )}
            <Button type="submit" size="sm" variant="primary" loading={sending} disabled={!body.trim()}>
              Post
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
