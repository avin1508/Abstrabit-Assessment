import { CircleAlert, CircleHelp, Copy, RotateCcw, ShieldCheck } from 'lucide-react'
import { cn } from '../../utils/cn.js'
import useToast from '../../hooks/useToast.js'
import { LogoMark } from '../common/Logo.jsx'
import RelativeTime from '../common/RelativeTime.jsx'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import IconButton from '../ui/IconButton.jsx'
import AnswerText from './AnswerText.jsx'
import SourceCitation from './SourceCitation.jsx'
import ThinkingIndicator from './ThinkingIndicator.jsx'
import UnknownAnswerState from './UnknownAnswerState.jsx'
import { plainText } from '../../utils/chatText.js'

function GroundingBadge({ message }) {
  const count = message.citations?.length ?? 0
  switch (message.state) {
    case 'thinking':
      return <Badge tone="info">Working</Badge>
    case 'error':
      return <Badge tone="danger">Failed</Badge>
    case 'unknown':
      return (
        <Badge tone="warning" icon={CircleHelp}>
          No supporting sources
        </Badge>
      )
    default:
      return count ? (
        <Badge tone="success" icon={ShieldCheck}>
          Grounded · {count} {count === 1 ? 'source' : 'sources'}
        </Badge>
      ) : (
        <Badge>{message.meta?.mode === 'tool' ? 'Tool result' : 'No sources used'}</Badge>
      )
  }
}

/*
 * The answer side of a turn. States: thinking | answer (with/without citations) | unknown | error.
 * `selected` marks the answer whose sources are open in the Sources panel; `activeCitation` is the
 * source highlighted there. onSelectCitation(messageId, index) opens the preview for [index];
 * onShowSources(messageId) shows the answer's sources without opening a preview.
 */
export default function AssistantMessage({
  message,
  workspaceName,
  selected = false,
  activeCitation,
  onSelectCitation,
  onShowSources,
  onRetry,
  retryDisabled,
}) {
  const { toast } = useToast()
  const citations = message.citations ?? []
  const cite = onSelectCitation && ((index) => onSelectCitation(message.id, index))

  async function copy() {
    try {
      await navigator.clipboard.writeText(plainText(message.text))
      toast({ tone: 'success', title: 'Answer copied' })
    } catch {
      toast({ tone: 'danger', title: 'Couldn’t copy to clipboard' })
    }
  }

  return (
    <article className="flex gap-3" aria-label="Assistant answer">
      <LogoMark size="sm" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-fg">Abstrabit</span>
          <GroundingBadge message={message} />
          <RelativeTime value={message.createdAt} className="text-xs text-fg-subtle" />
        </header>

        <div className="mt-2">
          {message.state === 'thinking' && (
            <ThinkingIndicator phase={message.phase} />
          )}

          {message.state === 'error' && (
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-4" role="alert">
              <p className="flex items-center gap-2 text-sm font-medium text-red-800">
                <CircleAlert className="size-4 shrink-0" aria-hidden />
                Something went wrong while generating the response.
              </p>
              {message.error && <p className="mt-1 pl-6 font-mono text-xs text-red-700/80">{message.error}</p>}
              {onRetry && (
                <div className="mt-3 pl-6">
                  <Button size="sm" leftIcon={RotateCcw} onClick={() => onRetry(message.id)} disabled={retryDisabled}>
                    Try again
                  </Button>
                </div>
              )}
            </div>
          )}

          {message.state === 'unknown' && (
            <UnknownAnswerState
              text={message.text}
              workspaceName={workspaceName}
            />
          )}

          {message.state === 'answer' && (
            <div
              className={cn(
                'rounded-lg border bg-surface px-4 py-3.5 transition-shadow',
                citations.length ? 'border-line border-l-2 border-l-emerald-400' : 'border-line',
                selected && citations.length && 'ring-2 ring-brand-500/15',
              )}
            >
              <AnswerText
                text={message.text}
                citations={citations}
                activeCitation={selected ? activeCitation : null}
                onCite={cite}
              />

              {citations.length > 0 && (
                <div className="mt-4 border-t border-line pt-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="font-mono text-[10px] font-medium tracking-widest text-fg-subtle uppercase">
                      {citations.length} {citations.length === 1 ? 'source' : 'sources'} from {workspaceName}
                    </p>
                    {onShowSources && (
                      <button
                        type="button"
                        onClick={() => onShowSources(message.id)}
                        className="shrink-0 rounded-sm text-[11px] font-medium text-fg-muted outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-brand-500/40"
                      >
                        View all sources
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {citations.map((citation) => (
                      <SourceCitation
                        key={citation.index}
                        citation={citation}
                        active={selected && activeCitation === citation.index}
                        onClick={cite && (() => cite(citation.index))}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {message.state === 'answer' && (
          <div className="mt-1 flex justify-end">
            <IconButton icon={Copy} label="Copy answer" size="sm" onClick={copy} />
          </div>
        )}
      </div>
    </article>
  )
}
