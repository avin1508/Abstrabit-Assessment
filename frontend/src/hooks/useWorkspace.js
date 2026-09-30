import { useContext } from 'react'
import { WorkspaceContext } from '../context/workspaceContext.js'

// { workspaces, activeWorkspace, status, switchingTo, switchWorkspace, reload }
export default function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('useWorkspace must be used inside <WorkspaceProvider>')
  return context
}
