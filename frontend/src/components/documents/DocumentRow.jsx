import { formatBytes, formatNumber } from '../../utils/format.js'
import FileIcon from '../common/FileIcon.jsx'
import RelativeTime from '../common/RelativeTime.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'

function chunkLabel(document) {
  if (document.chunkCount != null) return `${formatNumber(document.chunkCount)} chunks`
  if (document.status === 'failed') return 'Not indexed'
  return 'Indexing…'
}

// Compact document row: file, type/size, chunk count, upload time, status.
// Extra columns appear from `sm`; on phones they fold into the meta line.
export default function DocumentRow({ document }) {
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <FileIcon type={document.type} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg" title={document.name}>
          {document.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-fg-subtle">
          <span className="font-mono uppercase">{document.type}</span> · {formatBytes(document.sizeBytes)}
          {document.status === 'failed' && document.error ? (
            <span className="text-red-600"> · {document.error}</span>
          ) : (
            <span className="sm:hidden"> · {chunkLabel(document)}</span>
          )}
          <span className="sm:hidden">
            {' · '}
            <RelativeTime value={document.uploadedAt} />
          </span>
        </p>
      </div>
      <p className="hidden w-24 shrink-0 text-right font-mono text-xs text-fg-muted tabular-nums sm:block">
        {chunkLabel(document)}
      </p>
      <p className="hidden w-20 shrink-0 text-right text-xs text-fg-subtle sm:block">
        <RelativeTime value={document.uploadedAt} />
      </p>
      <div className="flex w-24 shrink-0 justify-end">
        <StatusBadge status={document.status} />
      </div>
    </li>
  )
}
