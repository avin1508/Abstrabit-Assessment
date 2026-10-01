const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const fullDateTime = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })
const compactNumber = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const plainNumber = new Intl.NumberFormat('en-US')

export function formatRelativeTime(iso, now = Date.now()) {
  const diff = now - new Date(iso).getTime()
  if (diff < MINUTE) return 'just now'
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`
  if (diff < 2 * DAY) return 'Yesterday'
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`
  return shortDate.format(new Date(iso))
}

export function formatDateTime(iso) {
  return fullDateTime.format(new Date(iso))
}

export function formatNumber(value) {
  return value >= 10_000 ? compactNumber.format(value) : plainNumber.format(value)
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}


export function formatDuration(ms) {
  if (ms == null) return null
  if (ms < 1000) return `${ms} ms`
  return ms < 60_000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms / 60_000)} min`
}

// Due dates are stored at UTC midnight, so take the date part as-is instead of converting.
export function toDateOnly(value) {
  return value ? String(value).slice(0, 10) : null
}

// YYYY-MM-DD in local time (no timezone shift).
function parseDate(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const dateWithYear = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export function formatDate(value) {
  if (!value) return null
  const date = parseDate(value)
  return date.getFullYear() === new Date().getFullYear() ? shortDate.format(date) : dateWithYear.format(date)
}

export function dueState(value, status) {
  if (!value || status === 'completed') return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((parseDate(value) - today) / DAY)
  if (days < 0) return { tone: 'danger', label: days === -1 ? 'Overdue by 1 day' : `Overdue by ${-days} days` }
  if (days === 0) return { tone: 'warning', label: 'Due today' }
  if (days === 1) return { tone: 'warning', label: 'Due tomorrow' }
  return { tone: 'neutral', label: `Due in ${days} days` }
}
