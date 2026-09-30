// Label + hint/error wrapper shared by Input, Textarea and Select.
// `labelAction` renders on the right of the label row (e.g. a "Forgot password?" link).
export default function Field({ id, label, labelAction, hint, error, required, className, children }) {
  return (
    <div className={className}>
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
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-fg-subtle">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
