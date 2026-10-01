import { Fragment } from 'react'
import CitationBadge from './CitationBadge.jsx'

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[\d+\])/g

function renderInline(text, { citations, activeCitation, onCite }) {
  return text.split(INLINE).map((part, i) => {
    if (!part) return null
    if (part.startsWith('**')) return <strong key={i} className="font-semibold text-fg">{part.slice(2, -2)}</strong>
    if (part.startsWith('`')) {
      return (
        <code key={i} className="rounded bg-surface-muted px-1 py-0.5 font-mono text-[0.85em] text-fg">
          {part.slice(1, -1)}
        </code>
      )
    }
    const cite = /^\[(\d+)\]$/.exec(part)
    if (cite) {
      const index = Number(cite[1])
      const source = citations?.find((citation) => citation.index === index)
      return (
        <CitationBadge
          key={i}
          index={index}
          active={activeCitation === index}
          label={source ? `Source ${index}: ${source.documentName}, ${source.location}` : `Source ${index}`}
          onClick={onCite && (() => onCite(index))}
        />
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

export default function AnswerText({ text = '', citations, activeCitation, onCite }) {
  const blocks = text.split(/\n{2,}/)
  const options = { citations, activeCitation, onCite }

  return (
    <div className="space-y-3 text-sm leading-relaxed text-fg/90">
      {blocks.map((block, i) => {
        const lines = block.split('\n')
        const intro = lines[0].startsWith('- ') ? null : lines[0]
        const items = lines.filter((line) => line.startsWith('- '))

        return (
          <Fragment key={i}>
            {intro && <p>{renderInline(intro, options)}</p>}
            {items.length > 0 && (
              <ul className="space-y-1.5 pl-1">
                {items.map((item, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-fg-subtle" aria-hidden />
                    <span>{renderInline(item.slice(2), options)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
