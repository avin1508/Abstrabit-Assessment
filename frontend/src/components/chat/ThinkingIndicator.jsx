import { Check } from 'lucide-react'
import { cn } from '../../utils/cn.js'
import LoadingSpinner from '../ui/LoadingSpinner.jsx'

const RETRIEVAL_STEPS = [
  { id: 'searching', label: 'Searching workspace knowledge' },
  { id: 'reading', label: 'Reviewing relevant documents' },
  { id: 'writing', label: 'Writing a grounded answer' },
]

const TOOL_STEPS = [
  { id: 'searching', label: 'Understanding the request' },
  { id: 'tool', label: 'Waiting for the tool to finish' },
  { id: 'writing', label: 'Summarizing the result' },
]

/*
 * Step-by-step progress for an in-flight assistant response.
 * phase: searching | reading | writing | tool
 */
export default function ThinkingIndicator({ phase = 'searching' }) {
  const steps = phase === 'tool' ? TOOL_STEPS : RETRIEVAL_STEPS
  const current = Math.max(0, steps.findIndex((step) => step.id === phase))

  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3" role="status" aria-live="polite">
      <ol className="space-y-2">
        {steps.map((step, i) => {
          const state = i < current ? 'done' : i === current ? 'current' : 'pending'
          return (
            <li key={step.id} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                {state === 'done' && <Check className="size-3.5 text-emerald-600" strokeWidth={3} aria-hidden />}
                {state === 'current' && <LoadingSpinner size="xs" className="text-brand-600" label={step.label} />}
                {state === 'pending' && <span className="size-1.5 rounded-full bg-line-strong" aria-hidden />}
              </span>
              <div className="min-w-0">
                <p
                  className={cn(
                    'text-sm',
                    state === 'current' && 'font-medium text-fg',
                    state === 'done' && 'text-fg-muted',
                    state === 'pending' && 'text-fg-subtle',
                  )}
                >
                  {step.label}
                  {state === 'current' && <span className="animate-pulse">…</span>}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
