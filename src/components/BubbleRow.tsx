import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import type {
  ISODate,
  DailyOccurrence,
  Validation,
  Group,
} from '../data/types'
import { makeBubbleKey } from '../data/types'

const GROUP_PALETTE = [
  '#D9E94A',
  '#3B6FE0',
  '#2EC4B6',
  '#FF9F1C',
  '#B07CF7',
  '#5BC0EB',
  '#9BE564',
  '#FF7AC6',
]

function getGroupColor(group: Group): string {
  if (group.color) return group.color
  let h = 0
  for (let i = 0; i < group.id.length; i++) {
    h = (Math.imul(31, h) + group.id.charCodeAt(i)) | 0
  }
  return GROUP_PALETTE[Math.abs(h) % GROUP_PALETTE.length]
}

export interface BubbleRowProps {
  assetId: string
  faultCode: string
  dates: ISODate[]
  occurrenceMap: Map<string, DailyOccurrence>
  validations: Record<string, Validation>
  hiddenRows: string[]
  groups: Group[]
  getBubbleRadius: (count: number) => number
  timelineWidth: number
  openMenuBubble: string | null
  onBubbleClick: (bubbleKey: string, el: SVGCircleElement) => void
  isHidden: boolean
  rMax: number
}

export function BubbleRow({
  assetId,
  faultCode,
  dates,
  occurrenceMap,
  validations,
  hiddenRows: _hiddenRows,
  groups,
  getBubbleRadius,
  timelineWidth,
  openMenuBubble,
  onBubbleClick,
  isHidden,
  rMax,
}: BubbleRowProps) {
  const [hoveredBubble, setHoveredBubble] = useState<string | null>(null)

  const N = dates.length
  const W = N > 0 ? timelineWidth / N : 0
  const notInteresting = isHidden

  return (
    <svg
      width={timelineWidth}
      height={52}
      style={{ display: 'block', overflow: 'visible' }}
      aria-label={`Fault code ${faultCode} row`}
    >
      {/* Background */}
      <rect x={0} y={0} width={timelineWidth} height={52} fill="#161618" />

      {dates.map((date, i) => {
        const bubbleKey = makeBubbleKey(assetId, faultCode, date)
        const occurrence = occurrenceMap.get(date)
        if (!occurrence) return null

        const cx = (i + 0.5) * W
        const cy = 26
        const r = getBubbleRadius(occurrence.count)

        const validation = validations[bubbleKey]
        const effectiveStatus = validation ? validation.status : occurrence.status

        const fill =
          effectiveStatus === 'abnormal'
            ? '#F0436A'
            : '#2ECC71'
        const fillOpacity = effectiveStatus === 'abnormal' ? 1 : 0.4

        // Find groups that include this occurrence (by groupId on occurrence)
        const occurrenceGroupId = occurrence.groupId
        const group = occurrenceGroupId
          ? groups.find((g) => g.id === occurrenceGroupId)
          : undefined

        const isHovered = hoveredBubble === bubbleKey
        const isMenuOpen = openMenuBubble === bubbleKey

        // Aria label
        let dateLabel = ''
        try {
          dateLabel = format(parseISO(date), 'd MMM yyyy')
        } catch {
          dateLabel = date
        }
        const ariaLabel = `${faultCode} on ${dateLabel}, ${occurrence.count} occurrence${occurrence.count !== 1 ? 's' : ''}, ${effectiveStatus}`

        return (
          <g key={bubbleKey}>
            {/* Group ring — drawn BELOW bubble, ABOVE bg */}
            {group && (
              <circle
                cx={cx}
                cy={cy}
                r={rMax + 5}
                fill="none"
                stroke={getGroupColor(group)}
                strokeWidth={2}
                style={{ pointerEvents: 'none' }}
              />
            )}

            {/* Hover halo */}
            {!notInteresting && (
              <circle
                cx={cx}
                cy={cy}
                r={r + 8}
                fill="rgba(255,255,255,0.18)"
                style={{
                  opacity: isHovered || isMenuOpen ? 1 : 0,
                  transition: 'opacity 120ms',
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Bubble */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={fill}
              fillOpacity={fillOpacity}
              style={{ pointerEvents: 'none' }}
            />

            {/* Hit area */}
            {!notInteresting ? (
              <circle
                cx={cx}
                cy={cy}
                r={Math.max(r + 4, 10)}
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={ariaLabel}
                onMouseEnter={() => setHoveredBubble(bubbleKey)}
                onMouseLeave={() => setHoveredBubble(null)}
                onClick={(e) => {
                  onBubbleClick(bubbleKey, e.currentTarget as unknown as SVGCircleElement)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onBubbleClick(bubbleKey, e.currentTarget as unknown as SVGCircleElement)
                  }
                }}
                style={{ cursor: 'pointer', outline: 'none' }}
                onFocus={(e) => {
                  ;(e.currentTarget as SVGCircleElement).style.outline = '2px solid #6C4BF5'
                }}
                onBlur={(e) => {
                  ;(e.currentTarget as SVGCircleElement).style.outline = 'none'
                }}
              />
            ) : (
              <circle
                cx={cx}
                cy={cy}
                r={Math.max(r + 4, 10)}
                fill="transparent"
                style={{ pointerEvents: 'none' }}
                aria-label={ariaLabel}
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}
