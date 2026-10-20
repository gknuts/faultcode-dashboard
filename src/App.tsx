import { useEffect, useMemo } from 'react'
import { useStore, derivePatternStatus } from './store/index'
import FilterBar from './components/FilterBar'
import { AssetSidebar } from './components/AssetSidebar'
import { PatternSection } from './components/PatternSection'
import { getPeriodRange, getDatesInRange, formatAxisLabel } from './lib/dates'
import type { DerivedStatus } from './data/types'

// FC description column width — must match PatternCard's left column
const FC_COL_WIDTH = 300

export default function App() {
  const {
    data,
    loadingState,
    loadData,
    retryLoad,
    lastSessionAt,
    ignoredPatterns,
    patternValidations,
    selectedAssetId,
    view,
    showNew,
    showOngoing,
    setSelectedAsset,
    setView,
    simulateNewSession,
    ignorePattern,
    validatePattern,
    toggleShowNew,
    toggleShowOngoing,
  } = useStore()

  useEffect(() => { loadData() }, [loadData])

  const [periodStart, periodEnd] = useMemo(() => getPeriodRange(view), [view])
  const dates = useMemo(() => getDatesInRange(periodStart, periodEnd), [periodStart, periodEnd])

  const faultCodeMap = useMemo(() => {
    if (!data) return new Map()
    return new Map(data.faultCodes.map(fc => [fc.code, fc]))
  }, [data])

  const derive = useMemo(() => (p: { id: string; assetId: string; faultCodes: string[]; startDate: string; endDate?: string }) =>
    derivePatternStatus(p, lastSessionAt, ignoredPatterns),
    [lastSessionAt, ignoredPatterns]
  )

  const assetPatterns = useMemo(() => {
    if (!data || !selectedAssetId) return { new: [], ongoing: [], resolved: [], ignored: [] }
    const all = data.patterns.filter(p => p.assetId === selectedAssetId)
    const groups: Record<DerivedStatus, typeof all> = { new: [], ongoing: [], resolved: [], ignored: [] }
    for (const p of all) groups[derive(p)].push(p)
    return groups
  }, [data, selectedAssetId, derive])

  // Axis label step
  const labelStep = dates.length <= 7 ? 1 : dates.length <= 14 ? 2 : 5

  if (loadingState === 'loading') {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff', fontSize: 18 }}>Loading...</div>
  }
  if (loadingState === 'error') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', gap: 16 }}>
        <span style={{ color: '#EF4444', fontSize: 18 }}>Unable to load fault data.</span>
        <button onClick={retryLoad} style={{ background: '#6C4BF5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Retry</button>
      </div>
    )
  }
  if (!data) return null

  const visibleNew = showNew ? assetPatterns.new : []
  const visibleOngoing = showOngoing ? assetPatterns.ongoing : []
  const resolvedAndIgnored = [...assetPatterns.resolved, ...assetPatterns.ignored]
  const hasNoPatterns = visibleNew.length === 0 && visibleOngoing.length === 0 && resolvedAndIgnored.length === 0

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#000000' }}>
      <FilterBar
        view={view}
        onSetView={setView}
        onSimulateSession={simulateNewSession}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <AssetSidebar
          assets={data.assets}
          patterns={data.patterns}
          selectedAssetId={selectedAssetId}
          showNew={showNew}
          showOngoing={showOngoing}
          deriveStatus={derive}
          onSelect={setSelectedAsset}
          onToggleNew={toggleShowNew}
          onToggleOngoing={toggleShowOngoing}
        />

        {/* Right panel: sticky date axis + scrollable patterns + footer axis */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Shared date axis — top */}
          <DateAxisBar dates={dates} labelStep={labelStep} fcColWidth={FC_COL_WIDTH} borderedBottom />

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {hasNoPatterns ? (
              <div style={{ color: '#52525B', fontSize: 14, marginTop: 40, textAlign: 'center' }}>
                No patterns to display for this asset.
              </div>
            ) : (
              <>
                <PatternSection
                  title="New Anomalous Patterns"
                  status="new"
                  patterns={visibleNew}
                  faultCodeMap={faultCodeMap}
                  occurrences={data.occurrences}
                  dates={dates}
                  patternValidations={patternValidations}
                  ignoredPatterns={ignoredPatterns}
                  fcColWidth={FC_COL_WIDTH}
                  onValidate={validatePattern}
                  onIgnore={ignorePattern}
                />
                <PatternSection
                  title="Ongoing Anomalous Patterns"
                  status="ongoing"
                  patterns={visibleOngoing}
                  faultCodeMap={faultCodeMap}
                  occurrences={data.occurrences}
                  dates={dates}
                  patternValidations={patternValidations}
                  ignoredPatterns={ignoredPatterns}
                  fcColWidth={FC_COL_WIDTH}
                  onValidate={validatePattern}
                  onIgnore={ignorePattern}
                />
                <PatternSection
                  title="Resolved / Archived"
                  status="resolved"
                  patterns={resolvedAndIgnored}
                  faultCodeMap={faultCodeMap}
                  occurrences={data.occurrences}
                  dates={dates}
                  patternValidations={patternValidations}
                  ignoredPatterns={ignoredPatterns}
                  fcColWidth={FC_COL_WIDTH}
                  onValidate={validatePattern}
                  onIgnore={ignorePattern}
                />
              </>
            )}
          </div>

          {/* Shared date axis — bottom (footer) */}
          <DateAxisBar dates={dates} labelStep={labelStep} fcColWidth={FC_COL_WIDTH} borderedTop />
        </div>
      </div>
    </div>
  )
}

function DateAxisBar({ dates, labelStep, fcColWidth, borderedBottom, borderedTop }: {
  dates: string[]
  labelStep: number
  fcColWidth: number
  borderedBottom?: boolean
  borderedTop?: boolean
}) {
  return (
    <div style={{
      height: 28,
      flexShrink: 0,
      background: '#0A0A0D',
      borderBottom: borderedBottom ? '1px solid #1F1F22' : undefined,
      borderTop: borderedTop ? '1px solid #1F1F22' : undefined,
      display: 'flex',
      alignItems: 'center',
    }}>
      <div style={{ width: fcColWidth + 32, flexShrink: 0 }} />
      <div style={{ flex: 1, position: 'relative', height: '100%' }}>
        <svg width="100%" height="100%" style={{ display: 'block', overflow: 'visible' }}>
          {dates.map((date, i) => {
            const isFirst = i === 0
            const isLast = i === dates.length - 1
            if (!isFirst && !isLast && i % labelStep !== 0) return null
            const x = `${((i + 0.5) / dates.length) * 100}%`
            return (
              <text key={date} x={x} y={18} textAnchor="middle" fontSize={10} fill="#52525B">
                {formatAxisLabel(date)}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
