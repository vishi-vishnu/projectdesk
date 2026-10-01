import { CommentThread } from '@/components/domain/CommentThread'
import { Card, CardBody, CardHeader } from '@/components/ui'
import { useTeamContext } from './TeamContext'

export function DiscussionTab() {
  const { team, viewer, perms, guide } = useTeamContext()
  return (
    <div className="max-w-3xl">
      <Card>
        <CardHeader
          title="Team discussion"
          description={`General questions and updates for the team${guide ? ` and ${guide.name}` : ''}. For feedback on a specific file, comment on the review submission instead.`}
        />
        <CardBody>
          <CommentThread
            scope={{ kind: 'discussion', teamId: team.id }}
            viewer={viewer}
            canPost={perms.isMember || perms.canEvaluate}
            emptyTitle="No messages yet"
            emptyDescription="Ask a doubt or post an update. Your guide sees everything here."
            placeholder="Write a message… (Ctrl + Enter to post)"
          />
        </CardBody>
      </Card>
    </div>
  )
}
