import { useId } from 'react'
import { cn } from '../../utils/cn.js'
import Field from './Field.jsx'
import { controlClasses, describedBy } from './fieldStyles.js'

const SIZES = { sm: 'h-7 text-xs', md: 'h-8.5', lg: 'h-10' }

export default function Input({
  id,
  label,
  labelAction,
  hint,
  error,
  required,
  size = 'md',
  leftIcon: LeftIcon,
  rightElement,
  className,
  ...props
}) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <Field
      id={inputId}
      label={label}
      labelAction={labelAction}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <div className="relative">
        {LeftIcon && (
          <LeftIcon
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-fg-subtle"
            aria-hidden
          />
        )}
        <input
          id={inputId}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          className={cn(controlClasses(error), SIZES[size], LeftIcon ? 'pl-8.5' : 'pl-3', rightElement ? 'pr-10' : 'pr-3')}
          {...props}
          aria-describedby={
            [describedBy(inputId, { error, hint }), props['aria-describedby']].filter(Boolean).join(' ') || undefined
          }
        />
        {rightElement && <div className="absolute inset-y-0 right-1.5 flex items-center">{rightElement}</div>}
      </div>
    </Field>
  )
}
