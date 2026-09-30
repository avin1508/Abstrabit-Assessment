import { cn } from '../../utils/cn.js'

// Label + hint/error wrapper shared by Input, Textarea and Select.
// `labelAction` renders on the right of the label row (e.g. a "Forgot password?" link).
// `floatingMessage` places the hint/error in the gap below the field instead of adding height,
// so messages appearing or disappearing don't shift the rest of the form. It needs about
// 20px of space below the field (a `space-y-6` parent leaves a little air) and fits one line.
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
