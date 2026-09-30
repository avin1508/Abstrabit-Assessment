import { Check, Minus } from 'lucide-react'
import { cn } from '../../utils/cn.js'
import { getPasswordStrength } from '../../utils/validation.js'

const BAR_COLORS = ['', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600']
const LABEL_COLORS = ['text-fg-subtle', 'text-red-600', 'text-amber-700', 'text-emerald-700', 'text-emerald-700']

export default function PasswordStrengthMeter({ password, id }) {
  const { score, label, checks } = getPasswordStrength(password)

  return (
    <div id={id} className="mt-2.5">
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1" aria-hidden>
          {[1, 2, 3, 4].map((step) => (
            <span
              key={step}
              className={cn('h-1 rounded-full transition-colors', step <= score ? BAR_COLORS[score] : 'bg-line')}
            />
          ))}
        </div>
        <p className={cn('w-16 text-right text-xs font-medium', LABEL_COLORS[score])} aria-live="polite">
          {label}
          <span className="sr-only">{label && ' password strength'}</span>
        </p>
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        {checks.map((check) => (
          <li
            key={check.id}
            className={cn('flex items-center gap-1.5 text-xs', check.met ? 'text-fg-muted' : 'text-fg-subtle')}
          >
            {check.met ? (
              <Check className="size-3 text-emerald-600" strokeWidth={3} aria-hidden />
            ) : (
              <Minus className="size-3" aria-hidden />
            )}
            {check.label}
            <span className="sr-only">{check.met ? '(met)' : '(not met)'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
