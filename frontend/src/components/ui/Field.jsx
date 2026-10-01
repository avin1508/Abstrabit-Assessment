import { cn } from '../../utils/cn.js'

// `floatingMessage` puts the hint/error in the gap below the field so the form doesn't jump
// when it appears. Needs ~20px below the field and fits one line.
export default function Field({ id, label, labelAction, hint, error, required, floatingMessage, className, children }) {
  const messageClass = floatingMessage ? 'absolute inset-x-0 top-full mt-1 truncate text-xs' : 'mt-1.5 text-xs'

  return (
    <div className={cn(floatingMessage && 'relative', className)}>
      {(label || labelAction) && (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          {label && (
            <label htmlFor={id} className="block text-sm font-medium text-fg">
              {label}
              {required && (
                <span className="ml-0.5 text-red-500" aria-hidden>
                  *
                </span>
              )}
            </label>
          )}
          {labelAction}
        </div>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className={cn(messageClass, 'text-red-600')}>
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className={cn(messageClass, 'text-fg-subtle')}>
            {hint}
          </p>
        )
      )}
    </div>
  )
}
