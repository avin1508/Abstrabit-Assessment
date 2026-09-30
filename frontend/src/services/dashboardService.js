import { getConversationSummariesSync } from './chatService.js'
import { store } from '../store/index.js'
import { listToolRunsSync } from './toolService.js'

// Real documents of the active workspace, as loaded into documentSlice.
function getWorkspaceDocuments(workspaceId) {
  const { documents, workspaceId: loadedFor } = store.getState().document
  return loadedFor === workspaceId ? documents : []
}

// Mock for GET /api/workspaces/:workspaceId/overview. Every figure is derived from the
// workspace's own records — nothing is hard-coded per workspace.

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getWorkspaceOverview(workspaceId) {
  await delay(500)

  const documents = getWorkspaceDocuments(workspaceId)
  const conversations = getConversationSummariesSync(workspaceId)
  const toolRuns = listToolRunsSync(workspaceId)

  const stats = {
    documents: documents.length,
    indexedDocuments: documents.filter((document) => document.status === 'indexed').length,
    processingDocuments: documents.filter((document) => document.status === 'processing').length,
    conversations: conversations.length,
    toolCalls: toolRuns.length,
    successfulToolCalls: toolRuns.filter((run) => run.status === 'success').length,
    unsuccessfulToolCalls: toolRuns.filter((run) => run.status === 'failed' || run.status === 'blocked').length,
  }

  return {
    stats,
    recentDocuments: documents
      .slice()
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      .slice(0, 5),
    recentConversations: conversations.slice(0, 4),
    recentToolRuns: toolRuns.slice(0, 5),
  }
}
