import { format, parseISO } from 'date-fns'
import type { ISODate, ViewMode } from '../data/types'

interface DateAxisProps {
  dates: ISODate[]
  timelineWidth: number
  view: ViewMode
}

export function DateAxis({ dates, timelineWidth, view }: DateAxisProps) {
  const N = dates.length
  const W = N > 0 ? timelineWidth / N : 0

  return (
    <svg width={timelineWidth} height={40} style={{ display: 'block', flexShrink: 0 }}>
      {dates.map((date, i) => {
        const x = i * W
        const cx = x + W / 2
        const showLabel = view === '1W' || i === 0 || i % 4 === 0
        const label = format(parseISO(date), 'd MMM')
        return (
          <g key={date}>
            {/* tick */}
            <line x1={x} y1={34} x2={x} y2={40} stroke="#1F1F22" strokeWidth={1} />
            {showLabel && (
              <text
                x={cx}
                y={22}
                textAnchor="middle"
                fill="#A1A1AA"
                fontSize={12}
                fontFamily="Inter, system-ui, sans-serif"
              >
                {label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
