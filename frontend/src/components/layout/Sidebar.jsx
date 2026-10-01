import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { LogOut, X } from 'lucide-react'
import { PATHS } from '../../routes/paths.js'
import { NAV_SECTIONS } from '../../routes/navigation.js'
import useAuth from '../../hooks/useAuth.js'
import { logout } from '../../store/slices/authSlice.js'
import { cn } from '../../utils/cn.js'
import { focusRing } from '../../utils/styles.js'
import Logo from '../common/Logo.jsx'
import Avatar from '../ui/Avatar.jsx'
import IconButton from '../ui/IconButton.jsx'
import WorkspaceSwitcher from '../workspace/WorkspaceSwitcher.jsx'

function NavItem({ item, onNavigate }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors',
          focusRing,
          isActive
            ? 'bg-surface font-medium text-fg shadow-xs ring-1 ring-line'
            : 'text-fg-muted hover:bg-surface/70 hover:text-fg',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn('size-4 shrink-0', isActive ? 'text-brand-600' : 'text-fg-subtle group-hover:text-fg-muted')}
            aria-hidden
          />
          {item.label}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  function handleLogout() {
    dispatch(logout())
    navigate(PATHS.LOGIN, { replace: true })
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-canvas transition-transform duration-200 lg:static lg:w-60 lg:translate-x-0',
        open ? 'translate-x-0 shadow-overlay' : '-translate-x-full',
      )}
    >
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <Logo />
        <IconButton icon={X} label="Close navigation" size="sm" tooltip={false} onClick={onClose} className="lg:hidden" />
      </div>

      <div className="shrink-0 px-3 pt-1 pb-2">
        <WorkspaceSwitcher onSwitch={onClose} />
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="mb-1.5 px-2.5 font-mono text-[10px] font-medium tracking-widest text-fg-subtle uppercase">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem key={item.to} item={item} onNavigate={onClose} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-2.5 border-t border-line p-3">
        <Avatar name={user.name} size="md" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-fg">{user.name}</span>
          <span className="block truncate text-xs text-fg-subtle">{user.email}</span>
        </span>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sign out"
          title="Sign out"
          className={cn('rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-surface hover:text-fg', focusRing)}
        >
          <LogOut className="size-4" aria-hidden />
        </button>
      </div>
    </aside>
  )
}
