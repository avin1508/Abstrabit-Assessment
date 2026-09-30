// Mock timestamps are relative to page load so the demo never looks stale.
export function ago({ days = 0, hours = 0, minutes = 0, seconds = 0 }) {
  const ms = (((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000
  return new Date(Date.now() - ms).toISOString()
}

// Calendar date `days` from today as YYYY-MM-DD (local time), for due dates.
export function inDays(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}
