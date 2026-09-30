import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { FileUp, MessageSquareDashed, RefreshCw, Wrench } from 'lucide-react'
import { PATHS } from '../routes/paths.js'
import { getWorkspaceOverview } from '../services/dashboardService.js'
import { canWrite } from '../utils/permissions.js'
import useAsyncData from '../hooks/useAsyncData.js'
import useWorkspace from '../hooks/useWorkspace.js'
import ListCard from '../components/common/ListCard.jsx'
import ConversationItem from '../components/chat/ConversationItem.jsx'
import OverviewStats from '../components/dashboard/OverviewStats.jsx'
import WorkspaceOverviewHeader from '../components/dashboard/WorkspaceOverviewHeader.jsx'
import DocumentRow from '../components/documents/DocumentRow.jsx'
import ToolRunRow from '../components/tools/ToolRunRow.jsx'
import { Alert, Button, EmptyState } from '../components/ui/index.js'

export default function DashboardPage() {
  const { activeWorkspace } = useWorkspace()
  const loader = useCallback(() => getWorkspaceOverview(activeWorkspace.id), [activeWorkspace.id])
  const { data, status, error, reload } = useAsyncData(loader)

  const loading = status === 'loading' && !data
  const writable = canWrite(activeWorkspace)

  return (
    <div className="space-y-6">
      <WorkspaceOverviewHeader workspace={activeWorkspace} />

      {status === 'error' && (
        <Alert
          tone="danger"
          title="Couldn’t load the workspace overview"
          action={
            <Button size="sm" leftIcon={RefreshCw} onClick={reload}>
              Try again
            </Button>
          }
        >
          {error?.message}
        </Alert>
      )}

      {(loading || data) && (
        <>
          <OverviewStats stats={data?.stats} loading={loading} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="min-w-0 space-y-6 lg:col-span-2">
              <ListCard
                title="Recent documents"
                description="Latest uploads and their indexing status"
                viewAllTo={PATHS.DOCUMENTS}
                loading={loading}
                skeletonRows={5}
                isEmpty={data?.recentDocuments.length === 0}
                empty={
                  <EmptyState
                    icon={FileUp}
                    title="No documents yet"
                    description="Upload files to make them searchable in this workspace."
                    action={
                      writable && (
                        <Button as={Link} to={PATHS.DOCUMENTS} size="sm" variant="primary">
                          Upload document
                        </Button>
                      )
                    }
                  />
                }
              >
                {data?.recentDocuments.map((document) => (
                  <DocumentRow key={document.id} document={document} />
                ))}
              </ListCard>

              <ListCard
                title="Recent conversations"
                description="Questions asked against this workspace’s documents"
                viewAllTo={PATHS.CHAT}
                divided={false}
                loading={loading}
                isEmpty={data?.recentConversations.length === 0}
                empty={
                  <EmptyState
                    icon={MessageSquareDashed}
                    title="No conversations yet"
                    description="Ask a question to get an answer with sources from this workspace."
                    action={
                      <Button as={Link} to={PATHS.CHAT} size="sm" variant="primary">
                        Ask AI
                      </Button>
                    }
                  />
                }
              >
                {data?.recentConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    to={`${PATHS.CHAT}?conversation=${conversation.id}`}
                  />
                ))}
              </ListCard>
            </div>

            <div className="min-w-0 space-y-6">
              <ListCard
                title="Recent tool activity"
                description="Actions taken by the assistant"
                viewAllTo={PATHS.TOOL_LOGS}
                loading={loading}
                isEmpty={data?.recentToolRuns.length === 0}
                empty={
                  <EmptyState
                    icon={Wrench}
                    title="No tool activity"
                    description="When the assistant creates a task or sends a summary, it appears here."
                  />
                }
              >
                {data?.recentToolRuns.map((run) => (
                  <ToolRunRow key={run.id} run={run} />
                ))}
              </ListCard>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
