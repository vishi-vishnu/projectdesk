/**
 * Project proposal (topic approval).
 * The team lead edits and submits the title and abstract; the guide approves
 * it or sends it back with remarks. Review uploads unlock after approval.
 */
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Check, RotateCcw, Send } from 'lucide-react'
import { ProposalBadge } from '@/components/domain/StatusBadge'
import { Badge, Button, Card, CardBody, CardHeader, Field, Input, Notice, Select, Textarea } from '@/components/ui'
import { useActiveFaculty } from '@/hooks/data'
import { reviewProposal, saveProject, submitProposal } from '@/services/teams'
import { errorMessage } from '@/pages/auth/errors'
import { useTeamContext } from './TeamContext'

const schema = z.object({
  name: z.string().trim().min(2, 'Team name is required.').max(60),
  title: z.string().trim().max(150),
  domain: z.string().trim().max(60),
  techStack: z.string().trim().max(300),
  abstract: z.string().trim().max(3000),
  preferredGuideId: z.string(),
})
type Values = z.infer<typeof schema>

const MIN_ABSTRACT = 50

function ProposalForm() {
  const { team, viewer } = useTeamContext()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      name: team.name,
      title: team.project.title,
      domain: team.project.domain,
      techStack: team.project.techStack.join(', '),
      abstract: team.project.abstract,
      preferredGuideId: team.project.preferredGuideId ?? '',
    },
  })
  // Only worth asking while the coordinator hasn't picked a guide.
  const { data: faculty, loading: facultyLoading } = useActiveFaculty(!team.guideId)
  const [submitting, setSubmitting] = useState(false)
  const abstractLength = watch('abstract')?.length ?? 0

  const toProject = (v: Values) => ({
    title: v.title,
    abstract: v.abstract,
    domain: v.domain,
    techStack: v.techStack
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12),
    preferredGuideId: v.preferredGuideId || null,
  })

  const onSave = async (v: Values) => {
    try {
      await saveProject(team, v.name, toProject(v))
      reset(v)
      toast.success('Proposal saved')
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const onSubmitForApproval = handleSubmit(async (v) => {
    if (v.title.length < 5) return toast.error('Add a project title (at least 5 characters) before submitting.')
    if (v.abstract.length < MIN_ABSTRACT) return toast.error(`The abstract needs at least ${MIN_ABSTRACT} characters.`)
    setSubmitting(true)
    try {
      if (isDirty) await saveProject(team, v.name, toProject(v))
      await submitProposal(team, { uid: viewer.uid, name: viewer.name })
      toast.success('Proposal sent to your guide')
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Team name" error={errors.name?.message}>
          {(p) => <Input {...p} {...register('name')} />}
        </Field>
        <Field label="Domain" optional hint="e.g. IoT, Machine Learning, Web">
          {(p) => <Input {...p} {...register('domain')} />}
        </Field>
      </div>
      <Field label="Project title" error={errors.title?.message}>
        {(p) => <Input placeholder="e.g. Smart irrigation using soil-moisture sensing and LoRa" {...p} {...register('title')} />}
      </Field>
      <div className={team.guideId ? '' : 'grid gap-4 sm:grid-cols-2'}>
        <Field label="Tools & technologies" optional hint="Comma separated, for example ESP32, Python, Firebase">
          {(p) => <Input {...p} {...register('techStack')} />}
        </Field>
        {!team.guideId && (
          <Field label="Preferred guide" optional hint="A request only. The coordinator makes the final choice.">
            {(p) =>
              facultyLoading ? (
                <Select {...p} disabled>
                  <option>Loading guides…</option>
                </Select>
              ) : (
                <Select {...p} {...register('preferredGuideId')}>
                  <option value="">No preference</option>
                  {faculty.map((f) => (
                    <option key={f.uid} value={f.uid}>
                      {f.name}
                      {f.designation ? `, ${f.designation}` : ''}
                    </option>
                  ))}
                </Select>
              )
            }
          </Field>
        )}
      </div>
      <Field
        label="Abstract"
        hint={`${abstractLength} characters · at least ${MIN_ABSTRACT} required to submit`}
        error={errors.abstract?.message}
      >
        {(p) => (
          <Textarea
            rows={8}
            placeholder="Problem, proposed solution, expected outcome."
            {...p}
            {...register('abstract')}
          />
        )}
      </Field>
      <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          Save draft
        </Button>
        <Button variant="primary" icon={<Send className="size-4" />} loading={submitting} onClick={onSubmitForApproval}>
          Submit for approval
        </Button>
      </div>
    </form>
  )
}

function GuideDecision() {
  const { team, viewer } = useTeamContext()
  const [remarks, setRemarks] = useState('')
  const [busy, setBusy] = useState<'approved' | 'changes_requested' | null>(null)

  const decide = async (decision: 'approved' | 'changes_requested') => {
    if (decision === 'changes_requested' && !remarks.trim()) {
      return toast.error('Add a remark so the team knows what to change.')
    }
    setBusy(decision)
    try {
      await reviewProposal(team, decision, remarks, { uid: viewer.uid, name: viewer.name })
      toast.success(decision === 'approved' ? 'Topic approved' : 'Sent back to the team')
      setRemarks('')
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card className="border-brand-line">
      <CardHeader title="Your decision" description="The team can start uploading review files once you approve the topic." />
      <CardBody className="space-y-3">
        <Field label="Remarks" optional hint="Required when requesting changes. Visible to the whole team.">
          {(p) => <Textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} {...p} />}
        </Field>
        <div className="flex flex-wrap justify-end gap-2">
          <Button icon={<RotateCcw className="size-4" />} loading={busy === 'changes_requested'} disabled={busy !== null} onClick={() => decide('changes_requested')}>
            Request changes
          </Button>
          <Button variant="success" icon={<Check className="size-4" />} loading={busy === 'approved'} disabled={busy !== null} onClick={() => decide('approved')}>
            Approve topic
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

export function ProposalTab() {
  const { team, perms } = useTeamContext()
  const p = team.project
  const wantsGuide = !team.guideId && Boolean(p.preferredGuideId) && !perms.canEditProject
  const { data: faculty } = useActiveFaculty(wantsGuide)
  const preferred = wantsGuide ? faculty.find((f) => f.uid === p.preferredGuideId) : undefined

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        {team.proposalStatus === 'changes_requested' && team.proposalRemarks && (
          <Notice tone="warn">
            <p className="font-semibold">Guide's remarks</p>
            <p className="mt-1 whitespace-pre-wrap">{team.proposalRemarks}</p>
          </Notice>
        )}

        <Card>
          <CardHeader title="Project proposal" actions={<ProposalBadge status={team.proposalStatus} />} />
          <CardBody>
            {perms.canEditProject ? (
              <ProposalForm />
            ) : (
              <dl className="space-y-5">
                <div>
                  <dt className="text-[12px] font-medium text-ink-3">Title</dt>
                  <dd className="mt-0.5 text-[15px] font-medium">{p.title || 'Not added yet'}</dd>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <dt className="text-[12px] font-medium text-ink-3">Domain</dt>
                    <dd className="mt-0.5">{p.domain || 'Not added yet'}</dd>
                  </div>
                  <div>
                    <dt className="text-[12px] font-medium text-ink-3">Tools & technologies</dt>
                    <dd className="mt-1 flex flex-wrap gap-1.5">
                      {p.techStack.length ? p.techStack.map((t) => <Badge key={t}>{t}</Badge>) : 'Not added yet'}
                    </dd>
                  </div>
                </div>
                <div>
                  <dt className="text-[12px] font-medium text-ink-3">Abstract</dt>
                  <dd className="mt-1 max-w-[70ch] leading-relaxed whitespace-pre-wrap text-ink-2">{p.abstract || 'Not added yet'}</dd>
                </div>
                {preferred && (
                  <div>
                    <dt className="text-[12px] font-medium text-ink-3">Preferred guide</dt>
                    <dd className="mt-0.5">{preferred.name}</dd>
                  </div>
                )}
                {team.proposalStatus !== 'changes_requested' && team.proposalRemarks && (
                  <div>
                    <dt className="text-[12px] font-medium text-ink-3">Guide's remarks</dt>
                    <dd className="mt-1 whitespace-pre-wrap text-ink-2">{team.proposalRemarks}</dd>
                  </div>
                )}
              </dl>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="space-y-6">
        {perms.canEvaluate && team.proposalStatus === 'submitted' && <GuideDecision />}
        <Card>
          <CardBody className="space-y-2 text-[13px] text-ink-2">
            <p className="font-medium text-ink">How approval works</p>
            <ol className="list-decimal space-y-1.5 pl-4">
              <li>The team lead drafts the title and abstract.</li>
              <li>The lead submits it to the assigned guide.</li>
              <li>The guide approves it or sends it back with remarks.</li>
              <li>After approval, the team can upload files for each review.</li>
            </ol>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
