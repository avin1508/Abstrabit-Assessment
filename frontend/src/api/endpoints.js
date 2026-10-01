// Backend endpoint paths, relative to VITE_API_URL.
export const AUTH_ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  ME: '/auth/me',
}

export const WORKSPACE_ENDPOINTS = {
  LIST: '/workspaces',
  CREATE: '/workspaces',
}

export const DOCUMENT_ENDPOINTS = {
  LIST: '/documents',
  UPLOAD: '/documents',
  STATUS: (id) => `/documents/${id}/status`,
  DELETE: (id) => `/documents/${id}`,
  RETRY: (id) => `/documents/${id}/retry`,
}

export const CONVERSATION_ENDPOINTS = {
  LIST: '/conversations',
  CREATE: '/conversations',
  GET: (id) => `/conversations/${id}`,
  MESSAGES: (id) => `/conversations/${id}/messages`,
  RETRY: (id) => `/conversations/${id}/retry`,
}
