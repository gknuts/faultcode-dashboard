import { useMemo } from 'react'
import type { Pattern, PatternOccurrence, DerivedStatus } from '../data/types'

interface Props {
  pattern: Pattern
  occurrences: PatternOccurrence[]
  dates: string[]
  status: DerivedStatus
  labelStep: number
}

const ABNORMAL_COLORS: Record<DerivedStatus, string> = {
  new: '#E8394A',
  ongoing: '#D97010',
  resolved: '#52525B',
  ignored: '#3F3F46',
}

const ABNORMAL_BG: Record<DerivedStatus, string> = {
  new: 'rgba(232,57,74,0.10)',
  ongoing: 'rgba(217,112,16,0.10)',
  resolved: 'rgba(82,82,91,0.04)',
  ignored: 'rgba(63,63,70,0.04)',
}

// Each FC code = 2 visual sub-rows: label row + dots row
export const LABEL_HEIGHT = 26
export const DOTS_HEIGHT = 42
export const ROW_HEIGHT = LABEL_HEIGHT + DOTS_HEIGHT

export function PatternTimeline({ pattern, occurrences, dates, status, labelStep }: Props) {
  const occMap = useMemo(() => {
    const map = new Map<string, Map<string, { count: number; occStatus: 'abnormal' | 'normal' }>>()
    for (const occ of occurrences) {
      if (occ.patternId !== pattern.id) continue
      let inner = map.get(occ.faultCode)
      if (!inner) { inner = new Map(); map.set(occ.faultCode, inner) }
      inner.set(occ.date, { count: occ.count, occStatus: occ.status })
    }
    return map
  }, [occurrences, pattern.id])

  const abnormalColor = ABNORMAL_COLORS[status]
  const abnormalBg = ABNORMAL_BG[status]
  const fcs = pattern.faultCodes
  const totalHeight = fcs.length * ROW_HEIGHT

  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>
      <svg width="100%" height={totalHeight} style={{ display: 'block' }}>
        {/* Vertical grid lines */}
        {dates.map((_, di) => {
          if (di % labelStep !== 0) return null
          const x = `${((di + 0.5) / dates.length) * 100}%`
          return <line key={`g${di}`} x1={x} y1={0} x2={x} y2={totalHeight} stroke="#1A1A24" strokeWidth={1} />
        })}

        {/* Today dashed marker */}
        {(() => {
          const todayX = `${((dates.length - 0.5) / dates.length) * 100}%`
          return <line x1={todayX} y1={0} x2={todayX} y2={totalHeight} stroke="rgba(150,150,220,0.22)" strokeWidth={1.5} strokeDasharray="3 3" />
        })()}

        {fcs.map((fc, fi) => {
          const fcMap = occMap.get(fc)
          const yTop = fi * ROW_HEIGHT
          const yDots = yTop + LABEL_HEIGHT   // dots sub-row starts here
          const hasAbnormal = dates.some(d => fcMap?.get(d)?.occStatus === 'abnormal')

          return (
            <g key={fc}>
              {/* Label sub-row background */}
              <rect x={0} y={yTop} width="100%" height={LABEL_HEIGHT}
                fill="rgba(0,0,0,0.15)" />

              {/* Dots sub-row background — tinted if anomaly */}
              <rect x={0} y={yDots} width="100%" height={DOTS_HEIGHT}
                fill={hasAbnormal ? abnormalBg : 'transparent'} />

              {/* Row bottom separator */}
              {fi < fcs.length - 1 && (
                <line x1={0} y1={yTop + ROW_HEIGHT} x2="100%" y2={yTop + ROW_HEIGHT}
                  stroke="#1A1A24" strokeWidth={1} />
              )}

              {/* Dots — rendered in the dots sub-row */}
              {dates.map((date, di) => {
                const occ = fcMap?.get(date)
                if (!occ) return null
                const cx = `${((di + 0.5) / dates.length) * 100}%`
                const cy = yDots + DOTS_HEIGHT / 2

                if (occ.occStatus === 'normal') {
                  return <circle key={date} cx={cx} cy={cy} r={5} fill="#2ECC71" fillOpacity={0.8} />
                }
                const r = Math.min(5 + occ.count * 0.9, 11)
                return <circle key={date} cx={cx} cy={cy} r={r} fill={abnormalColor} fillOpacity={0.92} />
              })}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
