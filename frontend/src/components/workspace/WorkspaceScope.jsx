import useWorkspace from '../../hooks/useWorkspace.js'
import WorkspaceAvatar from './WorkspaceAvatar.jsx'

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
