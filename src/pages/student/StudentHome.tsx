/**
 * First screen for a student without a team: create a team (and become the
 * lead) or join one with the 6-character code. Students already in a team are
 * redirected to their team page.
 */
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ArrowRight, CalendarX, KeyRound, Users } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, Card, CardBody, Dialog, EmptyState, ErrorNote, Field, Input, Skeleton } from '@/components/ui'
import { useProfile } from '@/context/auth-context'
import { useActiveCycle } from '@/hooks/data'
import { formatDate } from '@/lib/format'
import { normalizeJoinCode } from '@/lib/progress'
import { createTeam, joinTeam, lookupJoinCode, type JoinCodeInfo } from '@/services/teams'
import { errorMessage } from '@/pages/auth/errors'

function CreateTeamCard({ cycleId }: { cycleId: string }) {
  const profile = useProfile()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const create = async () => {
    if (name.trim().length < 2) return toast.error('Give your team a name.')
    setBusy(true)
    try {
      await createTeam({ name, cycleId }, { uid: profile.uid, name: profile.name })
      toast.success('Team created. Share the join code with your teammates.')
    } catch (e) {
      toast.error(errorMessage(e))
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex size-9 items-center justify-center rounded-md bg-brand-soft text-brand">
          <Users className="size-4" aria-hidden />
        </div>
        <div>
          <h2 className="font-semibold">Create a team</h2>
          <p className="mt-1 text-[13px] text-ink-3">You'll be the team lead. You get a code to share with your teammates.</p>
        </div>
        <Field label="Team name">
          {(p) => (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && create()}
              placeholder="e.g. Team Aurora"
              maxLength={60}
              {...p}
            />
          )}
        </Field>
        <Button variant="primary" onClick={create} loading={busy} className="w-full">
          Create team
        </Button>
      </CardBody>
    </Card>
  )
}

function JoinTeamCard() {
  const profile = useProfile()
  const [code, setCode] = useState('')
  const [found, setFound] = useState<JoinCodeInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const lookup = async () => {
    setError(null)
    if (normalizeJoinCode(code).length !== 6) return setError('Join codes are 6 characters, e.g. K7M2QX.')
    setBusy(true)
    try {
      const info = await lookupJoinCode(code)
      if (!info) setError('No team uses that code. Check it with your team lead.')
      else setFound(info)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const confirm = async () => {
    if (!found) return
    setBusy(true)
    try {
      await joinTeam(code, found, { uid: profile.uid, name: profile.name })
      toast.success(`You joined ${found.teamName}`)
    } catch (e) {
      setFound(null)
      setBusy(false)
      setError(
        e instanceof Error && 'code' in e && e.code === 'permission-denied'
          ? 'Could not join. The team may be full.'
          : errorMessage(e),
      )
    }
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex size-9 items-center justify-center rounded-md bg-subtle text-ink-2">
          <KeyRound className="size-4" aria-hidden />
        </div>
        <div>
          <h2 className="font-semibold">Join with a code</h2>
          <p className="mt-1 text-[13px] text-ink-3">Ask your team lead for the 6-character join code.</p>
        </div>
        <Field label="Join code" error={error ?? undefined}>
          {(p) => (
            <Input
              value={code}
              onChange={(e) => setCode(normalizeJoinCode(e.target.value).slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && lookup()}
              placeholder="K7M2QX"
              className="font-mono tracking-[0.2em] uppercase"
              {...p}
            />
          )}
        </Field>
        <Button onClick={lookup} loading={busy && !found} className="w-full" icon={<ArrowRight className="size-4" />}>
          Find team
        </Button>
      </CardBody>

      <Dialog
        open={found !== null}
        onOpenChange={(o) => !o && setFound(null)}
        title={`Join ${found?.teamName ?? ''}?`}
        description={`Team lead: ${found?.leadName ?? ''}`}
        size="sm"
        footer={
          <>
            <Button onClick={() => setFound(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirm} loading={busy}>
              Join team
            </Button>
          </>
        }
      >
        <p className="text-[13.5px] text-ink-2">
          You can only be in one team per project cycle. You can leave later if you joined by mistake.
        </p>
      </Dialog>
    </Card>
  )
}

export function StudentHome() {
  const profile = useProfile()
  const { cycle, loading, error } = useActiveCycle()

  if (profile.teamId) return <Navigate to={`/teams/${profile.teamId}`} replace />

  return (
    <>
      <PageHeader
        title={`Welcome, ${profile.name.split(' ')[0]}`}
        description="Start by creating your project team, or join one your classmate already created."
      />
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : error ? (
        <ErrorNote>{errorMessage(error)}</ErrorNote>
      ) : !cycle ? (
        <Card>
          <EmptyState
            icon={<CalendarX />}
            title="Registrations aren't open yet"
            description="The project coordinator hasn't opened a project cycle. You'll be able to form teams once they do."
          />
        </Card>
      ) : (
        <>
          <p className="mb-4 text-[13px] text-ink-3">
            {cycle.name} · teams of up to {cycle.maxTeamSize} · first review due{' '}
            {formatDate(cycle.reviews[0]?.dueDate)}
          </p>
          <div className="grid max-w-3xl gap-4 md:grid-cols-2">
            <CreateTeamCard cycleId={cycle.id} />
            <JoinTeamCard />
          </div>
        </>
      )}
    </>
  )
}
