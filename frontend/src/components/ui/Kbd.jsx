import { cn } from '../../utils/cn.js'

export default function Kbd({ className, children }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded border border-line border-b-line-strong bg-surface px-1 font-mono text-[11px] font-medium text-fg-muted',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
