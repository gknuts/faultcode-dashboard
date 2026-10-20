import type { Pattern, PatternOccurrence, FaultCode, DerivedStatus } from '../data/types'
import { PatternCard } from './PatternCard'

interface Props {
  title: string
  status: DerivedStatus
  patterns: Pattern[]
  faultCodeMap: Map<string, FaultCode>
  occurrences: PatternOccurrence[]
  dates: string[]
  patternValidations: Record<string, 'abnormal' | 'normal'>
  ignoredPatterns: Set<string>
  fcColWidth: number
  onValidate: (id: string, status: 'abnormal' | 'normal') => void
  onIgnore: (id: string) => void
}

const HEADER_COLORS: Record<DerivedStatus, string> = {
  new: '#F0436A',
  ongoing: '#F97316',
  resolved: '#52525B',
  ignored: '#3F3F46',
}

export function PatternSection({
  title,
  status,
  patterns,
  faultCodeMap,
  occurrences,
  dates,
  patternValidations,
  ignoredPatterns,
  fcColWidth,
  onValidate,
  onIgnore,
}: Props) {
  if (patterns.length === 0) return null

  const color = HEADER_COLORS[status]

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
      }}>
        <div style={{ width: 3, height: 14, background: color, borderRadius: 2 }} />
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          color,
          textTransform: 'uppercase',
        }}>
          {title}
        </span>
        <span style={{
          fontSize: 11,
          color: '#3F3F46',
          fontWeight: 500,
        }}>
          ({patterns.length})
        </span>
      </div>

      {patterns.map((pattern) => (
        <PatternCard
          key={pattern.id}
          pattern={pattern}
          status={status}
          faultCodeMap={faultCodeMap}
          occurrences={occurrences}
          dates={dates}
          validation={patternValidations[pattern.id]}
          isIgnored={ignoredPatterns.has(pattern.id)}
          fcColWidth={fcColWidth}
          onValidate={(s) => onValidate(pattern.id, s)}
          onIgnore={() => onIgnore(pattern.id)}
        />
      ))}
    </div>
  )
}
