import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from '../ui/Button.jsx'

export default function Pagination({ page, pageCount, onChange, label = 'Pagination' }) {
  if (pageCount <= 1) return null

  return (
    <nav aria-label={label} className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
      <Button size="sm" variant="ghost" leftIcon={ChevronLeft} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      <p className="font-mono text-[11px] text-fg-subtle" aria-live="polite">
        Page {page} of {pageCount}
      </p>
      <Button size="sm" variant="ghost" rightIcon={ChevronRight} disabled={page >= pageCount} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </nav>
  )
}
