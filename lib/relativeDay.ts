const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS)
}

function absoluteDate(d: Date): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(d)
}

// ponytail: months approximated as 30-day blocks, use calendar month math if exact boundaries matter
export function formatRelativeDay(date: Date, today: Date = new Date(), monthThreshold = 6): string {
  const days = daysBetween(today, date)

  if (days < 0) return absoluteDate(date)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days <= 6) return `In ${days} days`
  if (days <= 27) {
    const weeks = Math.floor(days / 7)
    return `In ${weeks} week${weeks === 1 ? '' : 's'}`
  }

  const months = Math.max(1, Math.round(days / 30))
  if (months <= monthThreshold) return `In ${months} month${months === 1 ? '' : 's'}`

  return absoluteDate(date)
}
