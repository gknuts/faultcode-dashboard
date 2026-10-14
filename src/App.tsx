import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useStore } from './store/index'
import FilterBar from './components/FilterBar'
import { AssetList } from './components/AssetList'
import type { VirtualRow } from './components/AssetList'
import { DateAxis } from './components/DateAxis'
import { Footer } from './components/Footer'
import { EyeButton } from './components/EyeButton'
import { QualificationMenu } from './components/QualificationMenu'
import { getPeriodRange, getDatesInRange, todayISO } from './lib/dates'
import { makeBubbleScale } from './lib/scale'
import { makeRowKey, makeBubbleKey } from './data/types'

export default function App() {
  const {
    data,
    loadingState,
    loadData,
    retryLoad,
    view,
    end,
    selectedAssets,
    selectedCodes,
    filters,
    validations,
    hiddenRows,
    collapsedAssets,
    openMenuBubble,
    setOpenMenuBubble,
    qualifyBubble,
    toggleHiddenRow,
  } = useStore()

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [loadData])

  // Scroll container ref (shared for AssetList + Timeline rows)
  const scrollRef = useRef<HTMLDivElement>(null)

  // QualificationMenu state
  const [menuReferenceEl, setMenuReferenceEl] = useState<Element | null>(null)

  // Timeline width state
  const [timelineWidth, setTimelineWidth] = useState(() => Math.max(0, window.innerWidth - 420 - 56))
  const timelineContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = timelineContainerRef.current
    if (!el) return
    const obs = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (width) setTimelineWidth(width)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Compute period dates
  const [periodStart, periodEnd] = useMemo(
    () => getPeriodRange(view, end),
    [view, end]
  )
  const dates = useMemo(
    () => getDatesInRange(periodStart, periodEnd),
    [periodStart, periodEnd]
  )

  // Build fault code map
  const faultCodeMap = useMemo(() => {
    if (!data) return new Map()
    return new Map(data.faultCodes.map((fc) => [fc.code, fc]))
  }, [data])

  // Build occurrences lookup: rowKey -> Set of dates in period
  const occurrencesByRow = useMemo(() => {
    if (!data) return new Map<string, Map<string, number>>()
    const dateSet = new Set(dates)
    const map = new Map<string, Map<string, number>>()
    for (const occ of data.occurrences) {
      if (!dateSet.has(occ.date)) continue
      const key = makeRowKey(occ.assetId, occ.faultCode)
      let inner = map.get(key)
      if (!inner) {
        inner = new Map()
        map.set(key, inner)
      }
      inner.set(occ.date, occ.count)
    }
    return map
  }, [data, dates])

  // Build per-row status flags (considering validations): hasAbnormal, hasNormal
  const rowStatusFlags = useMemo(() => {
    if (!data) return new Map<string, { hasAbnormal: boolean; hasNormal: boolean }>()
    const dateSet = new Set(dates)
    const flags = new Map<string, { hasAbnormal: boolean; hasNormal: boolean }>()
    for (const occ of data.occurrences) {
      if (!dateSet.has(occ.date)) continue
      const rowKey = makeRowKey(occ.assetId, occ.faultCode)
      const bubbleKey = makeBubbleKey(occ.assetId, occ.faultCode, occ.date)
      const effectiveStatus = validations[bubbleKey]?.status ?? occ.status
      let entry = flags.get(rowKey)
      if (!entry) {
        entry = { hasAbnormal: false, hasNormal: false }
        flags.set(rowKey, entry)
      }
      if (effectiveStatus === 'abnormal') entry.hasAbnormal = true
      else entry.hasNormal = true
    }
    return flags
  }, [data, dates, validations])

  // Build virtualRows
  const virtualRowItems = useMemo((): VirtualRow[] => {
    if (!data) return []

    // Filter assets
    const filteredAssets =
      selectedAssets.length > 0
        ? data.assets.filter((a) => selectedAssets.includes(a.id))
        : data.assets

    const sortedAssets = [...filteredAssets].sort((a, b) =>
      a.label.localeCompare(b.label)
    )

    const rows: VirtualRow[] = []
    let offset = 0
    let idx = 0

    for (const asset of sortedAssets) {
      // Asset row
      const assetRow: VirtualRow = {
        type: 'asset',
        key: `asset-${asset.id}`,
        assetId: asset.id,
        assetLabel: asset.label,
        isHidden: false,
        height: 56,
        start: offset,
        index: idx++,
      }
      rows.push(assetRow)
      offset += 56

      if (collapsedAssets.includes(asset.id)) continue

      // Fault code rows
      const codesInPeriod = selectedCodes.length > 0 ? selectedCodes : data.faultCodes.map((fc) => fc.code)

      for (const code of codesInPeriod) {
        const rowKey = makeRowKey(asset.id, code)
        const occsInPeriod = occurrencesByRow.get(rowKey)

        // Must have at least one occurrence in period
        if (!occsInPeriod || occsInPeriod.size === 0) continue

        const isHidden = hiddenRows.includes(rowKey)

        // Apply filter rules for interesting/notInteresting
        const showInteresting = filters.interesting
        const showNotInteresting = filters.notInteresting
        if (!showInteresting && !showNotInteresting) {
          // show nothing? show all by default when both unchecked
        } else if (showInteresting && !showNotInteresting) {
          // only show interesting (not hidden)
          if (isHidden) continue
        } else if (!showInteresting && showNotInteresting) {
          // only show not interesting (hidden)
          if (!isHidden) continue
        }
        // both checked: show all

        // Apply row-level normal/abnormal filter
        // Default (both unchecked): mixed only (≥1 abnormal AND ≥1 normal)
        // normal checked: also include purely-normal rows (0 abnormal)
        // abnormal checked: also include purely-abnormal rows (0 normal)
        const sf = rowStatusFlags.get(rowKey)
        const hasAbnormal = sf?.hasAbnormal ?? false
        const hasNormal = sf?.hasNormal ?? false
        if (!filters.normal && !filters.abnormal) {
          // default: mixed only (has both types)
          if (!hasAbnormal || !hasNormal) continue
        } else if (filters.abnormal && !filters.normal) {
          // purely abnormal only (no normal occurrences)
          if (!hasAbnormal || hasNormal) continue
        } else if (filters.normal && !filters.abnormal) {
          // purely normal only (no abnormal occurrences)
          if (!hasNormal || hasAbnormal) continue
        } else {
          // both checked: purely-abnormal + purely-normal, skip mixed
          if (hasAbnormal && hasNormal) continue
        }

        const codeRow: VirtualRow = {
          type: 'code',
          key: `code-${asset.id}-${code}`,
          assetId: asset.id,
          assetLabel: asset.label,
          faultCode: code,
          faultCodeDesc: faultCodeMap.get(code)?.description,
          isHidden,
          height: 64,
          start: offset,
          index: idx++,
        }
        rows.push(codeRow)
        offset += 64
      }
    }

    return rows
  }, [
    data,
    dates,
    selectedAssets,
    selectedCodes,
    collapsedAssets,
    hiddenRows,
    filters,
    faultCodeMap,
    occurrencesByRow,
    rowStatusFlags,
  ])

  const totalHeight = virtualRowItems.reduce((sum, r) => sum + r.height, 0)

  // Virtualizer
  const rowVirtualizer = useVirtualizer({
    count: virtualRowItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => virtualRowItems[i]?.height ?? 64,
    overscan: 5,
  })

  // Map virtual items back to VirtualRow (with updated start positions from virtualizer)
  const renderedVirtualRows = useMemo(() => {
    return rowVirtualizer.getVirtualItems().map((vi) => ({
      ...virtualRowItems[vi.index],
      start: vi.start,
    }))
  }, [rowVirtualizer.getVirtualItems(), virtualRowItems])

  // Compute maxCount for bubble scale (ignoring checkbox filters)
  const maxCount = useMemo(() => {
    if (!data) return 1
    const dateSet = new Set(dates)
    let max = 1
    for (const occ of data.occurrences) {
      if (!dateSet.has(occ.date)) continue
      if (selectedAssets.length > 0 && !selectedAssets.includes(occ.assetId)) continue
      if (selectedCodes.length > 0 && !selectedCodes.includes(occ.faultCode)) continue
      if (occ.count > max) max = occ.count
    }
    return max
  }, [data, dates, selectedAssets, selectedCodes])

  const columnWidth = dates.length > 0 ? timelineWidth / dates.length : 0
  const getBubbleRadius = useMemo(
    () => makeBubbleScale(maxCount, columnWidth),
    [maxCount, columnWidth]
  )

  // Today line
  const today = todayISO()
  const todayIndex = dates.indexOf(today)
  const todayX =
    todayIndex >= 0 && columnWidth > 0
      ? (todayIndex + 0.5) * columnWidth
      : null

  // Bubble click handler
  const handleBubbleClick = useCallback(
    (bubbleKey: string, referenceEl: Element) => {
      setMenuReferenceEl(referenceEl)
      setOpenMenuBubble(bubbleKey)
    },
    [setOpenMenuBubble]
  )

  // Close menu on scroll
  const handleScroll = useCallback(() => {
    if (openMenuBubble) {
      setOpenMenuBubble(null)
      setMenuReferenceEl(null)
    }
  }, [openMenuBubble, setOpenMenuBubble])

  const handleMenuClose = useCallback(() => {
    setOpenMenuBubble(null)
    setMenuReferenceEl(null)
  }, [setOpenMenuBubble])

  const handleQualify = useCallback(
    (status: 'abnormal' | 'normal') => {
      if (openMenuBubble) {
        qualifyBubble(openMenuBubble, status)
      }
    },
    [openMenuBubble, qualifyBubble]
  )

  // Determine currentStatus for QualificationMenu
  const menuCurrentStatus = useMemo((): 'abnormal' | 'normal' => {
    if (!openMenuBubble) return 'abnormal'
    const validation = validations[openMenuBubble]
    if (validation) return validation.status
    // Fall back to occurrence status
    if (data && openMenuBubble) {
      const parts = openMenuBubble.split('|')
      if (parts.length === 3) {
        const [assetId, faultCode, date] = parts
        const occ = data.occurrences.find(
          (o) => o.assetId === assetId && o.faultCode === faultCode && o.date === date
        )
        if (occ) return occ.status
      }
    }
    return 'abnormal'
  }, [openMenuBubble, validations, data])

  // Loading / error states
  if (loadingState === 'loading') {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
          color: '#FFFFFF',
          fontSize: 18,
        }}
      >
        Loading...
      </div>
    )
  }

  if (loadingState === 'error') {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
          gap: 16,
        }}
      >
        <span style={{ color: '#EF4444', fontSize: 18 }}>
          Unable to load fault data.
        </span>
        <button
          onClick={retryLoad}
          style={{
            background: '#6C4BF5',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  const hasRows = virtualRowItems.length > 0

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#000000',
      }}
    >
      {/* FilterBar — 96px */}
      <FilterBar periodStart={periodStart} periodEnd={periodEnd} />

      {/* Main area — remaining height */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {/* Top date axis + column header row — sticky */}
        <div style={{ display: 'flex', flexShrink: 0 }}>
          <div
            style={{
              width: 420,
              height: 40,
              background: '#000000',
              flexShrink: 0,
              borderBottom: '1px solid #1F1F22',
              display: 'flex',
              alignItems: 'center',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.05em',
              color: '#A1A1AA',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ paddingLeft: 28 }}>Asset</span>
            <div style={{ width: 1, height: 16, background: '#3A3A3C', margin: '0 12px' }} />
            <span>Fault Code</span>
          </div>
          <div
            ref={timelineContainerRef}
            style={{ flex: 1, overflow: 'hidden', borderBottom: '1px solid #1F1F22', position: 'relative' }}
          >
            <DateAxis dates={dates} timelineWidth={timelineWidth} view={view} />
            {/* Today triangle */}
            {todayX !== null && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: todayX - 6,
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '8px solid #D4D4D8',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
          <div
            style={{
              width: 56,
              flexShrink: 0,
              borderBottom: '1px solid #1F1F22',
            }}
          />
        </div>

        {/* Scrollable rows area */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{ flex: 1, overflowY: 'auto', position: 'relative' }}
        >
          <div style={{ position: 'relative', height: totalHeight }}>
            {/* Today vertical line — spanning full scrollable area */}
            {todayX !== null && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 420 + todayX,
                  width: 1,
                  height: totalHeight,
                  background: '#4A4A4E',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />
            )}

            {/* No rows message */}
            {!hasRows && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#A1A1AA',
                  fontSize: 16,
                }}
              >
                No fault codes match the current filters.
              </div>
            )}

            {/* AssetList on left */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: 420 }}>
              <AssetList
                rows={renderedVirtualRows}
                totalHeight={totalHeight}
                faultCodeMap={faultCodeMap}
              />
            </div>

            {/* Timeline in middle */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 420,
                right: 56,
                bottom: 0,
              }}
            >
              {renderedVirtualRows.map((row) => {
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

                const { assetId, faultCode } = row
                if (!faultCode) return null

                const rowKey = makeRowKey(assetId, faultCode)
                const occMap = occurrencesByRow.get(rowKey) ?? new Map<string, number>()

                return (
                  <div
                    key={row.key}
                    style={{
                      position: 'absolute',
                      top: row.start,
                      left: 0,
                      width: timelineWidth,
                      height: row.height,
                      background: '#0B0B0C',
                      opacity: row.isHidden ? 0.35 : 1,
                    }}
                  >
                    <svg
                      width={timelineWidth}
                      height={row.height}
                      style={{ display: 'block' }}
                    >
                      {dates.map((date, i) => {
                        const count = occMap.get(date)
                        if (!count) return null
                        const cx = (i + 0.5) * columnWidth
                        const cy = row.height / 2
                        const r = getBubbleRadius(count)
                        const bubbleKey = makeBubbleKey(assetId, faultCode, date)
                        const validation = validations[bubbleKey]
                        const status = validation?.status ?? data.occurrences.find(
                          (o) => o.assetId === assetId && o.faultCode === faultCode && o.date === date
                        )?.status ?? 'abnormal'

                        // Apply bubble filters
                        const isValidated = !!validation
                        if (isValidated && !filters.validated) return null
                        if (!isValidated && !filters.notValidated) return null

                        const fill = status === 'normal' ? '#2ECC71' : '#F0436A'
                        const fillOpacity = status === 'normal' ? 0.4 : 1

                        return (
                          <circle
                            key={bubbleKey}
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill={fill}
                            fillOpacity={fillOpacity}
                            style={{ cursor: row.isHidden ? 'default' : 'pointer', zIndex: 2 }}
                            onClick={row.isHidden ? undefined : (e) => {
                              handleBubbleClick(bubbleKey, e.currentTarget)
                            }}
                          />
                        )
                      })}
                    </svg>
                  </div>
                )
              })}
            </div>

            {/* EyeButton column on right */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 56,
              }}
            >
              {renderedVirtualRows.map((row) => {
                if (row.type === 'asset') {
                  return (
                    <div
                      key={row.key}
                      style={{
                        position: 'absolute',
                        top: row.start,
                        left: 0,
                        width: 56,
                        height: row.height,
                        background: '#000000',
                      }}
                    />
                  )
                }

                const rowKey = makeRowKey(row.assetId, row.faultCode ?? '')

                return (
                  <div
                    key={row.key}
                    style={{
                      position: 'absolute',
                      top: row.start,
                      left: 0,
                      width: 56,
                      height: row.height,
                      background: '#0B0B0C',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <EyeButton
                      isHidden={row.isHidden}
                      onToggle={() => toggleHiddenRow(rowKey)}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer — 56px sticky bottom */}
        <Footer
          dates={dates}
          view={view}
          timelineWidth={timelineWidth}
          periodStart={periodStart}
          periodEnd={periodEnd}
        />
      </div>

      {/* QualificationMenu portal */}
      {openMenuBubble && menuReferenceEl && (
        <QualificationMenu
          referenceEl={menuReferenceEl}
          currentStatus={menuCurrentStatus}
          onQualify={handleQualify}
          onClose={handleMenuClose}
        />
      )}
    </div>
  )
}
