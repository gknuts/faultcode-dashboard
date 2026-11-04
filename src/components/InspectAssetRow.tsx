import { useMemo } from 'react'
import type { Asset, Pattern, FaultCode, PatternOccurrence, ISODate, DerivedStatus } from '../data/types'

const STATUS_COLOR: Record<DerivedStatus, string> = {
  new: '#FF6A00',
  ongoing: '#8B6AFF',
  unclassified: '#52526A',
}

const STATUS_DOT: Record<DerivedStatus, string> = {
  new: '#FF6A00',
  ongoing: '#8B6AFF',
  unclassified: '#6A6A80',
}

const STATUS_BAR_BG: Record<DerivedStatus, string> = {
  new: 'rgba(255,106,0,0.12)',
  ongoing: 'rgba(139,106,255,0.12)',
  unclassified: 'rgba(82,82,106,0.12)',
}

interface Props {
  asset: Asset
  patterns: Pattern[]
  faultCodeMap: Map<string, FaultCode>
  occurrences: PatternOccurrence[]
  dates: ISODate[]
  deriveStatus: (p: Pattern) => DerivedStatus
}

const FC_COL_WIDTH = 60
const ROW_HEIGHT = 32

export function InspectAssetRow({ asset, patterns, faultCodeMap, occurrences, dates, deriveStatus }: Props) {
  const datesSet = useMemo(() => new Set(dates), [dates])

  if (patterns.length === 0) return null

  const topStatus: DerivedStatus = patterns.some(p => deriveStatus(p) === 'new')
    ? 'new'
    : patterns.some(p => deriveStatus(p) === 'ongoing')
      ? 'ongoing'
      : 'unclassified'

  return (
    <div style={{
      background: '#0D0D14',
      border: '1px solid #1E1E28',
      borderLeft: `3px solid ${STATUS_COLOR[topStatus]}`,
      borderRadius: 4,
      marginBottom: 6,
      overflow: 'hidden',
    }}>
      {/* Asset header */}
      <div style={{
        height: 30,
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #181820',
        background: '#10101A',
      }}>
        <div style={{ width: FC_COL_WIDTH, flexShrink: 0, padding: '0 10px' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#3A3A50', letterSpacing: '0.08em', textTransform: 'uppercase' }}>FC</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#C4C4D4' }}>{asset.label}</span>
          <span style={{
            fontSize: 10, fontWeight: 600, color: STATUS_COLOR[topStatus],
            background: STATUS_BAR_BG[topStatus],
            padding: '1px 6px', borderRadius: 10,
          }}>
            {patterns.length} pattern{patterns.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* One row per pattern */}
      {patterns.map(pattern => {
        const status = deriveStatus(pattern)
        const dotColor = STATUS_DOT[status]
        const barBg = STATUS_BAR_BG[status]
        const patternOccs = occurrences.filter(o => o.patternId === pattern.id && datesSet.has(o.date))

        // Find span of pattern within visible dates
        const startDi = dates.findIndex(d => d >= pattern.startDate)
        const endBound = pattern.endDate ?? dates[dates.length - 1]
        let endDi = dates.length - 1
        for (let i = dates.length - 1; i >= 0; i--) {
          if (dates[i] <= endBound) { endDi = i; break }
        }
        const hasSpan = startDi >= 0 && endDi >= startDi
        const spanLeft = hasSpan ? `${(startDi / dates.length) * 100}%` : '0%'
        const spanWidth = hasSpan ? `${((endDi - startDi + 1) / dates.length) * 100}%` : '0%'

        return (
          <div
            key={pattern.id}
            style={{ display: 'flex', height: ROW_HEIGHT, alignItems: 'center', borderBottom: '1px solid #14141C' }}
          >
            {/* Fault code badges */}
            <div style={{
              width: FC_COL_WIDTH,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: '2px 6px',
              borderRight: '1px solid #1A1A26',
              height: '100%',
            }}>
              {pattern.faultCodes.slice(0, 2).map(fc => (
                <span key={fc} style={{
                  fontSize: 9, fontWeight: 700,
                  color: dotColor,
                  background: barBg,
                  padding: '1px 5px',
                  borderRadius: 3,
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block',
                  textAlign: 'center',
                }}>{fc}</span>
              ))}
              {pattern.faultCodes.length > 2 && (
                <span style={{ fontSize: 8, color: '#3A3A50' }}>+{pattern.faultCodes.length - 2}</span>
              )}
            </div>

            {/* Timeline area */}
            <div style={{ flex: 1, height: '100%', position: 'relative' }}>
              {/* Pattern span background */}
              {hasSpan && (
                <div style={{
                  position: 'absolute',
                  left: spanLeft,
                  width: spanWidth,
                  top: '20%', bottom: '20%',
                  background: barBg,
                  borderRadius: 2,
                  pointerEvents: 'none',
                }} />
              )}

              {/* Occurrence dots */}
              {patternOccs.map(occ => {
                const di = dates.indexOf(occ.date)
                if (di < 0) return null
                const x = ((di + 0.5) / dates.length) * 100
                return (
                  <div
                    key={`${occ.date}-${occ.faultCode}`}
                    style={{
                      position: 'absolute',
                      left: `${x}%`,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: dotColor,
                      opacity: 0.85,
                    }}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
