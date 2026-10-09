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
        const isFirst = i === 0
        const isLast = i === N - 1
        const textX = isFirst ? x + 2 : isLast ? x + W - 2 : cx
        const anchor = isFirst ? 'start' : isLast ? 'end' : 'middle'
        return (
          <g key={date}>
            {/* tick */}
            <line x1={x} y1={34} x2={x} y2={40} stroke="#1F1F22" strokeWidth={1} />
            {showLabel && (
              <text
                x={textX}
                y={22}
                textAnchor={anchor}
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
