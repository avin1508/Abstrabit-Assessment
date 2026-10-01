import { Link } from 'react-router-dom'
import { ShieldCheck, TriangleAlert } from 'lucide-react'
import { PATHS } from '../../routes/paths.js'
import { LogoMark } from '../common/Logo.jsx'

export default function ChatEmptyState({ workspace, indexedCount }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center py-8 text-center sm:py-14">
      <LogoMark size="lg" />
      <h2 className="mt-4 text-lg font-semibold tracking-tight text-fg">Ask {workspace.name}’s documents</h2>
      <p className="mt-1.5 max-w-md text-sm text-fg-muted">
        Answers come only from documents in this workspace and cite their sources. When the documents don’t cover
        something, the assistant says so instead of guessing.
      </p>

      <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-fg-subtle">
        <ShieldCheck className="size-3.5 text-emerald-600" aria-hidden />
        Other workspaces are never searched
      </p>

      {indexedCount === 0 && (
        <div className="mt-5 flex w-full items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-left text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
          <p className="text-fg-muted">
            <span className="font-medium text-fg">No indexed documents in {workspace.name}.</span> The assistant will
            answer “I don’t know” until you{' '}
            <Link to={PATHS.DOCUMENTS} className="font-medium text-brand-600 hover:underline">
              upload documents
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  )
}
