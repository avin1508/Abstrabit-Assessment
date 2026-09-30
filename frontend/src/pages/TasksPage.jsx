import { useState } from 'react'
import { ListChecks, RefreshCw } from 'lucide-react'
import { canWrite } from '../utils/permissions.js'
import useTasks from '../hooks/useTasks.js'
import useToast from '../hooks/useToast.js'
import useWorkspace from '../hooks/useWorkspace.js'
import PageHeader from '../components/common/PageHeader.jsx'
import Pagination from '../components/common/Pagination.jsx'
import TasksTable, { TasksTableSkeleton } from '../components/tasks/TasksTable.jsx'
import WorkspaceScope from '../components/workspace/WorkspaceScope.jsx'
import { Alert, Button, Card, EmptyState } from '../components/ui/index.js'

const PAGE_SIZE = 5

export default function TasksPage() {
  const { activeWorkspace: workspace } = useWorkspace()
  const { toast } = useToast()
  const writable = canWrite(workspace)
  const { tasks, status, error, reload, toggle } = useTasks(workspace.id)
  const [page, setPage] = useState(1)

  const pageCount = Math.max(1, Math.ceil(tasks.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visible = tasks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const loading = status === 'loading' && tasks.length === 0

  async function handleToggle(task) {
    const next = task.status === 'completed' ? 'open' : 'completed'
    try {
      await toggle(task.id, next)
      toast({ tone: 'success', title: next === 'completed' ? 'Task completed' : 'Task reopened', description: task.title })
    } catch (toggleError) {
      toast({ tone: 'danger', title: 'Couldn’t update task', description: toggleError.message })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<WorkspaceScope />}
        title="Tasks"
        description={`Tasks the assistant created in ${workspace.name} with the create_task tool.`}
      />

      {status === 'error' && (
        <Alert
          tone="danger"
          title="Couldn’t load tasks"
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
          <TasksTableSkeleton />
        ) : status === 'success' && tasks.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No tasks yet"
            description="Ask the assistant in Chat — e.g. “Create a task to review the refund policy” — and it will appear here."
            className="py-16"
          />
        ) : (
          <>
            <TasksTable tasks={visible} writable={writable} onToggle={handleToggle} />
            <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} label="Tasks pages" />
          </>
        )}
      </Card>
    </div>
  )
}
