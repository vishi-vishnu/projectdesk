import { ActivityFeed } from '@/components/domain/ActivityFeed'
import { Card, CardBody, CardHeader } from '@/components/ui'
import { useActivity } from '@/hooks/data'
import { useTeamContext } from './TeamContext'

export function ActivityTab() {
  const { team } = useTeamContext()
  const { data, loading } = useActivity(team.id)
  return (
    <div className="max-w-3xl">
      <Card>
        <CardHeader title="Activity log" description="Every change to this team, newest first." />
        <CardBody>
          <ActivityFeed items={data} loading={loading} />
        </CardBody>
      </Card>
    </div>
  )
}
