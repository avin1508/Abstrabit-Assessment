import { RefreshCw, SquareTerminal } from 'lucide-react'
import useToolLogs from '../hooks/useToolLogs.js'
import useWorkspace from '../hooks/useWorkspace.js'
import PageHeader from '../components/common/PageHeader.jsx'
import Pagination from '../components/common/Pagination.jsx'
import ToolLogsTable, { ToolLogsTableSkeleton } from '../components/tools/ToolLogsTable.jsx'
import WorkspaceScope from '../components/workspace/WorkspaceScope.jsx'
import { Alert, Button, Card, EmptyState } from '../components/ui/index.js'

export default function ToolLogsPage() {
  const { activeWorkspace: workspace } = useWorkspace()
  // One backend page at a time (10 per page).
  const { runs, status, error, pagination, setPage, reload } = useToolLogs(workspace.id)
  const loading = status === 'loading' && runs.length === 0

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<WorkspaceScope />}
        title="Tool Logs"
        description={`Every tool call the assistant made in ${workspace.name}: arguments, status and result.`}
      />

      {status === 'error' && (
        <Alert
          tone="danger"
          title="Couldn’t load tool logs"
          action={
            <Button size="sm" leftIcon={RefreshCw} onClick={reload}>
              Try again
            </Button>
          }
        >
          {error?.message}
        </Alert>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <ToolLogsTableSkeleton />
        ) : status === 'success' && runs.length === 0 ? (
          <EmptyState
            icon={SquareTerminal}
            title="No tool activity yet"
            description="When the assistant creates a task or sends a summary from Chat, the call is logged here."
            className="py-16"
          />
        ) : (
          <>
            <ToolLogsTable runs={runs} />
            <Pagination page={pagination.page} pageCount={Math.max(1, pagination.totalPages)} onChange={setPage} label="Tool log pages" />
          </>
        )}
      </Card>
    </div>
  )
}
