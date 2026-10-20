import { useMemo } from 'react'
import type { Pattern, PatternOccurrence, DerivedStatus } from '../data/types'

interface Props {
  pattern: Pattern
  occurrences: PatternOccurrence[]
  dates: string[]
  status: DerivedStatus
}

const ABNORMAL_COLORS: Record<DerivedStatus, string> = {
  new: '#F0436A',
  ongoing: '#F97316',
  resolved: '#71717A',
  ignored: '#3F3F46',
}

const ROW_HEIGHT = 36

export function PatternTimeline({ pattern, occurrences, dates, status }: Props) {
  const occMap = useMemo(() => {
    const map = new Map<string, Map<string, { count: number; status: 'abnormal' | 'normal' }>>()
    for (const occ of occurrences) {
      if (occ.patternId !== pattern.id) continue
      let inner = map.get(occ.faultCode)
      if (!inner) { inner = new Map(); map.set(occ.faultCode, inner) }
      inner.set(occ.date, { count: occ.count, status: occ.status })
    }
    return map
  }, [occurrences, pattern.id])

  const abnormalColor = ABNORMAL_COLORS[status]
  const fcs = pattern.faultCodes
  const totalHeight = fcs.length * ROW_HEIGHT

  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>
      <svg width="100%" height={totalHeight} style={{ display: 'block' }}>
        {/* FC rows */}
        {fcs.map((fc, fi) => {
          const fcMap = occMap.get(fc)
          const y = fi * ROW_HEIGHT

          return (
            <g key={fc}>
              {/* Row background */}
              <rect
                x={0}
                y={y}
                width="100%"
                height={ROW_HEIGHT}
                fill={fi % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}
              />

              {/* Dots */}
              {dates.map((date, di) => {
                const occ = fcMap?.get(date)
                if (!occ) return null
                const cx = `${((di + 0.5) / dates.length) * 100}%`
                const cy = y + ROW_HEIGHT / 2

                if (occ.status === 'normal') {
                  return (
                    <circle key={date} cx={cx} cy={cy} r={3} fill="#2ECC71" fillOpacity={0.35} />
                  )
                }
                const r = Math.min(4 + occ.count, 10)
                return (
                  <circle key={date} cx={cx} cy={cy} r={r} fill={abnormalColor} fillOpacity={0.95} />
                )
              })}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
