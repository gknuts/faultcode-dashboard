import { format, addDays, subDays, addMonths, subMonths, parseISO, isAfter } from 'date-fns'
import type { ISODate, ViewMode } from '../data/types'

export function toISO(d: Date): ISODate {
  return format(d, 'yyyy-MM-dd')
}

export function fromISO(s: ISODate): Date {
  return parseISO(s)
}

const DEMO_TODAY = '2026-11-03'

export function todayISO(): ISODate {
  return DEMO_TODAY
}

// Returns [startDate, endDate] — endDate is always today
export function getPeriodRange(view: ViewMode): [ISODate, ISODate] {
  const end = todayISO()
  const endDate = fromISO(DEMO_TODAY)
  if (view === '3D') return [toISO(subDays(endDate, 2)), end]
  if (view === '1W') return [toISO(subDays(endDate, 6)), end]
  return [toISO(subMonths(endDate, 1)), end]
}

export function getDatesInRange(start: ISODate, end: ISODate): ISODate[] {
  const dates: ISODate[] = []
  let cur = fromISO(start)
  const endDate = fromISO(end)
  while (!isAfter(cur, endDate)) {
    dates.push(toISO(cur))
    cur = addDays(cur, 1)
  }
  return dates
}

// Keep for potential future use
export function navigateEnd(view: ViewMode, end: ISODate, dir: -1 | 1): ISODate {
  const endDate = fromISO(end)
  if (view === '3D') return toISO(addDays(endDate, dir * 3))
  if (view === '1W') return toISO(addDays(endDate, dir * 7))
  return toISO(dir === 1 ? addMonths(endDate, 1) : subMonths(endDate, 1))
}

export function formatPeriodLabel(start: ISODate, end: ISODate): string {
  const s = fromISO(start)
  const e = fromISO(end)
  if (s.getFullYear() !== e.getFullYear()) {
    return format(s, 'd MMM yyyy') + ' – ' + format(e, 'd MMM yyyy')
  }
  return format(s, 'd MMM') + ' – ' + format(e, 'd MMM yyyy')
}

export function formatAxisLabel(date: ISODate): string {
  return format(fromISO(date), 'd MMM')
}

export function todayDefaultSessionAt(): string {
  // Default: 7 days ago, so recent patterns show as "new" on first visit
  return subDays(fromISO(DEMO_TODAY), 7).toISOString()
}
