import { useMemo } from 'react'
import type { Asset, Pattern, FaultCode, PatternOccurrence, ISODate, DerivedStatus } from '../data/types'

export const INSPECT_LEFT_WIDTH = 300  // badge + description col
const ROW_HEIGHT = 44

const STATUS_DOT: Record<DerivedStatus, string> = {
  new: '#FF6A00',
  ongoing: '#8B6AFF',
  unclassified: '#52526A',
}

const STATUS_ROW_BG: Record<DerivedStatus, string> = {
  new: '#030303',
  ongoing: '#030303',
  unclassified: '#030303',
}

interface Props {
  asset: Asset
  patterns: Pattern[]
  faultCodeMap: Map<string, FaultCode>
  occurrences: PatternOccurrence[]
  dates: ISODate[]
  deriveStatus: (p: Pattern) => DerivedStatus
}

export function InspectAssetRow({ asset, patterns, faultCodeMap, occurrences, dates, deriveStatus }: Props) {
  const datesSet = useMemo(() => new Set(dates), [dates])

  const fcRows = useMemo(() => {
    const fcSet = new Set<string>()
    for (const p of patterns) for (const fc of p.faultCodes) fcSet.add(fc)

    return [...fcSet].map(fc => {
      const fcPatterns = patterns.filter(p => p.faultCodes.includes(fc))
      const statuses = fcPatterns.map(p => deriveStatus(p))
      const status: DerivedStatus = statuses.includes('new') ? 'new'
        : statuses.includes('ongoing') ? 'ongoing'
        : 'unclassified'
      const patternIds = new Set(fcPatterns.map(p => p.id))
      const occs = occurrences.filter(o => o.faultCode === fc && patternIds.has(o.patternId) && datesSet.has(o.date))
      const description = faultCodeMap.get(fc)?.description ?? ''
      return { fc, status, occs, description }
    }).filter(row => row.occs.length > 0)
  }, [patterns, occurrences, datesSet, deriveStatus, faultCodeMap])

  if (fcRows.length === 0) return null

  return (
    <div style={{
      marginBottom: 8,
      border: '1px solid #1E1E28',
      borderRadius: 6,
      overflow: 'hidden',
    }}>
      {/* Asset name header */}
      <div style={{
        height: 36,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 14px',
        background: '#0B0B12',
        borderBottom: '1px solid #1E1E28',
      }}>
        <span style={{ color: '#3A3A50', fontSize: 12 }}>^</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#E0E0F0' }}>{asset.label}</span>
      </div>

      {/* Fault code rows */}
      {fcRows.map(({ fc, status, occs, description }) => {
        const dotColor = STATUS_DOT[status]
        const rowBg = STATUS_ROW_BG[status]

        return (
          <div
            key={fc}
            style={{
              display: 'flex',
              height: ROW_HEIGHT,
              alignItems: 'center',
              background: rowBg,
              borderBottom: '1px solid #14141C',
            }}
          >
            {/* Left col: badge + description */}
            <div style={{
              width: INSPECT_LEFT_WIDTH,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '0 14px',
              borderRight: '1px solid #1A1A26',
              height: '100%',
            }}>
              <div style={{
                background: '#1C1C28',
                borderRadius: 8,
                padding: '5px 14px',
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '0.06em',
                  fontFamily: 'monospace',
                }}>
                  {fc}
                </span>
              </div>
              <span style={{
                fontSize: 13,
                color: '#5A5A74',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {description}
              </span>
            </div>

            {/* Timeline dots */}
            <div style={{ flex: 1, height: '100%', position: 'relative' }}>
              {occs.map(occ => {
                const di = dates.indexOf(occ.date)
                if (di < 0) return null
                return (
                  <div
                    key={`${occ.date}-${occ.faultCode}`}
                    style={{
                      position: 'absolute',
                      left: `${((di + 0.5) / dates.length) * 100}%`,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: dotColor,
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
