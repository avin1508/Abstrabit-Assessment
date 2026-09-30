import { useState } from 'react'
import { RefreshCw, SquareTerminal } from 'lucide-react'
import useToolLogs from '../hooks/useToolLogs.js'
import useWorkspace from '../hooks/useWorkspace.js'
import PageHeader from '../components/common/PageHeader.jsx'
import Pagination from '../components/common/Pagination.jsx'
import ToolLogsTable, { ToolLogsTableSkeleton } from '../components/tools/ToolLogsTable.jsx'
import WorkspaceScope from '../components/workspace/WorkspaceScope.jsx'
import { Alert, Button, Card, EmptyState } from '../components/ui/index.js'

// Client-side paging over the mock list; swap for API paging (page/limit) when the backend exists.
const PAGE_SIZE = 5

export default function ToolLogsPage() {
  const { activeWorkspace: workspace } = useWorkspace()
  const { runs, status, error, reload } = useToolLogs(workspace.id)
  const [page, setPage] = useState(1)

  const pageCount = Math.max(1, Math.ceil(runs.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visible = runs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
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
            <ToolLogsTable runs={visible} />
            <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} label="Tool log pages" />
          </>
        )}
      </Card>
    </div>
  )
}
