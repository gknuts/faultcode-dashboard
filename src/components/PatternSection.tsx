import type { Pattern, PatternOccurrence, FaultCode, DerivedStatus } from '../data/types'
import { PatternCard } from './PatternCard'

interface Props {
  title: string
  status: DerivedStatus
  patterns: Pattern[]
  faultCodeMap: Map<string, FaultCode>
  occurrences: PatternOccurrence[]
  dates: string[]
  labelStep: number
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
  labelStep,
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
        <div style={{ width: 4, height: 16, background: color, borderRadius: 2 }} />
        <span style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.10em',
          color,
          textTransform: 'uppercase',
        }}>
          {title}
        </span>
        <span style={{
          fontSize: 11,
          color: '#3F3F52',
          fontWeight: 600,
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
          labelStep={labelStep}
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
