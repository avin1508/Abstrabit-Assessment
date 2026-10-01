import { listConversationsRequest } from '../api/conversation.api.js'
import { store } from '../store/index.js'
import { listToolCallsRequest } from '../api/toolCall.api.js'

// Real documents of the active workspace from documentSlice: the loaded page plus
// workspace-wide counts per status (the list is paginated, so only counts are complete).
function getWorkspaceDocuments(workspaceId) {
  const { documents, statusCounts, workspaceId: loadedFor } = store.getState().document
  return loadedFor === workspaceId ? { documents, statusCounts } : { documents: [], statusCounts: null }
}

// Mock for GET /api/workspaces/:workspaceId/overview. Every figure is derived from the
// workspace's own records — nothing is hard-coded per workspace.

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getWorkspaceOverview(workspaceId) {
  await delay(500)

  const { documents, statusCounts } = getWorkspaceDocuments(workspaceId)
  // Real conversations of this workspace (newest first).
  const conversations = await listConversationsRequest(workspaceId).catch(() => [])
  // Real tool calls: the 5 most recent plus workspace-wide counts.
  const toolCalls = await listToolCallsRequest(workspaceId, { page: 1, limit: 5 }).catch(() => null)
  const toolCounts = toolCalls?.statusCounts ?? { success: 0, failed: 0 }

  const stats = {
    documents: statusCounts?.all ?? 0,
    indexedDocuments: statusCounts?.indexed ?? 0,
    processingDocuments: statusCounts?.processing ?? 0,
    conversations: conversations.length,
    toolCalls: toolCalls?.pagination.total ?? 0,
    successfulToolCalls: toolCounts.success,
    unsuccessfulToolCalls: toolCounts.failed,
  }

  return {
    stats,
    recentDocuments: documents
      .slice()
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      .slice(0, 5),
    recentConversations: conversations.slice(0, 4),
    recentToolRuns: toolCalls?.items ?? [],
  }
}
