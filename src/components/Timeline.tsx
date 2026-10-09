import { useMemo, type RefObject, type MutableRefObject } from 'react'
import type {
  ISODate,
  ViewMode,
  FaultData,
  DailyOccurrence,
  Validation,
  Group,
  Filters,
} from '../data/types'
import { makeRowKey } from '../data/types'
import { todayISO } from '../lib/dates'
import type { VirtualRow } from './AssetList'
import { BubbleRow } from './BubbleRow'

interface TimelineProps {
  dates: ISODate[]
  view: ViewMode
  data: FaultData
  validations: Record<string, Validation>
  hiddenRows: string[]
  collapsedAssets: string[]
  filters: Filters
  selectedAssets: string[]
  selectedCodes: string[]
  openMenuBubble: string | null
  onBubbleClick: (bubbleKey: string, referenceEl: Element) => void
  onScroll: () => void
  containerRef: RefObject<HTMLDivElement | null>
  setRowsContainer: (el: HTMLDivElement | null) => void
  virtualRows: VirtualRow[]
  totalHeight: number
  timelineWidth: number
  getBubbleRadius: (count: number) => number
  rMax: number
  groups: Group[]
}

export function Timeline({
  dates,
  view: _view,
  data,
  validations,
  hiddenRows,
  collapsedAssets: _collapsedAssets,
  filters: _filters,
  selectedAssets: _selectedAssets,
  selectedCodes: _selectedCodes,
  openMenuBubble,
  onBubbleClick,
  onScroll,
  containerRef,
  setRowsContainer,
  virtualRows,
  totalHeight,
  timelineWidth,
  getBubbleRadius,
  rMax,
  groups,
}: TimelineProps) {
  const N = dates.length
  const W = N > 0 ? timelineWidth / N : 0

  const today = todayISO()
  const todayIndex = dates.indexOf(today)
  const todayX = todayIndex >= 0 ? (todayIndex + 0.5) * W : null

  // Build a lookup: rowKey -> array of DailyOccurrence
  const occurrencesByRow = useMemo(() => {
    const map = new Map<string, DailyOccurrence[]>()
    for (const occ of data.occurrences) {
      const key = makeRowKey(occ.assetId, occ.faultCode)
      const arr = map.get(key)
      if (arr) {
        arr.push(occ)
      } else {
        map.set(key, [occ])
      }
    }
    return map
  }, [data.occurrences])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flex: 1,
      }}
    >
      {/* Scrollable rows area */}
      <div
        ref={(el) => {
          // Assign to both containerRef and setRowsContainer
          if (containerRef) {
            ;(containerRef as MutableRefObject<HTMLDivElement | null>).current = el
          }
          setRowsContainer(el)
        }}
        onScroll={onScroll}
        style={{
          overflowY: 'auto',
          flexGrow: 1,
          position: 'relative',
        }}
      >
        {/* Virtual scroll container */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Today vertical line */}
          {todayX !== null && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: todayX,
                width: 1,
                height: totalHeight,
                background: '#4A4A4E',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          )}

          {virtualRows.map((row) => {
            if (row.type === 'asset') {
              return (
                <div
                  key={row.key}
                  style={{
                    position: 'absolute',
                    top: row.start,
                    left: 0,
                    width: timelineWidth,
                    height: row.height,
                    background: '#000000',
                  }}
                />
              )
            }

            // 'code' row — render BubbleRow
            const { assetId, faultCode } = row
            if (!faultCode) return null

            const rowKey = makeRowKey(assetId, faultCode)
            const occs = occurrencesByRow.get(rowKey) ?? []

            // Build date -> DailyOccurrence map for this row
            const occurrenceMap = new Map<string, DailyOccurrence>()
            for (const occ of occs) {
              occurrenceMap.set(occ.date, occ)
            }

            const isHidden = row.isHidden

            return (
              <div
                key={row.key}
                style={{
                  position: 'absolute',
                  top: row.start,
                  left: 0,
                  width: timelineWidth,
                  height: row.height,
                  opacity: isHidden ? 0.35 : 1,
                }}
              >
                <BubbleRow
                  assetId={assetId}
                  faultCode={faultCode}
                  dates={dates}
                  occurrenceMap={occurrenceMap}
                  validations={validations}
                  hiddenRows={hiddenRows}
                  groups={groups}
                  getBubbleRadius={getBubbleRadius}
                  timelineWidth={timelineWidth}
                  openMenuBubble={openMenuBubble}
                  onBubbleClick={(bubbleKey, el) => onBubbleClick(bubbleKey, el)}
                  isHidden={isHidden}
                  rMax={rMax}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
