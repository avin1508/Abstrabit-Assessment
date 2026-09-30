// Client-side hints only — the backend must enforce the same rules.
const WRITE_ROLES = ['Owner', 'Admin', 'Member']

export function canWrite(workspace) {
  return Boolean(workspace) && WRITE_ROLES.includes(workspace.role)
}
