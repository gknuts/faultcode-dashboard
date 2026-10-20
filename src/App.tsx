import { useEffect, useMemo } from 'react'
import { useStore, derivePatternStatus } from './store/index'
import FilterBar from './components/FilterBar'
import { AssetSidebar } from './components/AssetSidebar'
import { PatternSection } from './components/PatternSection'
import { getPeriodRange, getDatesInRange, formatAxisLabel } from './lib/dates'
import type { DerivedStatus } from './data/types'

const FC_COL_WIDTH = 60  // = BADGE_WIDTH — dates align with dots start
const SIDEBAR_WIDTH = 210

export default function App() {
  const {
    data, loadingState, loadData, retryLoad,
    lastSessionAt, ignoredPatterns, patternValidations,
    selectedAssetId, view, showNew, showOngoing,
    setSelectedAsset, setView, simulateNewSession,
    ignorePattern, validatePattern, toggleShowNew, toggleShowOngoing,
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

  const labelStep = dates.length <= 7 ? 1 : dates.length <= 14 ? 2 : 5

  if (loadingState === 'loading') {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0B10', color: '#fff', fontSize: 18 }}>Loading...</div>
  }
  if (loadingState === 'error') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0B0B10', gap: 16 }}>
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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0B0B10' }}>
      <FilterBar view={view} onSetView={setView} onSimulateSession={simulateNewSession} />

      {/* Column header row: ASSET | ANOMALOUS PATTERNS | date axis */}
      <div style={{
        height: 36,
        flexShrink: 0,
        display: 'flex',
        background: '#0F0F16',
        borderBottom: '1px solid #1E1E28',
      }}>
        {/* ASSET label only */}
        <div style={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          borderRight: '1px solid #1E1E28',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#52526A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Asset
          </span>
        </div>

        {/* Right panel header: badge spacer + date axis */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>
          {/* Badge-width spacer with "CODE" label */}
          <div style={{
            width: FC_COL_WIDTH,
            flexShrink: 0,
            borderRight: '1px solid #1A1A26',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#2A2A3C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Code
            </span>
          </div>
          <DateAxisSvg dates={dates} labelStep={labelStep} showTodayMarker />
        </div>
      </div>

      {/* Main content */}
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
          sidebarWidth={SIDEBAR_WIDTH}
        />

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', position: 'relative' }}>
          {/* Continuous today vertical line across all cards */}
          <div style={{
            position: 'absolute',
            top: 0, bottom: 0,
            // FC_COL_WIDTH(60) + padding-left(16) = 76px offset, then todayFraction of remaining width
            // padding left+right = 32px total
            left: `calc(76px + ${(dates.length - 0.5) / dates.length} * (100% - 92px))`,
            width: 1,
            background: 'rgba(110,110,200,0.18)',
            pointerEvents: 'none',
            zIndex: 2,
          }} />
          {hasNoPatterns ? (
            <div style={{ color: '#3F3F52', fontSize: 14, marginTop: 40, textAlign: 'center' }}>
              No patterns to display for this asset.
            </div>
          ) : (
            <>
              <PatternSection title="New Anomalous Patterns" status="new" patterns={visibleNew}
                faultCodeMap={faultCodeMap} occurrences={data.occurrences} dates={dates} labelStep={labelStep}
                patternValidations={patternValidations} ignoredPatterns={ignoredPatterns}
                fcColWidth={FC_COL_WIDTH} onValidate={validatePattern} onIgnore={ignorePattern} />
              <PatternSection title="Ongoing Anomalous Patterns" status="ongoing" patterns={visibleOngoing}
                faultCodeMap={faultCodeMap} occurrences={data.occurrences} dates={dates} labelStep={labelStep}
                patternValidations={patternValidations} ignoredPatterns={ignoredPatterns}
                fcColWidth={FC_COL_WIDTH} onValidate={validatePattern} onIgnore={ignorePattern} />
              <PatternSection title="Resolved / Archived" status="resolved" patterns={resolvedAndIgnored}
                faultCodeMap={faultCodeMap} occurrences={data.occurrences} dates={dates} labelStep={labelStep}
                patternValidations={patternValidations} ignoredPatterns={ignoredPatterns}
                fcColWidth={FC_COL_WIDTH} onValidate={validatePattern} onIgnore={ignorePattern} />
            </>
          )}
        </div>
      </div>

      {/* Footer date axis */}
      <div style={{
        height: 36,
        flexShrink: 0,
        display: 'flex',
        background: '#0F0F16',
        borderTop: '1px solid #1E1E28',
      }}>
        <div style={{ width: SIDEBAR_WIDTH, flexShrink: 0, borderRight: '1px solid #1E1E28' }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ width: FC_COL_WIDTH, flexShrink: 0 }} />
          <DateAxisSvg dates={dates} labelStep={labelStep} />
        </div>
      </div>
    </div>
  )
}

function DateAxisSvg({ dates, labelStep, showTodayMarker }: { dates: string[]; labelStep: number; showTodayMarker?: boolean }) {
  const todayPct = ((dates.length - 0.5) / dates.length) * 100
  return (
    <div style={{ flex: 1, height: '100%', position: 'relative' }}>
      <svg width="100%" height="100%" style={{ display: 'block', overflow: 'visible' }}>
        {/* Grid lines at major ticks */}
        {dates.map((_, i) => {
          if (i % labelStep !== 0) return null
          const x = `${((i + 0.5) / dates.length) * 100}%`
          return <line key={`g${i}`} x1={x} y1={0} x2={x} y2="100%" stroke="#1E1E2C" strokeWidth={1} />
        })}

        {/* Date labels */}
        {dates.map((date, i) => {
          const isFirst = i === 0
          const isLast = i === dates.length - 1
          if (!isFirst && !isLast && i % labelStep !== 0) return null
          const x = `${((i + 0.5) / dates.length) * 100}%`
          return (
            <text key={date} x={x} y="50%" dominantBaseline="middle" textAnchor="middle" fontSize={10} fill="#4A4A62">
              {formatAxisLabel(date)}
            </text>
          )
        })}

        {/* Today vertical line */}
        {showTodayMarker && (
          <line x1={`${todayPct}%`} y1={0} x2={`${todayPct}%`} y2="100%" stroke="#7C7CCC" strokeWidth={1.5} />
        )}
      </svg>

      {/* Today arrow — CSS positioned to avoid SVG transform% limitation */}
      {showTodayMarker && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: `${todayPct}%`,
          transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderBottom: '7px solid #7C7CCC',
        }} />
      )}
    </div>
  )
}

