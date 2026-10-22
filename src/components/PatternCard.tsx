import { useMemo } from 'react'
import type { Pattern, PatternOccurrence, FaultCode, DerivedStatus } from '../data/types'
import { LABEL_HEIGHT, DOTS_HEIGHT } from './PatternTimeline'
import { fromISO } from '../lib/dates'
import { format } from 'date-fns'

const BADGE_WIDTH = 60

interface Props {
  pattern: Pattern
  status: DerivedStatus
  faultCodeMap: Map<string, FaultCode>
  occurrences: PatternOccurrence[]
  dates: string[]
  labelStep: number
  validation: 'abnormal' | 'normal' | undefined
  isIgnored: boolean
  fcColWidth: number
  onValidate: (status: 'abnormal' | 'normal') => void
  onIgnore: () => void
}

const STATUS_ACCENT: Record<DerivedStatus, string> = {
  new: '#E8394A',
  ongoing: '#D97010',
  resolved: '#3F3F52',
  ignored: '#2A2A30',
}

const STATUS_CARD_BG: Record<DerivedStatus, string> = {
  new: '#150C0F',
  ongoing: '#130E08',
  resolved: '#0D0D11',
  ignored: '#0C0C10',
}

const STATUS_BORDER: Record<DerivedStatus, string> = {
  new: '#2A1218',
  ongoing: '#201408',
  resolved: '#1A1A20',
  ignored: '#181818',
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

function formatDate(d: string) {
  return format(fromISO(d), 'd MMM yyyy')
}

export function PatternCard({
  pattern, status, faultCodeMap, occurrences, dates, labelStep,
  validation, isIgnored, onValidate, onIgnore,
}: Props) {
  const accent = STATUS_ACCENT[status]
  const cardBg = STATUS_CARD_BG[status]
  const cardBorder = STATUS_BORDER[status]
  const isResolved = status === 'resolved' || status === 'ignored'
  const abnormalColor = ABNORMAL_COLORS[status]
  const abnormalBg = ABNORMAL_BG[status]

  // Pre-build occurrence map per FC code
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

  return (
    <div style={{
      background: cardBg,
      border: `1px solid ${cardBorder}`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: 4,
      marginBottom: 8,
      opacity: isIgnored ? 0.5 : 1,
      overflow: 'hidden',
      paddingLeft: 15,
    }}>
      {/* Per-FC rows: label row (full width) + dots row */}
      {pattern.faultCodes.map((code, i) => {
        const fc = faultCodeMap.get(code)
        const fcMap = occMap.get(code)
        const hasAbnormal = dates.some(d => fcMap?.get(d)?.occStatus === 'abnormal')
        const isLast = i === pattern.faultCodes.length - 1

        return (
          <div key={code} style={{ marginBottom: !isLast ? 5 : 0 }}>

            {/* LABEL ROW — full card width */}
            <div style={{
              display: 'flex',
              alignItems: 'stretch',
              height: LABEL_HEIGHT,
              background: 'rgba(0,0,0,0.18)',
            }}>
              {/* Badge */}
              <div style={{
                width: BADGE_WIDTH,
                flexShrink: 0,
                background: hasAbnormal ? '#2D1D20' : '#050508',
                borderTop: '1px solid #3D3D3D',
                borderLeft: '1px solid #3D3D3D',
                borderRight: '1px solid #3D3D3D',
                borderRadius: '4px 4px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{
                  fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", monospace',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  letterSpacing: '0.06em',
                }}>
                  {code}
                </span>
              </div>
              {/* Description — spans full remaining width */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 12px', overflow: 'hidden', borderBottom: `1px solid ${cardBorder}` }}>
                <span style={{ fontSize: 12, color: '#8080A0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fc?.description ?? '—'}
                </span>
              </div>
            </div>

            {/* DOTS ROW — badge-width spacer only, dots start right under badge */}
            <div style={{ display: 'flex', height: DOTS_HEIGHT }}>
              {/* Badge-width dark spacer — visually continues the badge frame */}
              <div style={{
                width: BADGE_WIDTH,
                flexShrink: 0,
                background: hasAbnormal ? '#2D1D20' : '#050508',
                borderLeft: '1px solid #3D3D3D',
                borderRight: '1px solid #3D3D3D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, aspectRatio: '1/1', opacity: 0.6 }}>
                  <path d="M10.5 8.9982C10.5 7.12942 8.76225 5.25 6.64285 5.25L5.35714 5.25001C3.2269 5.25001 1.5 6.92814 1.5 8.9982C1.5 10.782 2.7823 12.2748 4.5 12.6536C4.77567 12.7144 5.06255 12.7464 5.35714 12.7464" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="white"/>
                  <path d="M7.5 8.99821C7.5 10.867 9.23775 12.7464 11.3572 12.7464H12.6428C14.7731 12.7464 16.5 11.0683 16.5 8.99821C16.5 7.21441 15.2177 5.72164 13.5 5.34288C13.2243 5.28209 12.9374 5.25 12.6428 5.25" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="white"/>
                </svg>
              </div>
              {/* Mini timeline for this FC code */}
              <div style={{ flex: 1, background: '#211519' }}>
                <svg width="100%" height={DOTS_HEIGHT} style={{ display: 'block' }}>
                  {/* Grid lines */}
                  {dates.map((_, di) => {
                    if (di % labelStep !== 0) return null
                    const x = `${((di + 0.5) / dates.length) * 100}%`
                    return <line key={`g${di}`} x1={x} y1={0} x2={x} y2={DOTS_HEIGHT} stroke="#1A1A24" strokeWidth={1} />
                  })}
                  {/* Today dashed line */}
                  <line
                    x1={`${((dates.length - 0.5) / dates.length) * 100}%`}
                    y1={0}
                    x2={`${((dates.length - 0.5) / dates.length) * 100}%`}
                    y2={DOTS_HEIGHT}
                    stroke="rgba(150,150,220,0.22)" strokeWidth={1.5} strokeDasharray="3 3"
                  />
                  {/* Dots */}
                  {dates.map((date, di) => {
                    const occ = fcMap?.get(date)
                    if (!occ) return null
                    const cx = `${((di + 0.5) / dates.length) * 100}%`
                    const cy = DOTS_HEIGHT / 2
                    if (occ.occStatus === 'normal') {
                      return <circle key={date} cx={cx} cy={cy} r={5} fill="#2ECC71" fillOpacity={0.8} />
                    }
                    const r = Math.min(5 + occ.count * 0.9, 11)
                    return <circle key={date} cx={cx} cy={cy} r={r} fill={abnormalColor} fillOpacity={0.92} />
                  })}
                </svg>
              </div>
            </div>

          </div>
        )
      })}

      {/* Footer: date range + actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '7px 14px',
        borderTop: `1px solid ${cardBorder}`,
      }}>
        <span style={{ fontSize: 11, color: '#42424E' }}>
          {formatDate(pattern.startDate)}
          {pattern.endDate ? ` → ${formatDate(pattern.endDate)}` : ' → ongoing'}
        </span>

        {!isResolved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={onIgnore} style={{
              background: 'transparent', border: 'none',
              color: '#52526A', fontSize: 11, fontWeight: 500,
              cursor: 'pointer', padding: '3px 2px',
            }}>
              Ignore
            </button>
            <Divider />
            <GhostButton label="Create an alert" onClick={() => {}} />
            <span style={{ color: '#2A2A3A', fontSize: 11 }}>|</span>
            <GhostButton label="Create a ticket" onClick={() => {}} />
            <Divider />
            <div style={{ display: 'flex', border: '1px solid #2A2A3A', borderRadius: 20, overflow: 'hidden' }}>
              <SegmentButton label="Abnormal" active={validation === 'abnormal'} activeColor="#E8394A" onClick={() => onValidate('abnormal')} />
              <div style={{ width: 1, background: '#2A2A3A', flexShrink: 0 }} />
              <SegmentButton label="Normal" active={validation === 'normal'} activeColor="#22C55E" onClick={() => onValidate('normal')} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function GhostButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'transparent', border: '1px solid #2A2A3A', borderRadius: 4,
      color: '#71717A', fontSize: 11, fontWeight: 500, padding: '3px 10px', cursor: 'pointer',
    }}>
      {label}
    </button>
  )
}

function SegmentButton({ label, active, activeColor, onClick }: {
  label: string; active: boolean; activeColor: string; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      background: active ? activeColor : 'transparent', border: 'none',
      color: active ? '#FFFFFF' : '#71717A', fontSize: 11, fontWeight: 600,
      padding: '4px 12px', cursor: 'pointer',
    }}>
      {label}
    </button>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 14, background: '#2A2A3A', flexShrink: 0 }} />
}
