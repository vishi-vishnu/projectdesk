import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, Clock, History, RotateCcw, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { CommentThread } from '@/components/domain/CommentThread'
import { FileList } from '@/components/domain/FileList'
import { FileUploader, type QueuedFile } from '@/components/domain/FileUploader'
import { StageBadge } from '@/components/domain/StatusBadge'
import { Badge, Button, Card, CardBody, CardHeader, cn, EmptyState, Field, Input, Notice, Textarea } from '@/components/ui'
import { dueLabel, formatDate, formatDateTime, timeAgo } from '@/lib/format'
import { isLateSubmission, stageState } from '@/lib/progress'
import { storageProvider, UploadCancelledError } from '@/lib/storage'
import type { FileRef, ReviewStage, Submission } from '@/lib/types'
import { createSubmission, evaluateSubmission, newSubmissionId } from '@/services/submissions'
import { errorMessage } from '@/pages/auth/errors'
import { useTeamContext } from './TeamContext'

function SubmitForm({ stage, nextVersion, onDone }: { stage: ReviewStage; nextVersion: number; onDone: () => void }) {
  const { team, viewer } = useTeamContext()
  const stageShort = stage.title.split(' — ')[0]
  const [title, setTitle] = useState(nextVersion > 1 ? `${stageShort} — revised` : `${stageShort} submission`)
  const [notes, setNotes] = useState('')
  const [queue, setQueue] = useState<QueuedFile[]>([])
  const [uploading, setUploading] = useState(false)

  const submit = async () => {
    if (queue.length === 0) return toast.error('Attach at least one file.')
    if (title.trim().length < 3) return toast.error('Add a short title for this submission.')
    setUploading(true)
    const id = newSubmissionId(team.id)
    const uploaded: FileRef[] = []
    try {
      // Upload sequentially: keeps progress readable and avoids hammering slow college Wi-Fi.
      for (const q of queue) {
        const ref = await storageProvider.upload(q.file, {
          teamId: team.id,
          submissionId: id,
          onProgress: (progress) => setQueue((prev) => prev.map((p) => (p.id === q.id ? { ...p, progress } : p))),
        })
        uploaded.push(ref)
      }
      await createSubmission(
        { id, team, stage, version: nextVersion, title, notes, files: uploaded },
        { uid: viewer.uid, name: viewer.name },
      )
      toast.success(nextVersion > 1 ? `Version ${nextVersion} submitted` : 'Submitted for review')
      setQueue([])
      setNotes('')
      onDone()
    } catch (e) {
      if (!(e instanceof UploadCancelledError)) toast.error(errorMessage(e, 'Upload failed. Please try again.'))
      setQueue((prev) => prev.map((p) => ({ ...p, progress: 0 })))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Submission title">
        {(p) => <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} disabled={uploading} {...p} />}
      </Field>
      <Field label="Notes for your guide" optional>
        {(p) => (
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={3000}
            disabled={uploading}
            placeholder={nextVersion > 1 ? 'What changed since the last version?' : 'Anything the guide should know before reviewing.'}
            {...p}
          />
        )}
      </Field>
      <FileUploader files={queue} onChange={setQueue} disabled={uploading} />
      <div className="flex justify-end">
        <Button variant="primary" icon={<Upload className="size-4" />} loading={uploading} onClick={submit}>
          {uploading ? 'Uploading…' : nextVersion > 1 ? `Submit version ${nextVersion}` : 'Submit for review'}
        </Button>
      </div>
    </div>
  )
}

