// Shared styling/ARIA helpers for form controls (Input, Textarea, Select).
export function controlClasses(error) {
  return [
    'block w-full rounded-md border bg-surface text-sm text-fg shadow-xs transition-[border-color,box-shadow] outline-none',
    'placeholder:text-fg-subtle disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-fg-subtle',
    error
      ? 'border-red-400 focus:border-red-500 focus:ring-3 focus:ring-red-500/15'
      : 'border-line-strong hover:border-fg-subtle/60 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15',
  ].join(' ')
}

export function describedBy(id, { error, hint }) {
  if (error) return `${id}-error`
  if (hint) return `${id}-hint`
  return undefined
}
