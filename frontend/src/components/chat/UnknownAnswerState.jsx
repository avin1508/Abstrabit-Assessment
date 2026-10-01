import { Link } from 'react-router-dom'
import { CircleHelp, FileX } from 'lucide-react'
import { PATHS } from '../../routes/paths.js'
import AnswerText from './AnswerText.jsx'

// No citations on purpose: there's no evidence to show.
export default function UnknownAnswerState({ text, workspaceName }) {
  return (
    <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/40 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
        <CircleHelp className="size-4 shrink-0" aria-hidden />
        Not enough information
      </p>

      <div className="mt-2 pl-6">
        <AnswerText text={text} />
      </div>

      <div className="mt-3 ml-6 flex items-start gap-2 rounded-md bg-surface/80 px-3 py-2 text-xs text-fg-muted ring-1 ring-amber-200 ring-inset">
        <FileX className="mt-px size-3.5 shrink-0 text-amber-700" aria-hidden />
        <p>
          <span className="font-medium text-fg">No supporting sources were found in {workspaceName}.</span>{' '}
          If the answer should be here,{' '}
          <Link to={PATHS.DOCUMENTS} className="font-medium text-brand-600 hover:underline">
            upload the relevant document
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
