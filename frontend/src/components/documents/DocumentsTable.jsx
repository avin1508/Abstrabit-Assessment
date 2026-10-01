import { formatBytes } from '../../utils/format.js'
import { focusRing } from '../../utils/styles.js'
import { cn } from '../../utils/cn.js'
import FileIcon from '../common/FileIcon.jsx'
import Skeleton from '../ui/Skeleton.jsx'
import DocumentActionsMenu from './DocumentActionsMenu.jsx'
import DocumentStatus from './DocumentStatus.jsx'

const HEADER = 'h-9 px-4 text-left font-mono text-[11px] font-medium tracking-wider whitespace-nowrap text-fg-subtle uppercase'

function NameButton({ document, onOpen }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onOpen(document)
      }}
      className={cn('min-w-0 truncate rounded-sm text-left text-sm font-medium text-fg hover:underline', focusRing)}
      title={document.name}
    >
      {document.name}
    </button>
  )
}

export default function DocumentsTable({ documents, selectedId, actions }) {
  const { onOpen } = actions
  const stop = (event) => event.stopPropagation()

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead className="border-b border-line bg-surface-muted/60">
            <tr>
              <th scope="col" className={HEADER}>Name</th>
              <th scope="col" className={cn(HEADER, 'w-24')}>Type</th>
              <th scope="col" className={cn(HEADER, 'w-24 text-right')}>Size</th>
              <th scope="col" className={cn(HEADER, 'w-44')}>Status</th>
              <th scope="col" className={cn(HEADER, 'w-14')}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {documents.map((document) => (
              <tr
                key={document.id}
                onClick={() => onOpen(document)}
                className={cn(
                  'cursor-pointer transition-colors hover:bg-surface-muted/50',
                  selectedId === document.id && 'bg-brand-50/40',
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileIcon type={document.type} size="sm" />
                    <div className="flex min-w-0 flex-col">
                      <NameButton document={document} onOpen={onOpen} />
                      {document.status === 'failed' && document.error && (
                        <span className="truncate text-xs text-red-600" title={document.error}>
                          {document.error}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-fg-muted uppercase">{document.type}</td>
                <td className="px-4 py-3 text-right font-mono text-xs whitespace-nowrap text-fg-muted tabular-nums">
                  {formatBytes(document.sizeBytes)}
                </td>
                <td className="px-4 py-3">
                  <DocumentStatus document={document} />
                </td>
                <td className="px-2 py-3 text-right" onClick={stop}>
                  <DocumentActionsMenu document={document} {...actions} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line md:hidden">
        {documents.map((document) => (
          <li
            key={document.id}
            onClick={() => onOpen(document)}
            className={cn('flex cursor-pointer gap-3 px-4 py-3.5', selectedId === document.id && 'bg-brand-50/40')}
          >
            <FileIcon type={document.type} />
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0">
                <NameButton document={document} onOpen={onOpen} />
              </div>
              <p className="mt-0.5 truncate text-xs text-fg-subtle">
                <span className="font-mono uppercase">{document.type}</span> · {formatBytes(document.sizeBytes)}
              </p>
              {document.status === 'failed' && document.error && (
                <p className="mt-1 line-clamp-2 text-xs text-red-600">{document.error}</p>
              )}
              <div className="mt-2">
                <DocumentStatus document={document} />
              </div>
            </div>
            <div onClick={stop} className="-mr-1">
              <DocumentActionsMenu document={document} {...actions} />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

export function DocumentsTableSkeleton({ rows = 6 }) {
  return (
    <ul className="divide-y divide-line" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="size-7 shrink-0" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="ml-auto hidden h-3 w-14 md:block" />
          <Skeleton className="hidden h-5 w-20 md:block" />
          <Skeleton className="h-3 w-10" />
        </li>
      ))}
    </ul>
  )
}
