import { Ellipsis, PanelRightOpen, RotateCcw, Trash2 } from 'lucide-react'
import Dropdown from '../ui/Dropdown.jsx'
import IconButton from '../ui/IconButton.jsx'

// Write actions are hidden for read-only members.
export default function DocumentActionsMenu({ document, writable, onOpen, onRetry, onDelete }) {
  const canRetry = writable && document.status === 'failed'

  const items = [
    { label: 'View details', icon: PanelRightOpen, onSelect: () => onOpen(document) },
    canRetry && { label: 'Retry ingestion', icon: RotateCcw, onSelect: () => onRetry(document) },
    writable && { type: 'separator' },
    writable && { label: 'Delete', icon: Trash2, tone: 'danger', onSelect: () => onDelete(document) },
  ].filter(Boolean)

  return (
    <Dropdown
      align="end"
      items={items}
      renderTrigger={(props) => (
        <IconButton {...props} icon={Ellipsis} label={`Actions for ${document.name}`} size="sm" tooltip={false} />
      )}
    />
  )
}
