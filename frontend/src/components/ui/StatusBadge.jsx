import Badge from './Badge.jsx'
import StatusDot from './StatusDot.jsx'

const STATUSES = {
  indexed: { tone: 'success', label: 'Indexed' },
  success: { tone: 'success', label: 'Success' },
  completed: { tone: 'success', label: 'Completed' },
  processing: { tone: 'info', label: 'Processing', pulse: true },
  running: { tone: 'info', label: 'Running', pulse: true },
  queued: { tone: 'neutral', label: 'Queued' },
  open: { tone: 'neutral', label: 'Open' },
  pending: { tone: 'neutral', label: 'Pending' },
  blocked: { tone: 'warning', label: 'Blocked' },
  failed: { tone: 'danger', label: 'Failed' },
}

export default function StatusBadge({ status, label, size = 'sm', className }) {
  const config = STATUSES[status] ?? { tone: 'neutral', label: status }

  return (
    <Badge tone={config.tone} size={size} className={className}>
      <StatusDot tone={config.tone} pulse={config.pulse} />
      {label ?? config.label}
    </Badge>
  )
}
