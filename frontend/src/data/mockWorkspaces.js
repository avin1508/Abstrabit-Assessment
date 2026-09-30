// Workspaces the mock user belongs to. `role` is the current user's role in that workspace.
// Document counts are derived from the document store by the workspace service.
export const MOCK_WORKSPACES = [
  { id: 'ws_acme', name: 'Acme Corporation', slug: 'acme', role: 'Admin', color: 'brand' },
  { id: 'ws_personal', name: 'Personal Workspace', slug: 'personal', role: 'Owner', color: 'emerald' },
  { id: 'ws_demo', name: 'Demo Workspace', slug: 'demo', role: 'Viewer', color: 'amber' },
  { id: 'ws_research', name: 'Research Lab', slug: 'research', role: 'Member', color: 'sky' },
]
