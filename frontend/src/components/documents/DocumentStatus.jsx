import LoadingSpinner from '../ui/LoadingSpinner.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'
import { STAGE_LABELS } from './ingestion.js'

// Status badge plus, for processing documents, the current ingestion stage.
export default function DocumentStatus({ document, showDetail = true }) {
  const { status, stage } = document

  return (
    <div className="min-w-0">
      <StatusBadge status={status} />
      {showDetail && status === 'processing' && (
        <p className="mt-1.5 flex w-36 items-center gap-1.5 truncate font-mono text-[10px] text-fg-subtle">
          <LoadingSpinner size="xs" className="text-sky-600" />
          {STAGE_LABELS[stage] ?? 'Processing'}…
        </p>
      )}
    </div>
  )
}
