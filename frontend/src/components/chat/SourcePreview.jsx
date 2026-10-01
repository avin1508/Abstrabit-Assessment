import { Quote } from 'lucide-react'
import DetailList from '../common/DetailList.jsx'
import FileIcon from '../common/FileIcon.jsx'
import Button from '../ui/Button.jsx'
import Drawer from '../ui/Drawer.jsx'
import WorkspaceAvatar from '../workspace/WorkspaceAvatar.jsx'
import CitationBadge from './CitationBadge.jsx'
import { claimsForCitation, fileTypeLabel } from './sourceMeta.js'

function SectionTitle({ children }) {
  return <h3 className="mb-2 font-mono text-[10px] font-medium tracking-widest text-fg-subtle uppercase">{children}</h3>
}

export default function SourcePreview({ message, citationIndex, workspace, onSelectCitation, onClose, sheet = false }) {
  // Evidence must belong to the active workspace; anything else is never rendered.
  const citations =
    message?.workspaceId === workspace.id
      ? (message.citations ?? []).filter((citation) => !citation.workspaceId || citation.workspaceId === workspace.id)
      : []
  const citation = citations.find((candidate) => candidate.index === citationIndex)
  if (!citation) return null

  const claims = claimsForCitation(message.text, citation.index)

  return (
    <Drawer
      open
      onClose={onClose}
      side={sheet ? 'bottom' : 'right'}
      size="md"
      title={`Source ${citation.index}: ${citation.documentName}`}
      header={
        <div className="flex items-start gap-3">
          <FileIcon type={citation.type} />
          <div className="min-w-0">
            <p className="flex items-start gap-2 text-base leading-snug font-semibold break-words text-fg" aria-hidden>
              <CitationBadge index={citation.index} active size="md" className="mt-0.5" />
              {citation.documentName}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-fg-muted">
              <span className="inline-flex items-center gap-1">
                <WorkspaceAvatar workspace={workspace} size="xs" />
                {workspace.name}
              </span>
              <span aria-hidden>·</span>
              <span>{citation.location}</span>
            </p>
          </div>
        </div>
      }
      footer={
        <>
          {citations.length > 1 && (
            <div className="mr-auto flex items-center gap-1.5" role="group" aria-label="Other sources for this answer">
              <span className="text-xs text-fg-subtle">Sources</span>
              {citations.map((item) => (
                <CitationBadge
                  key={item.index}
                  index={item.index}
                  size="md"
                  active={item.index === citation.index}
                  label={`Source ${item.index}: ${item.documentName}`}
                  onClick={() => onSelectCitation(message.id, item.index)}
                />
              ))}
            </div>
          )}
          <Button onClick={onClose}>Close</Button>
        </>
      }
    >
      <div className="space-y-5 px-5 py-4">
        {claims.length > 0 && (
          <section>
            <SectionTitle>Supports this part of the answer</SectionTitle>
            <ul className="space-y-1.5">
              {claims.map((claim) => (
                <li key={claim} className="flex gap-2 text-sm text-fg">
                  <Quote className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" aria-hidden />
                  <span>
                    {claim} <CitationBadge index={citation.index} active />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <SectionTitle>Evidence from the document</SectionTitle>
          <blockquote className="rounded-lg bg-amber-50 px-4 py-3 text-sm leading-relaxed text-fg ring-1 ring-amber-200 ring-inset">
            <mark className="bg-amber-200/70 box-decoration-clone px-0.5 text-fg">{citation.excerpt}</mark>
          </blockquote>
          <p className="mt-2 text-[11px] text-fg-subtle">The passage retrieved from {workspace.name} for this answer.</p>
        </section>

        <section>
          <SectionTitle>Details</SectionTitle>
          <DetailList
            items={[
              { label: 'Document', value: citation.documentName },
              { label: 'File type', value: fileTypeLabel(citation.type) },
              { label: 'Location', value: citation.location },
              {
                label: 'Workspace',
                value: (
                  <span className="inline-flex items-center gap-1.5">
                    <WorkspaceAvatar workspace={workspace} size="xs" />
                    {workspace.name}
                  </span>
                ),
              },
            ]}
          />
        </section>
      </div>
    </Drawer>
  )
}
