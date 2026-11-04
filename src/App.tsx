import { useEffect, useMemo, useState } from 'react'
import { useStore, derivePatternStatus } from './store/index'
import FilterBar from './components/FilterBar'
import { AssetSidebar } from './components/AssetSidebar'
import { PatternSection } from './components/PatternSection'
import { getPeriodRange, getDatesInRange, formatAxisLabel, getMonthRange, navigateEnd, todayISO } from './lib/dates'
import type { DerivedStatus, ISODate, PanelMode } from './data/types'

const FC_COL_WIDTH = 60  // = BADGE_WIDTH — dates align with dots start
const SIDEBAR_WIDTH = 200

export default function App() {
  const {
    data, loadingState, loadData, retryLoad,
    lastSessionAt, patternValidations,
    selectedAssetId, view,
    setSelectedAsset, setView, simulateNewSession,
    validatePattern,
  } = useStore()

  const [panelMode, setPanelMode] = useState<PanelMode>('dashboard')
  const [inspectEnd, setInspectEnd] = useState<ISODate>(() => todayISO())

  useEffect(() => { loadData() }, [loadData])

  const [periodStart, periodEnd] = useMemo(() => getPeriodRange(view), [view])
  const dates = useMemo(() => getDatesInRange(periodStart, periodEnd), [periodStart, periodEnd])

  const [inspectStart] = useMemo(() => getMonthRange(inspectEnd), [inspectEnd])
  const inspectDates = useMemo(() => getDatesInRange(inspectStart, inspectEnd), [inspectStart, inspectEnd])
  const inspectLabelStep = inspectDates.length <= 7 ? 1 : inspectDates.length <= 14 ? 2 : 5

  const handleNavigateInspect = (dir: -1 | 1) => {
    setInspectEnd(prev => navigateEnd('1M', prev, dir))
  }

  const faultCodeMap = useMemo(() => {
    if (!data) return new Map()
    return new Map(data.faultCodes.map(fc => [fc.code, fc]))
  }, [data])

  const derive = useMemo(() => (p: { id: string; assetId: string; faultCodes: string[]; startDate: string; endDate?: string }) =>
    derivePatternStatus(p, lastSessionAt),
    [lastSessionAt]
  )

  const assetPatterns = useMemo(() => {
    if (!data || !selectedAssetId) return { new: [], ongoing: [], unclassified: [] }
    const all = data.patterns.filter(p => p.assetId === selectedAssetId)
    const groups: Record<DerivedStatus, typeof all> = { new: [], ongoing: [], unclassified: [] }
    for (const p of all) groups[derive(p)].push(p)
    return groups
  }, [data, selectedAssetId, derive])

  const totalCounts = useMemo(() => {
    if (!data) return { new: 0, ongoing: 0 }
    let newCount = 0, ongoingCount = 0
    for (const p of data.patterns) {
      const s = derive(p)
      if (s === 'new') newCount++
      else if (s === 'ongoing') ongoingCount++
    }
    return { new: newCount, ongoing: ongoingCount }
  }, [data, derive])

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

  const hasNoPatterns = assetPatterns.new.length === 0 && assetPatterns.ongoing.length === 0 && assetPatterns.unclassified.length === 0

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0B0B10' }}>
      <FilterBar
        view={view} onSetView={setView} onSimulateSession={simulateNewSession}
        panelMode={panelMode} onSetPanelMode={setPanelMode}
        newCount={totalCounts.new}
        ongoingCount={totalCounts.ongoing}
        inspectStart={inspectStart} inspectEnd={inspectEnd}
        onNavigateInspect={handleNavigateInspect}
      />

      {panelMode === 'dashboard' ? (
        <DashboardView
          dates={dates}
          labelStep={labelStep}
          data={data}
          selectedAssetId={selectedAssetId}
          onSelectAsset={setSelectedAsset}
          deriveStatus={derive}
          assetPatterns={assetPatterns}
          faultCodeMap={faultCodeMap}
          patternValidations={patternValidations}
          onValidate={validatePattern}
          hasNoPatterns={hasNoPatterns}
        />
      ) : (
        <>
          {/* Column header row: ASSET | ANOMALOUS PATTERNS | date axis */}
          <div style={{
            height: 36,
            flexShrink: 0,
            display: 'flex',
            background: '#0F0F16',
            borderBottom: '1px solid #1E1E28',
          }}>
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
            <div style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>
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
              <DateAxisSvg dates={inspectDates} labelStep={inspectLabelStep} />
            </div>
          </div>

          {/* Main content */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <AssetSidebar
              assets={data.assets}
              patterns={data.patterns}
              selectedAssetId={selectedAssetId}
              deriveStatus={derive}
              onSelect={setSelectedAsset}
              sidebarWidth={SIDEBAR_WIDTH}
            />
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', position: 'relative' }}>
              {hasNoPatterns ? (
                <div style={{ color: '#3F3F52', fontSize: 14, marginTop: 40, textAlign: 'center' }}>
                  No patterns to display for this asset.
                </div>
              ) : (
                <>
                  <PatternSection title="New Anomalous Patterns" status="new" patterns={assetPatterns.new}
                    faultCodeMap={faultCodeMap} occurrences={data.occurrences} dates={inspectDates} labelStep={inspectLabelStep}
                    patternValidations={patternValidations}
                    fcColWidth={FC_COL_WIDTH} onValidate={validatePattern}
                    unclassifiedPatterns={assetPatterns.unclassified} />
                  <PatternSection title="Ongoing Anomalous Patterns" status="ongoing" patterns={assetPatterns.ongoing}
                    faultCodeMap={faultCodeMap} occurrences={data.occurrences} dates={inspectDates} labelStep={inspectLabelStep}
                    patternValidations={patternValidations}
                    fcColWidth={FC_COL_WIDTH} onValidate={validatePattern}
                    unclassifiedPatterns={assetPatterns.unclassified} />
                  <PatternSection title="Unclassified Patterns" status="unclassified" patterns={assetPatterns.unclassified}
                    faultCodeMap={faultCodeMap} occurrences={data.occurrences} dates={inspectDates} labelStep={inspectLabelStep}
                    patternValidations={patternValidations}
                    fcColWidth={FC_COL_WIDTH} onValidate={validatePattern} />
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
              <DateAxisSvg dates={inspectDates} labelStep={inspectLabelStep} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

interface DashboardViewProps {
  dates: string[]
  labelStep: number
  data: import('./data/types').PatternData
  selectedAssetId: string | null
  onSelectAsset: (id: string) => void
  deriveStatus: (p: { id: string; assetId: string; faultCodes: string[]; startDate: string; endDate?: string }) => import('./data/types').DerivedStatus
  assetPatterns: { new: import('./data/types').Pattern[]; ongoing: import('./data/types').Pattern[]; unclassified: import('./data/types').Pattern[] }
  faultCodeMap: Map<string, import('./data/types').FaultCode>
  patternValidations: Record<string, 'abnormal' | 'normal'>
  onValidate: (id: string, status: 'abnormal' | 'normal') => void
  hasNoPatterns: boolean
}

function DashboardView({
  dates, labelStep, data, selectedAssetId, onSelectAsset, deriveStatus,
  assetPatterns, faultCodeMap, patternValidations, onValidate, hasNoPatterns,
}: DashboardViewProps) {
  return (
    <>
      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <AssetSidebar
          assets={data.assets}
          patterns={data.patterns}
          selectedAssetId={selectedAssetId}
          deriveStatus={deriveStatus}
          onSelect={onSelectAsset}
          sidebarWidth={SIDEBAR_WIDTH}
        />
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', position: 'relative' }}>
          {hasNoPatterns ? (
            <div style={{ color: '#3F3F52', fontSize: 14, marginTop: 40, textAlign: 'center' }}>
              No patterns to display for this asset.
            </div>
          ) : (
            <>
              <PatternSection title="New Anomalous Patterns" status="new" patterns={assetPatterns.new}
                faultCodeMap={faultCodeMap} occurrences={data.occurrences} dates={dates} labelStep={labelStep}
                patternValidations={patternValidations}
                fcColWidth={FC_COL_WIDTH} onValidate={onValidate}
                unclassifiedPatterns={assetPatterns.unclassified} />
              <PatternSection title="Ongoing Anomalous Patterns" status="ongoing" patterns={assetPatterns.ongoing}
                faultCodeMap={faultCodeMap} occurrences={data.occurrences} dates={dates} labelStep={labelStep}
                patternValidations={patternValidations}
                fcColWidth={FC_COL_WIDTH} onValidate={onValidate}
                unclassifiedPatterns={assetPatterns.unclassified} />
              <PatternSection title="Unclassified Patterns" status="unclassified" patterns={assetPatterns.unclassified}
                faultCodeMap={faultCodeMap} occurrences={data.occurrences} dates={dates} labelStep={labelStep}
                patternValidations={patternValidations}
                fcColWidth={FC_COL_WIDTH} onValidate={onValidate} />
            </>
          )}
        </div>
      </div>

    </>
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

