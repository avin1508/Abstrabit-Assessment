import ProgressBar from '../ui/ProgressBar.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'
import { STAGE_LABELS } from './ingestion.js'

// Status badge plus, for in-flight documents, the current stage and progress.
export default function DocumentStatus({ document, showDetail = true }) {
  const { status, stage, progress } = document

  return (
    <div className="min-w-0">
      <StatusBadge status={status} />
      {showDetail && status === 'processing' && (
        <div className="mt-1.5 w-36">
          <ProgressBar value={progress} tone="info" label={`${STAGE_LABELS[stage]} progress`} />
          <p className="mt-1 truncate font-mono text-[10px] text-fg-subtle">
            {STAGE_LABELS[stage]} · {progress}%
          </p>
        </div>
      )}
      {showDetail && status === 'queued' && (
        <p className="mt-1 font-mono text-[10px] text-fg-subtle">Waiting to start</p>
      )}
    </div>
  )
}
