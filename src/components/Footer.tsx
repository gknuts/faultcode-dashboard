import { Clock } from 'lucide-react'
import { DateAxis } from './DateAxis'
import type { ISODate, ViewMode } from '../data/types'
import { formatPeriodText } from '../lib/dates'

interface FooterProps {
  dates: ISODate[]
  view: ViewMode
  timelineWidth: number
  periodStart: ISODate
  periodEnd: ISODate
}

export function Footer({ dates, view, timelineWidth, periodStart, periodEnd }: FooterProps) {
  return (
    <footer
      className="flex shrink-0"
      style={{
        height: 56,
        background: '#111113',
        borderTop: '1px solid #1F1F22',
      }}
    >
      {/* Left column */}
      <div
        className="flex items-center gap-2 shrink-0"
        style={{ width: 420, paddingLeft: 8 }}
      >
        <Clock size={16} color="#A1A1AA" />
        <span style={{ fontSize: 14, color: '#A1A1AA' }}>
          {formatPeriodText(periodStart, periodEnd)}
        </span>
      </div>
      {/* Timeline axis */}
      <div className="flex items-center" style={{ width: timelineWidth }}>
        <DateAxis dates={dates} timelineWidth={timelineWidth} view={view} />
      </div>
      {/* Action column */}
      <div style={{ width: 56 }} />
    </footer>
  )
}
