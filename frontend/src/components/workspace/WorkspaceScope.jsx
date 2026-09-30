import useWorkspace from '../../hooks/useWorkspace.js'
import WorkspaceAvatar from './WorkspaceAvatar.jsx'

// Small "which workspace is this page showing" label for workspace-scoped page headers.
export default function WorkspaceScope() {
  const { activeWorkspace } = useWorkspace()
  if (!activeWorkspace) return null

  return (
    <span className="inline-flex items-center gap-1.5">
      <WorkspaceAvatar workspace={activeWorkspace} size="xs" />
      {activeWorkspace.name}
    </span>
  )
}
