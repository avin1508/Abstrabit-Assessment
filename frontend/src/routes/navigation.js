import { FileText, LayoutDashboard, ListChecks, MessageSquare, SquareTerminal } from 'lucide-react'
import { PATHS } from './paths.js'

// Sidebar sections for the authenticated app shell.
// `fullBleed` pages fill the content area edge to edge and manage their own scrolling.
export const NAV_SECTIONS = [
  {
    label: 'Workspace',
    items: [
      { label: 'Dashboard', to: PATHS.DASHBOARD, icon: LayoutDashboard },
      { label: 'Documents', to: PATHS.DOCUMENTS, icon: FileText },
      { label: 'Chat', to: PATHS.CHAT, icon: MessageSquare, fullBleed: true },
    ],
  },
  {
    label: 'Automation',
    items: [
      { label: 'Tasks', to: PATHS.TASKS, icon: ListChecks },
      { label: 'Tool Logs', to: PATHS.TOOL_LOGS, icon: SquareTerminal },
    ],
  },
]

export function findNavItem(pathname) {
  for (const section of NAV_SECTIONS) {
    const item = section.items.find((candidate) => pathname.startsWith(candidate.to))
    if (item) return item
  }
  return null
}
