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
  new: '#F0436A',
  ongoing: '#F97316',
  resolved: '#52525B',
  ignored: '#3F3F46',
}

function formatDate(d: string) {
  return format(fromISO(d), 'd MMM yyyy')
}

export function PatternCard({
  pattern,
  status,
  faultCodeMap,
  occurrences,
  dates,
  validation,
  isIgnored,
  fcColWidth,
  onValidate,
  onIgnore,
}: Props) {
  const accent = STATUS_ACCENT[status]
  const isResolved = status === 'resolved' || status === 'ignored'

  return (
    <div style={{
      background: '#111114',
      border: `1px solid #1F1F22`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: 6,
      marginBottom: 10,
      opacity: isIgnored ? 0.5 : 1,
    }}>
      {/* FC rows + timeline */}
      <div style={{ display: 'flex' }}>
        {/* Left: FC list */}
        <div style={{ width: fcColWidth, flexShrink: 0, borderRight: '1px solid #1F1F22' }}>
          {pattern.faultCodes.map((code, i) => {
            const fc = faultCodeMap.get(code)
            return (
              <div
                key={code}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 14px',
                  borderBottom: i < pattern.faultCodes.length - 1 ? '1px solid #1A1A1E' : undefined,
                  height: 36,
                  boxSizing: 'border-box',
                }}
              >
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#A1A1AA',
                  minWidth: 40,
                }}>
                  {code}
                </span>
                <span style={{ fontSize: 12, color: '#D4D4D8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fc?.description ?? '—'}
                </span>
              </div>
            )
          })}
        </div>

        {/* Right: timeline */}
        <div style={{ flex: 1, padding: '0 8px' }}>
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
        padding: '7px 14px',
        borderTop: '1px solid #1A1A1E',
      }}>
        <span style={{ fontSize: 11, color: '#52525B' }}>
          {formatDate(pattern.startDate)}
          {pattern.endDate ? ` → ${formatDate(pattern.endDate)}` : ' → ongoing'}
        </span>

        {!isResolved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ActionButton label="Ignore" onClick={onIgnore} />
            <Divider />
            <ActionButton label="Create a ticket" onClick={() => {}} />
            <ActionButton label="Create an alert" onClick={() => {}} />
            <Divider />
            <ToggleButton
              label="Abnormal"
              active={validation === 'abnormal'}
              activeColor="#F0436A"
              onClick={() => onValidate('abnormal')}
            />
            <ToggleButton
              label="Normal"
              active={validation === 'normal'}
              activeColor="#2ECC71"
              onClick={() => onValidate('normal')}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: '1px solid #2A2A2E',
        borderRadius: 5,
        color: '#A1A1AA',
        fontSize: 11,
        fontWeight: 500,
        padding: '3px 10px',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

function ToggleButton({ label, active, activeColor, onClick }: { label: string; active: boolean; activeColor: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? activeColor : 'transparent',
        border: `1px solid ${active ? activeColor : '#2A2A2E'}`,
        borderRadius: 5,
        color: active ? '#000000' : '#A1A1AA',
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 10px',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 16, background: '#2A2A2E' }} />
}
