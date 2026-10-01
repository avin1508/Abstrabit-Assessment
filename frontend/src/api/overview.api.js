import api, { getErrorMessage } from './axios.js'
import { OVERVIEW_ENDPOINTS } from './endpoints.js'
import { plainText } from '../utils/chatText.js'
import { toDateOnly } from '../utils/format.js'

// Dashboard data for one workspace. The backend verifies the signed-in user owns it and reads
// everything for that workspace only. Below, each record is mapped to the shape the existing
// dashboard rows read (DocumentRow, ConversationItem, ToolRunRow).

const extensionOf = (name = '') => /\.([^.]+)$/.exec(name)?.[1].toLowerCase() ?? ''

const toDocumentRow = (document) => ({
  id: document.id,
  name: document.originalName,
  type: extensionOf(document.originalName),
  sizeBytes: document.fileSize ?? 0,
  status: document.status,
  error: document.errorMessage,
  chunkCount: null,
  uploadedAt: document.createdAt,
})

function toConversationItem(conversation) {
  const last = conversation.lastMessage
  let text = ''
  if (last?.role === 'user') text = last.content
  else if (last?.status === 'error') text = 'Response failed — try again'
  else if (last) text = plainText(last.content)
  return {
    id: conversation.id,
    title: conversation.title,
    updatedAt: conversation.updatedAt,
    lastMessage: last ? { role: last.role, text, grounded: last.grounded } : undefined,
  }
}

function toToolRun(run) {
  const args = run.args?.dueDate ? { ...run.args, dueDate: toDateOnly(run.args.dueDate) } : (run.args ?? {})
  let summary = ''
  if (run.status === 'failed') summary = run.error ?? 'Failed'
  else if (run.tool === 'create_task') summary = `Created task “${args.title ?? ''}”`
  else if (run.tool === 'send_summary') summary = `Summary sent${args.channel ? ` to ${args.channel}` : ''}`
  return { ...run, args, summary }
}

// { stats, recentDocuments, recentConversations, recentToolRuns }
export async function getWorkspaceOverviewRequest(workspaceId) {
  let response
  try {
    response = await api.get(OVERVIEW_ENDPOINTS.GET(workspaceId))
  } catch (error) {
    // Same safe, user-friendly messages as the rest of the app.
    throw new Error(getErrorMessage(error), { cause: error })
  }
  const { stats, recentDocuments = [], recentConversations = [], recentToolRuns = [] } = response.data.data
  return {
    stats,
    recentDocuments: recentDocuments.map(toDocumentRow),
    recentConversations: recentConversations.map(toConversationItem),
    recentToolRuns: recentToolRuns.map(toToolRun),
  }
}
