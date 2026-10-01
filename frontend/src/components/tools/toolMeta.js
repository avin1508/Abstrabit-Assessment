import { Ban, CircleCheck, CircleX, Clock, ListPlus, Send, Wrench } from 'lucide-react'
import { formatDate } from '../../utils/format.js'

export const TOOL_META = {
  create_task: { label: 'Create task', icon: ListPlus, description: 'Adds a task to the workspace task list.' },
  send_summary: { label: 'Send summary', icon: Send, description: 'Posts a summary to a Slack/Discord channel.' },
}

export function getToolMeta(tool) {
  return TOOL_META[tool] ?? { label: tool, icon: Wrench, description: '' }
}

export const ARG_LABELS = { title: 'Title', dueDate: 'Due', channel: 'Channel', summary: 'Summary' }


export const TOOL_STATUS = {
  pending: { label: 'Pending', icon: Clock, className: 'text-fg-muted', border: 'border-line-strong', header: 'bg-surface-muted/60' },
  running: { label: 'Running…', className: 'text-sky-700', border: 'border-sky-200', header: 'bg-sky-50/60' },
  success: { label: 'Completed', icon: CircleCheck, className: 'text-emerald-700', border: 'border-line-strong', header: 'bg-surface-muted/60' },
  failed: { label: 'Failed', icon: CircleX, className: 'text-red-700', border: 'border-red-200', header: 'bg-red-50/60' },
  blocked: { label: 'Blocked', icon: Ban, className: 'text-amber-800', border: 'border-amber-200', header: 'bg-amber-50/60' },
}

export function formatArg(key, value) {
  if (key === 'dueDate') return formatDate(value) ?? '—'
  return String(value)
}
