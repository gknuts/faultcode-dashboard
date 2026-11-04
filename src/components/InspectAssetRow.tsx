import { useMemo, useState } from 'react'
import type { Asset, Pattern, FaultCode, PatternOccurrence, ISODate, DerivedStatus } from '../data/types'

export const INSPECT_LEFT_WIDTH = 300

const ROW_HEIGHT = 44

const STATUS_DOT: Record<DerivedStatus, string> = {
  new: '#FF6A00',
  ongoing: '#8B6AFF',
  unclassified: '#52526A',
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
  const [collapsed, setCollapsed] = useState(false)
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
        borderBottom: collapsed ? 'none' : '1px solid #1E1E28',
        cursor: 'default',
      }}>
        <span
          onClick={() => setCollapsed(c => !c)}
          style={{
            color: '#52526A',
            fontSize: 11,
            cursor: 'pointer',
            userSelect: 'none',
            transform: collapsed ? 'rotate(-90deg)' : 'none',
            display: 'inline-block',
            transition: 'transform 0.15s',
          }}
        >▾</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#E0E0F0' }}>{asset.label}</span>
      </div>

      {/* Fault code rows */}
      {!collapsed && fcRows.map(({ fc, status, occs, description }) => {
        const dotColor = STATUS_DOT[status]

        return (
          <div
            key={fc}
            style={{
              display: 'flex',
              height: ROW_HEIGHT,
              alignItems: 'center',
              background: '#030303',
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

            {/* Timeline — SVG circles sized by count */}
            <div style={{ flex: 1, height: '100%', position: 'relative' }}>
              <svg width="100%" height="100%" style={{ display: 'block', overflow: 'visible' }}>
                {occs.map(occ => {
                  const di = dates.indexOf(occ.date)
                  if (di < 0) return null
                  const cx = `${((di + 0.5) / dates.length) * 100}%`
                  const cy = ROW_HEIGHT / 2
                  const r = Math.min(5 + occ.count * 0.9, 11)
                  return (
                    <circle
                      key={`${occ.date}-${occ.faultCode}`}
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={dotColor}
                      fillOpacity={0.9}
                    />
                  )
                })}
              </svg>
            </div>
          </div>
        )
      })}
    </div>
  )
}
