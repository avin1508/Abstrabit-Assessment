import { useImperativeHandle, useRef, useState } from 'react'
import { CloudUpload, Lock } from 'lucide-react'
import { ACCEPTED_EXTENSIONS, MAX_FILE_SIZE_LABEL, SUPPORTED_FILE_TYPES } from '../../utils/fileValidation.js'
import { cn } from '../../utils/cn.js'
import { focusRing } from '../../utils/styles.js'

const TYPE_LABELS = Object.values(SUPPORTED_FILE_TYPES).map((type) => type.label)

/*
 * Drag-and-drop target plus hidden file input.
 * `ref.current.open()` opens the file picker (used by the page's Upload button).
 * When `disabled`, renders a read-only notice instead.
 */
export default function UploadDropzone({ ref, onFiles, workspaceName, disabled = false, className }) {
  const inputRef = useRef(null)
  const dragDepth = useRef(0)
  const [dragging, setDragging] = useState(false)

  useImperativeHandle(ref, () => ({ open: () => inputRef.current?.click() }), [])

  if (disabled) {
    return (
      <div className={cn('flex items-center gap-3 rounded-lg border border-line bg-surface-muted/50 p-4', className)}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface text-fg-subtle ring-1 ring-line ring-inset">
          <Lock className="size-4" aria-hidden />
        </span>
        <div className="text-sm">
          <p className="font-medium text-fg">View-only access</p>
          <p className="text-fg-muted">Ask a workspace admin to upload documents to {workspaceName}.</p>
        </div>
      </div>
    )
  }

  const onDragEnter = (event) => {
    event.preventDefault()
    dragDepth.current += 1
    setDragging(true)
  }
  const onDragLeave = () => {
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setDragging(false)
  }
  const onDragOver = (event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }
  const onDrop = (event) => {
    event.preventDefault()
    dragDepth.current = 0
    setDragging(false)
    if (event.dataTransfer.files.length) onFiles(event.dataTransfer.files)
  }

  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors sm:flex-row sm:gap-5 sm:py-6 sm:text-left',
        dragging ? 'border-brand-400 bg-brand-50/60' : 'border-line-strong bg-surface hover:border-fg-subtle/50',
        className,
      )}
    >
      <span
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset transition-colors',
          dragging ? 'bg-brand-100 text-brand-700 ring-brand-600/20' : 'bg-surface-muted text-fg-muted ring-line',
        )}
      >
        <CloudUpload className="size-5" aria-hidden />
      </span>

      <div className="mt-3 min-w-0 flex-1 sm:mt-0">
        <p className="text-sm font-medium text-fg">
          {dragging ? 'Release to upload' : 'Drop files here'}
          {!dragging && (
            <>
              {' or '}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className={cn('rounded-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline', focusRing)}
              >
                browse files
              </button>
            </>
          )}
        </p>
        <p className="mt-1 text-xs text-fg-subtle">
          {TYPE_LABELS.join(', ')} · up to {MAX_FILE_SIZE_LABEL} each
        </p>
      </div>

      <p className="mt-3 max-w-xs text-xs text-fg-subtle sm:mt-0 sm:text-right">
        Added to <span className="font-medium text-fg-muted">{workspaceName}</span> and only searchable there.
      </p>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_EXTENSIONS}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          if (event.target.files?.length) onFiles(event.target.files)
          event.target.value = ''
        }}
      />
    </div>
  )
}