function EvaluationForm({ stage, submission }: { stage: ReviewStage; submission: Submission }) {
  const { team, viewer } = useTeamContext()
  const [marks, setMarks] = useState(submission.evaluation ? String(submission.evaluation.marks) : '')
  const [remarks, setRemarks] = useState(submission.evaluation?.remarks ?? '')
  const [busy, setBusy] = useState<'accepted' | 'changes_requested' | null>(null)

  const save = async (status: 'accepted' | 'changes_requested') => {
    const value = Number(marks)
    if (status === 'accepted' && (marks === '' || !Number.isFinite(value) || value < 0 || value > stage.maxMarks)) {
      return toast.error(`Enter marks between 0 and ${stage.maxMarks}.`)
    }
    if (status === 'changes_requested' && !remarks.trim()) {
      return toast.error('Add remarks so the team knows what to fix.')
    }
    setBusy(status)
    try {
      await evaluateSubmission(
        {
          teamId: team.id,
          submissionId: submission.id,
          stage,
          status,
          marks: status === 'accepted' ? value : Number.isFinite(value) && marks !== '' ? value : 0,
          remarks,
        },
        { uid: viewer.uid, name: viewer.name },
      )
      toast.success(status === 'accepted' ? 'Review accepted' : 'Changes requested')
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card className="border-brand-line">
      <CardHeader
        title={submission.evaluation ? 'Update evaluation' : 'Evaluate this submission'}
        description={`Version ${submission.version} · out of ${stage.maxMarks} marks`}
      />
      <CardBody className="space-y-3">
        <Field label="Marks" hint={`0 – ${stage.maxMarks}`}>
          {(p) => (
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              max={stage.maxMarks}
              step={0.5}
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              className="w-32"
              {...p}
            />
          )}
        </Field>
        <Field label="Remarks" hint="Shown to the team with the result.">
          {(p) => <Textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} maxLength={3000} {...p} />}
        </Field>
        <div className="flex flex-wrap justify-end gap-2">
          <Button icon={<RotateCcw className="size-4" />} disabled={busy !== null} loading={busy === 'changes_requested'} onClick={() => save('changes_requested')}>
            Request changes
          </Button>
          <Button variant="success" icon={<Check className="size-4" />} disabled={busy !== null} loading={busy === 'accepted'} onClick={() => save('accepted')}>
            Accept
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

export function ReviewStagePage() {
  const { reviewId } = useParams<{ reviewId: string }>()
  const [params, setParams] = useSearchParams()
  const { team, cycle, submissions, latest, viewer, perms } = useTeamContext()
  const [showForm, setShowForm] = useState(false)

  const stage = cycle.reviews.find((r) => r.id === reviewId)
  const index = cycle.reviews.findIndex((r) => r.id === reviewId)
  const versions = useMemo(
    () => submissions.filter((s) => s.reviewId === reviewId).sort((a, b) => b.version - a.version),
    [submissions, reviewId],
  )

  if (!stage) {
    return <EmptyState title="Review stage not found" action={<Link to=".." relative="path" className="text-brand hover:underline">Back to reviews</Link>} />
  }

  const current = latest.get(stage.id)
  const selectedVersion = Number(params.get('v')) || current?.version
  const selected = versions.find((v) => v.version === selectedVersion) ?? current
  const state = stageState(stage, current)
  const canUpload = perms.canSubmit && current?.status !== 'accepted'
  const nextVersion = (versions[0]?.version ?? 0) + 1
  const formOpen = canUpload && (showForm || !current)

  return (
    <div className="space-y-6">
      <div>
        <Link to="../reviews" relative="path" className="inline-flex items-center gap-1 text-[13px] text-ink-3 hover:text-ink">
          <ArrowLeft className="size-3.5" aria-hidden /> All reviews
        </Link>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[12px] font-medium tracking-wide text-ink-3 uppercase">Stage {index + 1} of {cycle.reviews.length}</p>
            <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.01em]">{stage.title}</h2>
            <p className="mt-1 max-w-[70ch] text-[13.5px] text-ink-2">{stage.description}</p>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden /> Due {formatDate(stage.dueDate, 'EEE, d MMM yyyy')}
              </span>
              {!current && <span className={state === 'overdue' ? 'text-bad' : ''}>{dueLabel(stage.dueDate)}</span>}
              <span>{stage.maxMarks} marks</span>
            </p>
          </div>
          <div className="shrink-0 self-start">
            <StageBadge state={state} />
          </div>
        </div>
      </div>

      {perms.isMember && !perms.canSubmit && (
        <Notice tone="brand">Uploads open once your guide approves the project proposal.</Notice>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {selected ? (
            <Card>
              <CardHeader
                title={selected.title}
                description={
                  <>
                    Version {selected.version} · submitted by {selected.submittedByName} · {formatDateTime(selected.createdAt)}
                    {isLateSubmission(stage, selected) && <Badge tone="bad" className="ml-2">Late</Badge>}
                  </>
                }
                actions={
                  canUpload && !formOpen ? (
                    <Button size="sm" icon={<Upload className="size-3.5" />} onClick={() => setShowForm(true)}>
                      New version
                    </Button>
                  ) : undefined
                }
              />
              <CardBody className="space-y-4">
                {selected.notes && <p className="text-[13.5px] whitespace-pre-wrap text-ink-2">{selected.notes}</p>}
                <FileList files={selected.files} />
                {selected.evaluation && (
                  <div
                    className={cn(
                      'rounded-md border px-4 py-3',
                      selected.status === 'accepted' ? 'border-ok-line bg-ok-soft' : 'border-warn-line bg-warn-soft',
                    )}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-[13.5px] font-semibold">
                        {selected.status === 'accepted' ? 'Accepted' : 'Changes requested'} by {selected.evaluation.evaluatedByName}
                      </p>
                      {selected.status === 'accepted' && (
                        <p className="tabular text-[15px] font-semibold">
                          {selected.evaluation.marks} <span className="text-[13px] font-normal text-ink-3">/ {stage.maxMarks}</span>
                        </p>
                      )}
                    </div>
                    {selected.evaluation.remarks && (
                      <p className="mt-1 text-[13.5px] whitespace-pre-wrap text-ink-2">{selected.evaluation.remarks}</p>
                    )}
                    <p className="mt-1 text-[12px] text-ink-3">{timeAgo(selected.evaluation.evaluatedAt)}</p>
                  </div>
                )}
              </CardBody>
            </Card>
          ) : (
            !formOpen && (
              <Card>
                <EmptyState
                  icon={<Upload />}
                  title="Nothing submitted yet"
                  description={perms.isMember ? undefined : 'The team has not uploaded anything for this review.'}
                />
              </Card>
            )
          )}

          {formOpen && (
            <Card>
              <CardHeader
                title={nextVersion > 1 ? `Submit version ${nextVersion}` : 'Submit for this review'}
                description="All team members and your guide will see these files."
                actions={
                  current ? (
                    <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  ) : undefined
                }
              />
              <CardBody>
                <SubmitForm stage={stage} nextVersion={nextVersion} onDone={() => setShowForm(false)} />
              </CardBody>
            </Card>
          )}

          {selected && (
            <Card>
              <CardHeader title="Comments" description={`On version ${selected.version}. Everyone on the team can see these.`} />
              <CardBody>
                <CommentThread
                  scope={{ kind: 'submission', teamId: team.id, submissionId: selected.id }}
                  viewer={viewer}
                  canPost={perms.isMember || perms.canEvaluate}
                  emptyTitle="No comments on this version"
                  emptyDescription={perms.canEvaluate ? 'Leave feedback for the team here.' : 'Your guide’s feedback will appear here.'}
                  placeholder={perms.canEvaluate ? 'Feedback for the team…' : 'Reply or ask your guide a question…'}
                />
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {perms.canEvaluate && current && <EvaluationForm key={current.id} stage={stage} submission={current} />}

          {versions.length > 0 && (
            <Card>
              <CardHeader title="Version history" />
              <ul className="divide-y divide-line">
                {versions.map((v) => {
                  const active = v.id === selected?.id
                  return (
                    <li key={v.id}>
                      <button
                        onClick={() => setParams(v.version === current?.version ? {} : { v: String(v.version) })}
                        className={cn('flex w-full items-center gap-3 px-5 py-2.5 text-left hover:bg-subtle/60', active && 'bg-brand-soft/60')}
                        aria-current={active}
                      >
                        <History className="size-4 shrink-0 text-ink-3" aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13.5px] font-medium">Version {v.version}</span>
                          <span className="block text-[12px] whitespace-nowrap text-ink-3">{formatDate(v.createdAt, 'd MMM, h:mm a')}</span>
                        </span>
                        <StageBadge state={v.status} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
