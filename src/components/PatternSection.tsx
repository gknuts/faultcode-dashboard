import { useMemo } from 'react'
import type { Pattern, PatternOccurrence, FaultCode, DerivedStatus } from '../data/types'
import { PatternCard } from './PatternCard'
import type { RelatedGroup } from './PatternCard'

interface Props {
  title: string
  status: DerivedStatus
  patterns: Pattern[]
  faultCodeMap: Map<string, FaultCode>
  occurrences: PatternOccurrence[]
  dates: string[]
  labelStep: number
  patternValidations: Record<string, 'abnormal' | 'normal'>
  fcColWidth: number
  onValidate: (id: string, status: 'abnormal' | 'normal') => void
  unclassifiedPatterns?: Pattern[]
}

function sameFaultCodes(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const setB = new Set(b)
  return a.every(c => setB.has(c))
}

const HEADER_COLORS: Record<DerivedStatus, string> = {
  new: '#FF6A00',
  ongoing: '#8B6AFF',
  unclassified: '#999999',
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
  fcColWidth,
  onValidate,
  unclassifiedPatterns = [],
}: Props) {
  if (patterns.length === 0) return null

  const color = HEADER_COLORS[status]

  const relatedGroupsByPatternId = useMemo((): Map<string, RelatedGroup[]> => {
    if (!unclassifiedPatterns.length) return new Map()
    const map = new Map<string, RelatedGroup[]>()
    for (const p of patterns) {
      const related: RelatedGroup[] = unclassifiedPatterns
        .filter(unc => sameFaultCodes(unc.faultCodes, p.faultCodes))
        .map(unc => ({
          pattern: unc,
          occurrences: occurrences.filter(o => o.patternId === unc.id),
          faultCodeMap,
        }))
      if (related.length) map.set(p.id, related)
    }
    return map
  }, [unclassifiedPatterns, patterns, occurrences, faultCodeMap])

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
          fcColWidth={fcColWidth}
          onValidate={(s) => onValidate(pattern.id, s)}
          relatedGroups={relatedGroupsByPatternId.get(pattern.id)}
          onValidateRelated={onValidate}
          relatedValidations={patternValidations}
        />
      ))}
    </div>
  )
}
