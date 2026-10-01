import { Check, Clock, X } from 'lucide-react'
import { cn } from '../../utils/cn.js'
import LoadingSpinner from '../ui/LoadingSpinner.jsx'
import { getPipelineSteps } from './ingestion.js'

const MARKERS = {
  done: 'bg-emerald-500 text-white',
  current: 'bg-sky-50 text-sky-600 ring-1 ring-sky-300',
  queued: 'bg-surface-muted text-fg-subtle ring-1 ring-line-strong',
  failed: 'bg-red-500 text-white',
  pending: 'bg-surface text-fg-subtle ring-1 ring-line-strong',
}

function Marker({ state }) {
  return (
    <span className={cn('relative z-10 flex size-5 shrink-0 items-center justify-center rounded-full', MARKERS[state])}>
      {state === 'done' && <Check className="size-3" strokeWidth={3} aria-hidden />}
      {state === 'failed' && <X className="size-3" strokeWidth={3} aria-hidden />}
      {state === 'current' && <LoadingSpinner size="xs" label="In progress" />}
      {state === 'queued' && <Clock className="size-3" aria-hidden />}
      {state === 'pending' && <span className="size-1.5 rounded-full bg-line-strong" aria-hidden />}
    </span>
  )
}

const STATE_TEXT = { done: 'complete', current: 'in progress', queued: 'waiting', failed: 'failed', pending: 'not started' }

export default function IngestionTimeline({ document }) {
  const steps = getPipelineSteps(document)

  return (
    <ol className="relative">
      {steps.map((step, i) => (
        <li key={step.id} className="relative flex gap-3 pb-4 last:pb-0">
          {i < steps.length - 1 && (
            <span
              className={cn('absolute top-5 bottom-0 left-2.5 w-px -translate-x-1/2', step.state === 'done' ? 'bg-emerald-300' : 'bg-line')}
              aria-hidden
            />
          )}
          <Marker state={step.state} />
          <div className="min-w-0 -mt-px">
            <p
              className={cn(
                'text-sm font-medium',
                step.state === 'pending' ? 'text-fg-subtle' : step.state === 'failed' ? 'text-red-700' : 'text-fg',
              )}
            >
              {step.label}
              <span className="sr-only"> — {STATE_TEXT[step.state]}</span>
            </p>
            <p className="text-xs text-fg-subtle">
              {step.state === 'current' && document.progress != null
                ? `${step.description} · ${document.progress}%`
                : step.state === 'queued'
                  ? 'Waiting for an ingestion worker'
                  : step.state === 'failed'
                    ? document.error
                    : step.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}
