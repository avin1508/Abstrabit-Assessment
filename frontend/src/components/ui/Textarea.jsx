import { useId } from 'react'
import { cn } from '../../utils/cn.js'
import Field from './Field.jsx'
import { controlClasses, describedBy } from './fieldStyles.js'

export default function Textarea({ id, label, hint, error, required, rows = 4, className, ...props }) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <Field id={inputId} label={label} hint={hint} error={error} required={required} className={className}>
      <textarea
        id={inputId}
        rows={rows}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy(inputId, { error, hint })}
        className={cn(controlClasses(error), 'resize-y px-3 py-2 leading-relaxed')}
        {...props}
      />
    </Field>
  )
}
