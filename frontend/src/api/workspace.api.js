import api from './axios.js'
import { WORKSPACE_ENDPOINTS } from './endpoints.js'

// Workspaces come back as { id, name, ownerId, documentCount, role: 'Owner', createdAt, updatedAt }.

export async function fetchWorkspacesRequest() {
  const response = await api.get(WORKSPACE_ENDPOINTS.LIST)
  return response.data.data.workspaces
}

export async function createWorkspaceRequest({ name }) {
  const response = await api.post(WORKSPACE_ENDPOINTS.CREATE, { name })
  return response.data.data.workspace
}
