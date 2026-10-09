import { format, addDays, subDays, addMonths, subMonths, parseISO, isAfter } from 'date-fns'
import type { ISODate, ViewMode } from '../data/types'

export function toISO(d: Date): ISODate {
  return format(d, 'yyyy-MM-dd')
}

export function fromISO(s: ISODate): Date {
  return parseISO(s)
}

export function todayISO(): ISODate {
  return toISO(new Date())
}

// Default end date is today — period shows recent history ending at today
export function centeredEnd(_view: ViewMode): ISODate {
  return todayISO()
}

// Returns [startDate, endDate] for a period ending at 'end'
export function getPeriodRange(view: ViewMode, end: ISODate): [ISODate, ISODate] {
  const endDate = fromISO(end)
  if (view === '1W') {
    return [toISO(subDays(endDate, 6)), end]
  }
  // 1M: same day of previous month; if it doesn't exist, last day of that month
  const prev = subMonths(endDate, 1)
  // date-fns subMonths handles overflow (e.g. Jan 31 → Dec 31)
  return [toISO(prev), end]
}

// Returns ordered list of ISO dates in period
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

// Navigate period end by one period — no future limit, view is centered on today
export function navigateEnd(view: ViewMode, end: ISODate, dir: -1 | 1): ISODate {
  const endDate = fromISO(end)
  if (view === '1W') return toISO(addDays(endDate, dir * 7))
  return toISO(dir === 1 ? addMonths(endDate, 1) : subMonths(endDate, 1))
}

export function formatPeriodText(start: ISODate, end: ISODate): string {
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

export function isToday(date: ISODate): boolean {
  return date === todayISO()
}

export function isTodayInRange(dates: ISODate[]): boolean {
  const t = todayISO()
  return dates.includes(t)
}
