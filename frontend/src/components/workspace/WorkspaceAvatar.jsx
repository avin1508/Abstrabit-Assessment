import { cn } from '../../utils/cn.js'

const COLORS = {
  brand: 'bg-brand-600',
  emerald: 'bg-emerald-600',
  amber: 'bg-amber-500',
  sky: 'bg-sky-600',
  rose: 'bg-rose-600',
  neutral: 'bg-fg',
}

const SIZES = {
  xs: 'size-4 rounded text-[9px]',
  sm: 'size-6 rounded-md text-[11px]',
  md: 'size-8 rounded-md text-sm',
  lg: 'size-10 rounded-lg text-base',
  xl: 'size-12 rounded-xl text-lg',
}

// Square monogram for a workspace. People use round <Avatar>; workspaces are always square.
export default function WorkspaceAvatar({ workspace, size = 'md', className }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-semibold text-white shadow-xs ring-1 ring-black/5 ring-inset select-none',
        COLORS[workspace?.color] ?? COLORS.neutral,
        SIZES[size],
        className,
      )}
    >
      {workspace?.name?.trim()[0]?.toUpperCase() ?? '?'}
    </span>
  )
}
