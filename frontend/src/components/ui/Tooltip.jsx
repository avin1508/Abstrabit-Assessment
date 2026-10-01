import { cn } from '../../utils/cn.js'

const SIDES = {
  top: 'bottom-full left-1/2 mb-1.5 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-1.5 -translate-x-1/2',
  left: 'right-full top-1/2 mr-1.5 -translate-y-1/2',
  right: 'left-full top-1/2 ml-1.5 -translate-y-1/2',
}

export default function Tooltip({ content, side = 'top', className, children }) {
  if (!content) return children

  return (
    <span className={cn('group/tooltip relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          // display:none until needed — an invisible bubble would still widen scroll containers.
          'pointer-events-none absolute z-50 hidden animate-fade-in rounded-md bg-fg px-2 py-1 text-xs font-medium whitespace-nowrap text-white shadow-overlay',
          'group-hover/tooltip:block group-has-focus-visible/tooltip:block',
          SIDES[side],
        )}
      >
        {content}
      </span>
    </span>
  )
}
