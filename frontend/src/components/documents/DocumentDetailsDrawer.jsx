import { CircleCheck, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react'
import { formatBytes } from '../../utils/format.js'
import DetailList from '../common/DetailList.jsx'
import FileIcon from '../common/FileIcon.jsx'
import Alert from '../ui/Alert.jsx'
import Button from '../ui/Button.jsx'
import Drawer from '../ui/Drawer.jsx'
import ProgressBar from '../ui/ProgressBar.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'
import IngestionTimeline from './IngestionTimeline.jsx'
import { STAGE_LABELS } from './ingestion.js'

function Section({ title, children }) {
  return (
    <section className="px-5 py-4">
      <h3 className="mb-2 font-mono text-[11px] font-medium tracking-wider text-fg-subtle uppercase">{title}</h3>
      {children}
    </section>
  )
}

function StatusSummary({ document, workspace, writable, onRetry }) {
  switch (document.status) {
    case 'indexed':
      return (
        <Alert tone="success" icon={CircleCheck} title="Indexed — ready for chat">
          This document is searchable in {workspace.name}.
        </Alert>
      )
    case 'processing':
      return (
        <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-3.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <p className="font-medium text-fg">{STAGE_LABELS[document.stage] ?? 'Processing'}…</p>
            <span className="font-mono text-xs text-sky-700 tabular-nums">{document.progress}%</span>
          </div>
          <ProgressBar value={document.progress} tone="info" label="Ingestion progress" className="mt-2" />
          <p className="mt-2 text-xs text-fg-muted">Answers won’t cite this document until indexing finishes.</p>
        </div>
      )
    case 'failed': {
      const retryable = writable
      return (
        <Alert
          tone="danger"
          title="Ingestion failed"
          action={
            retryable && (
              <Button size="sm" leftIcon={RotateCcw} onClick={() => onRetry(document)}>
                Retry ingestion
              </Button>
            )
          }
        >
          {document.error}
        </Alert>
      )
    }
    default:
      return null
  }
}

export default function DocumentDetailsDrawer({ document, workspace, writable, onClose, onRetry, onDelete }) {
  if (!document) return null

  return (
    <Drawer
      open
      onClose={onClose}
      size="md"
      title={document.name}
      header={
        <div className="flex items-start gap-3">
          <FileIcon type={document.type} />
          <div className="min-w-0">
            <p className="text-base leading-snug font-semibold break-words text-fg" aria-hidden>
              {document.name}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StatusBadge status={document.status} />
              <span className="font-mono text-[11px] text-fg-subtle uppercase">
                {document.type} · {formatBytes(document.sizeBytes)}
              </span>
            </div>
          </div>
        </div>
      }
      footer={
        writable ? (
          <Button variant="danger-secondary" leftIcon={Trash2} onClick={() => onDelete(document)} className="mr-auto">
            Delete document
          </Button>
        ) : (
          <p className="mr-auto text-xs text-fg-subtle">View-only access.</p>
        )
      }
    >
      <div className="divide-y divide-line">
        <div className="px-5 py-4">
          <StatusSummary document={document} workspace={workspace} writable={writable} onRetry={onRetry} />
        </div>

        <Section title="Details">
          <DetailList
            items={[
              { label: 'File type', value: <span className="font-mono uppercase">{document.type}</span> },
              { label: 'File size', value: formatBytes(document.sizeBytes) },
              { label: 'Status', value: <StatusBadge status={document.status} /> },
            ]}
          />
        </Section>

        <Section title="Ingestion">
          <IngestionTimeline document={document} />
          <p className="mt-4 flex items-start gap-2 rounded-md bg-surface-muted/70 px-3 py-2 text-xs text-fg-muted">
            <ShieldCheck className="mt-px size-3.5 shrink-0 text-emerald-600" aria-hidden />
            <span>
              Every chunk is tagged with <code className="font-mono text-fg">{document.workspaceId}</code> and is only
              retrieved for questions asked in {workspace.name}.
            </span>
          </p>
        </Section>
      </div>
    </Drawer>
  )
}
