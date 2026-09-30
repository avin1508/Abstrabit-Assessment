import { MOCK_WORKSPACES } from '../data/mockWorkspaces.js'
import { getWorkspaceDocumentsSync } from './documentService.js'

// Mock workspace service. Will become GET /api/workspaces and POST /api/workspaces/:id/select.

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function withCounts(workspace) {
  return { ...workspace, documentCount: getWorkspaceDocumentsSync(workspace.id).length }
}

export async function listWorkspaces() {
  await delay(400)
  return MOCK_WORKSPACES.map(withCounts)
}

// The backend will record the user's active workspace; the mock only simulates latency.
export async function selectWorkspace(workspaceId) {
  await delay(450)
  const workspace = MOCK_WORKSPACES.find((candidate) => candidate.id === workspaceId)
  if (!workspace) throw new Error('Workspace not found.')
  return withCounts(workspace)
}
