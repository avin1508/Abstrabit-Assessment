import { CircleCheck, CircleX, X } from 'lucide-react'
import { formatBytes } from '../../utils/format.js'
import FileIcon from '../common/FileIcon.jsx'
import { Card } from '../ui/Card.jsx'
import ProgressBar from '../ui/ProgressBar.jsx'

function UploadItem({ upload, onDismiss }) {
  const failed = upload.status === 'rejected' || upload.status === 'error'

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <FileIcon type={upload.type} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm font-medium text-fg">{upload.name}</p>
          <span className="shrink-0 font-mono text-[11px] text-fg-subtle">{formatBytes(upload.size)}</span>
        </div>
        {upload.status === 'uploading' && (
          <div className="mt-1.5 flex items-center gap-2">
            <ProgressBar value={upload.progress} label={`Uploading ${upload.name}`} />
            <span className="w-9 shrink-0 text-right font-mono text-[11px] text-fg-subtle tabular-nums">
              {upload.progress}%
            </span>
          </div>
        )}
        {upload.status === 'done' && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-emerald-700">
            <CircleCheck className="size-3.5" aria-hidden />
            Uploaded — indexing started
          </p>
        )}
        {failed && (
          <p className="mt-0.5 flex items-start gap-1 text-xs text-red-600" role="alert">
            <CircleX className="mt-px size-3.5 shrink-0" aria-hidden />
            {upload.error}
          </p>
        )}
      </div>
      {upload.status !== 'uploading' && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={`Dismiss ${upload.name}`}
          className="rounded p-1 text-fg-subtle hover:bg-surface-muted hover:text-fg"
        >
          <X className="size-3.5" />
        </button>
      )}
    </li>
  )
}

export default function UploadQueue({ uploads, onDismiss, onClearFinished }) {
  if (uploads.length === 0) return null
  const active = uploads.filter((upload) => upload.status === 'uploading').length

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-line bg-surface-muted/50 px-4 py-2">
        <p className="font-mono text-[11px] font-medium tracking-wider text-fg-subtle uppercase" aria-live="polite">
          {active ? `Uploading ${active} of ${uploads.length}` : `Uploads · ${uploads.length}`}
        </p>
        {active < uploads.length && (
          <button type="button" onClick={onClearFinished} className="text-xs font-medium text-fg-muted hover:text-fg">
            Clear finished
          </button>
        )}
      </div>
      <ul className="divide-y divide-line">
        {uploads.map((upload) => (
          <UploadItem key={upload.id} upload={upload} onDismiss={() => onDismiss(upload.id)} />
        ))}
      </ul>
    </Card>
  )
}
