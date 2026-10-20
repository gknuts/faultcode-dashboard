import type { Pattern, PatternOccurrence, FaultCode, DerivedStatus } from '../data/types'
import { PatternTimeline } from './PatternTimeline'
import { fromISO } from '../lib/dates'
import { format } from 'date-fns'

interface Props {
  pattern: Pattern
  status: DerivedStatus
  faultCodeMap: Map<string, FaultCode>
  occurrences: PatternOccurrence[]
  dates: string[]
  validation: 'abnormal' | 'normal' | undefined
  isIgnored: boolean
  fcColWidth: number
  onValidate: (status: 'abnormal' | 'normal') => void
  onIgnore: () => void
}

const STATUS_ACCENT: Record<DerivedStatus, string> = {
  new: '#E8394A',
  ongoing: '#E8760A',
  resolved: '#3F3F46',
  ignored: '#2A2A2E',
}

function formatDate(d: string) {
  return format(fromISO(d), 'd MMM yyyy')
}

export function PatternCard({
  pattern, status, faultCodeMap, occurrences, dates,
  validation, isIgnored, fcColWidth, onValidate, onIgnore,
}: Props) {
  const accent = STATUS_ACCENT[status]
  const isResolved = status === 'resolved' || status === 'ignored'

  return (
    <div style={{
      background: '#0D0D11',
      border: '1px solid #1E1E24',
      borderLeft: `3px solid ${accent}`,
      borderRadius: 4,
      marginBottom: 8,
      opacity: isIgnored ? 0.45 : 1,
    }}>
      {/* FC rows + timeline */}
      <div style={{ display: 'flex' }}>
        {/* Left: FC list */}
        <div style={{ width: fcColWidth, flexShrink: 0, borderRight: '1px solid #1A1A20' }}>
          {pattern.faultCodes.map((code, i) => {
            const fc = faultCodeMap.get(code)
            return (
              <div
                key={code}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '0 14px',
                  borderBottom: i < pattern.faultCodes.length - 1 ? '1px solid #1A1A20' : undefined,
                  height: 36,
                  boxSizing: 'border-box',
                }}
              >
                {/* FC code badge */}
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#C4C4CC',
                  background: '#1A1A22',
                  border: '1px solid #2A2A34',
                  borderRadius: 3,
                  padding: '1px 5px',
                  minWidth: 38,
                  display: 'inline-block',
                  textAlign: 'center',
                  letterSpacing: '0.04em',
                  flexShrink: 0,
                }}>
                  {code}
                </span>
                <span style={{ fontSize: 12, color: '#A0A0AA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fc?.description ?? '—'}
                </span>
              </div>
            )
          })}
        </div>

        {/* Right: timeline */}
        <div style={{ flex: 1 }}>
          <PatternTimeline
            pattern={pattern}
            occurrences={occurrences}
            dates={dates}
            status={status}
          />
        </div>
      </div>

      {/* Footer: date range + actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 14px',
        borderTop: '1px solid #1A1A20',
      }}>
        <span style={{ fontSize: 11, color: '#3F3F50' }}>
          {formatDate(pattern.startDate)}
          {pattern.endDate ? ` → ${formatDate(pattern.endDate)}` : ' → ongoing'}
        </span>

        {!isResolved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <GhostButton label="Ignore" onClick={onIgnore} />
            <Divider />
            <GhostButton label="Create an alert" onClick={() => {}} />
            <GhostButton label="Create a ticket" onClick={() => {}} />
            <Divider />
            {/* Abnormal / Normal segmented toggle */}
            <div style={{
              display: 'flex',
              border: '1px solid #2A2A34',
              borderRadius: 5,
              overflow: 'hidden',
            }}>
              <SegmentButton
                label="Abnormal"
                active={validation === 'abnormal'}
                activeColor="#E8394A"
                onClick={() => onValidate('abnormal')}
                left
              />
              <div style={{ width: 1, background: '#2A2A34', flexShrink: 0 }} />
              <SegmentButton
                label="Normal"
                active={validation === 'normal'}
                activeColor="#22C55E"
                onClick={() => onValidate('normal')}
              />
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
      background: 'transparent',
      border: '1px solid #2A2A34',
      borderRadius: 4,
      color: '#71717A',
      fontSize: 11,
      fontWeight: 500,
      padding: '3px 9px',
      cursor: 'pointer',
    }}>
      {label}
    </button>
  )
}

function SegmentButton({ label, active, activeColor, onClick }: {
  label: string; active: boolean; activeColor: string; onClick: () => void; left?: boolean
}) {
  return (
    <button onClick={onClick} style={{
      background: active ? activeColor : 'transparent',
      border: 'none',
      color: active ? '#FFFFFF' : '#71717A',
      fontSize: 11,
      fontWeight: 600,
      padding: '3px 10px',
      cursor: 'pointer',
    }}>
      {label}
    </button>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 14, background: '#2A2A34' }} />
}
