import { useMemo, useState } from 'react'
import type { Pattern, PatternOccurrence, FaultCode, DerivedStatus } from '../data/types'
import { LABEL_HEIGHT, DOTS_HEIGHT } from './PatternTimeline'
import { fromISO } from '../lib/dates'
import { format } from 'date-fns'

const BADGE_WIDTH = 60

export interface RelatedGroup {
  pattern: Pattern
  occurrences: PatternOccurrence[]
  faultCodeMap: Map<string, FaultCode>
}

interface Props {
  pattern: Pattern
  status: DerivedStatus
  faultCodeMap: Map<string, FaultCode>
  occurrences: PatternOccurrence[]
  dates: string[]
  labelStep: number
  validation: 'abnormal' | 'normal' | undefined
  fcColWidth: number
  onValidate: (status: 'abnormal' | 'normal') => void
  relatedGroups?: RelatedGroup[]
  onValidateRelated?: (patternId: string, status: 'abnormal' | 'normal') => void
  relatedValidations?: Record<string, 'abnormal' | 'normal'>
}

const STATUS_ACCENT: Record<DerivedStatus, string> = {
  new: '#FF6A00',
  ongoing: '#8B6AFF',
  unclassified: '#3F3F52',
}

const STATUS_CARD_BG: Record<DerivedStatus, string> = {
  new: '#170A00',
  ongoing: '#0E0A17',
  unclassified: '#0D0D11',
}

const STATUS_BORDER: Record<DerivedStatus, string> = {
  new: '#2A1218',
  ongoing: '#201408',
  unclassified: '#1A1A20',
}

const ABNORMAL_COLORS: Record<DerivedStatus, string> = {
  new: '#E8394A',
  ongoing: '#2EB175',
  unclassified: '#999999',
}

function formatDate(d: string) {
  return format(fromISO(d), 'd MMM yyyy')
}

export function PatternCard({
  pattern, status, faultCodeMap, occurrences, dates, labelStep,
  validation, onValidate, relatedGroups = [], onValidateRelated, relatedValidations = {},
}: Props) {
  const accent = STATUS_ACCENT[status]
  const cardBg = STATUS_CARD_BG[status]
  const cardBorder = STATUS_BORDER[status]
  const abnormalColor = ABNORMAL_COLORS[status]

  const [hoveredDi, setHoveredDi] = useState<number | null>(null)
  const [frameSelected, setFrameSelected] = useState(false)
  const [menuOpen, setMenuOpen] = useState(true)
  const [selectedRelatedId, setSelectedRelatedId] = useState<string | null>(null)

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const di = Math.floor(((e.clientX - rect.left) / rect.width) * dates.length)
    setHoveredDi(Math.max(0, Math.min(di, dates.length - 1)))
  }

  const datesSet = useMemo(() => new Set(dates), [dates])

  // Pre-build occurrence map per FC code (period-filtered)
  const occMap = useMemo(() => {
    const map = new Map<string, Map<string, { count: number; occStatus: 'abnormal' | 'normal' }>>()
    for (const occ of occurrences) {
      if (occ.patternId !== pattern.id) continue
      if (!datesSet.has(occ.date)) continue
      let inner = map.get(occ.faultCode)
      if (!inner) { inner = new Map(); map.set(occ.faultCode, inner) }
      inner.set(occ.date, { count: occ.count, occStatus: occ.status })
    }
    return map
  }, [occurrences, pattern.id, datesSet])

  // Only show fault codes with ≥1 occurrence in the period that has a correlationGroupId
  const visibleFaultCodes = useMemo(() => {
    return pattern.faultCodes.filter(code =>
      occurrences.some(occ =>
        occ.patternId === pattern.id &&
        occ.faultCode === code &&
        occ.correlationGroupId != null &&
        datesSet.has(occ.date)
      )
    )
  }, [occurrences, pattern.id, pattern.faultCodes, datesSet])

  // Compute correlation group frame bounds
  const { frameStartDi, frameEndDi } = useMemo(() => {
    const groupOccs = occurrences.filter(o => o.patternId === pattern.id && o.correlationGroupId != null)
    if (!groupOccs.length) return { frameStartDi: -1, frameEndDi: -1 }
    const frameDates = groupOccs.map(o => o.date)
    const minDate = frameDates.reduce((a, b) => a < b ? a : b)
    const maxDate = frameDates.reduce((a, b) => a > b ? a : b)
    const startDi = dates.findIndex(d => d >= minDate)
    let endDi = -1
    for (let i = dates.length - 1; i >= 0; i--) {
      if (dates[i] <= maxDate) { endDi = i; break }
    }
    return { frameStartDi: startDi, frameEndDi: endDi }
  }, [occurrences, pattern.id, dates])

  const hasFrame = frameStartDi >= 0 && frameEndDi >= 0

  const relatedGroupsData = useMemo(() => {
    return relatedGroups.map(rg => {
      const rgOccMap = new Map<string, Map<string, { count: number; occStatus: 'abnormal' | 'normal' }>>()
      for (const occ of rg.occurrences) {
        if (occ.patternId !== rg.pattern.id) continue
        if (!datesSet.has(occ.date)) continue
        let inner = rgOccMap.get(occ.faultCode)
        if (!inner) { inner = new Map(); rgOccMap.set(occ.faultCode, inner) }
        inner.set(occ.date, { count: occ.count, occStatus: occ.status })
      }
      const groupOccs = rg.occurrences.filter(o => o.patternId === rg.pattern.id && o.correlationGroupId != null)
      let rgFrameStartDi = -1, rgFrameEndDi = -1
      if (groupOccs.length) {
        const frameDates = groupOccs.map(o => o.date)
        const minDate = frameDates.reduce((a, b) => a < b ? a : b)
        const maxDate = frameDates.reduce((a, b) => a > b ? a : b)
        rgFrameStartDi = dates.findIndex(d => d >= minDate)
        for (let i = dates.length - 1; i >= 0; i--) {
          if (dates[i] <= maxDate) { rgFrameEndDi = i; break }
        }
      }
      const rgHasFrame = rgFrameStartDi >= 0 && rgFrameEndDi >= 0
      const rgStartFraction = rgHasFrame ? rgFrameStartDi / dates.length : 0
      const rgWidthFraction = rgHasFrame ? (rgFrameEndDi - rgFrameStartDi + 1) / dates.length : 0
      const rgFrameLeft = `calc(${BADGE_WIDTH}px + ${rgStartFraction} * (100% - ${BADGE_WIDTH}px))`
      const rgFrameWidth = `calc(${rgWidthFraction} * (100% - ${BADGE_WIDTH}px))`
      const overlapsMain = rgHasFrame && hasFrame && rgFrameStartDi <= frameEndDi && rgFrameEndDi >= frameStartDi
      return { rg, rgOccMap, rgFrameStartDi, rgFrameEndDi, rgHasFrame, rgStartFraction, rgWidthFraction, rgFrameLeft, rgFrameWidth, overlapsMain }
    }).filter(d => d.rgHasFrame && !d.overlapsMain)
  }, [relatedGroups, datesSet, dates, hasFrame, frameStartDi, frameEndDi])

  if (visibleFaultCodes.length === 0) return null

  const FRAME_STYLE = {
    unclassified: {
      bg: '#232323',
      bar: '#474747',
      dot: '#999999',
      overlayBg: 'rgba(153,153,153,0.15)',
      borderTop: '1px dashed #CCC',
      borderBottom: '1px dashed #CCC',
      borderLeft: '1px dashed #CCC',
      borderRight: '1px dashed #CCC',
      borderRadius: '6px',
    },
    ongoing: {
      bg: '#20183A',
      bar: '#403175',
      dot: '#8364F1',
      overlayBg: 'rgba(139,106,255,0.15)',
      borderTop: '1px dashed #8B6AFF',
      borderBottom: '1px dashed #8B6AFF',
      borderLeft: '1px dashed #8B6AFF',
      borderRight: 'none',
      borderRadius: '6px 0 0 6px',
    },
    new: {
      bg: '#3C1A02',
      bar: '#753100',
      dot: '#FF6A00',
      overlayBg: 'rgba(255,106,0,0.15)',
      borderTop: '1px dashed #FF6A00',
      borderBottom: '1px dashed #FF6A00',
      borderLeft: '1px dashed #FF6A00',
      borderRight: '1px dashed #FF6A00',
      borderRadius: '7px',
    },
  }[status]

  const UNC_FRAME_STYLE = {
    bg: '#232323', bar: '#474747', dot: '#999999',
    overlayBg: 'rgba(153,153,153,0.15)',
    borderTop: '1px dashed #CCC', borderBottom: '1px dashed #CCC',
    borderLeft: '1px dashed #CCC', borderRight: '1px dashed #CCC',
    borderRadius: '6px',
  }

  const startFraction = hasFrame ? frameStartDi / dates.length : 0
  const widthFraction = hasFrame ? (frameEndDi - frameStartDi + 1) / dates.length : 0
  const frameLeft = `calc(${BADGE_WIDTH}px + ${startFraction} * (100% - ${BADGE_WIDTH}px))`
  const frameWidth = `calc(${widthFraction} * (100% - ${BADGE_WIDTH}px))`

  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 4,
        marginBottom: 8,
        paddingLeft: 15,
        position: 'relative',
      }}
      onMouseLeave={() => setHoveredDi(null)}
    >
      {/* Hover date header */}
      <div style={{ display: 'flex', height: 32 }}>
        <div style={{ width: BADGE_WIDTH, flexShrink: 0 }} />
        <div style={{ flex: 1, position: 'relative' }}>
          {hoveredDi !== null && (
            <>
            <div style={{
              position: 'absolute',
              left: `${((hoveredDi + 0.5) / dates.length) * 100}%`,
              transform: 'translateX(-50%)',
              top: 0,
              fontSize: 10,
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 400,
              lineHeight: '15px',
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 10,
            }}>
              {formatDate(dates[hoveredDi])}
            </div>
            <div style={{
              position: 'absolute',
              left: `${((hoveredDi + 0.5) / dates.length) * 100}%`,
              transform: 'translateX(-50%)',
              top: 13,
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '6px solid white',
              pointerEvents: 'none',
            }} />
            </>
          )}
        </div>
      </div>
      {/* Single full-height hover line — starts below triangle, covers all FC rows */}
      {hoveredDi !== null && (
        <div style={{
          position: 'absolute',
          top: 19,
          bottom: 0,
          left: `calc(75px + (100% - 75px) * ${(hoveredDi + 0.5) / dates.length})`,
          width: 1,
          background: 'rgba(150,150,220,0.5)',
          pointerEvents: 'none',
          zIndex: 5,
        }} />
      )}

      {/* Per-FC rows: label row (full width) + dots row */}
      <div style={{ position: 'relative', zIndex: 0 }}>
        {/* Solid background behind FC rows for frame range */}
        {hasFrame && FRAME_STYLE && !validation && (
          <div style={{
            position: 'absolute',
            top: 0, bottom: 0,
            left: frameLeft,
            width: frameWidth,
            background: FRAME_STYLE.bg,
            zIndex: -1,
          }} />
        )}

        {/* Dashed border overlay on top of FC rows */}
        {hasFrame && FRAME_STYLE && (
          <div style={{
            position: 'absolute',
            top: 0, bottom: 0,
            left: frameLeft,
            width: frameWidth,
            borderRadius: FRAME_STYLE.borderRadius,
            borderTop: validation ? 'none' : frameSelected ? FRAME_STYLE.borderTop.replace('dashed', 'solid').replace('1px', '2px') : FRAME_STYLE.borderTop,
            borderBottom: validation ? 'none' : frameSelected ? FRAME_STYLE.borderBottom.replace('dashed', 'solid').replace('1px', '2px') : FRAME_STYLE.borderBottom,
            borderLeft: validation ? 'none' : frameSelected ? FRAME_STYLE.borderLeft.replace('dashed', 'solid').replace('1px', '2px') : FRAME_STYLE.borderLeft,
            borderRight: validation ? 'none' : frameSelected ? FRAME_STYLE.borderRight.replace('dashed', 'solid').replace('1px', '2px') : FRAME_STYLE.borderRight,
            background: validation ? 'transparent' : FRAME_STYLE.overlayBg,
            cursor: validation ? 'default' : 'pointer',
            pointerEvents: validation ? 'none' : 'auto',
            zIndex: 5,
          }} onClick={validation ? undefined : () => { setFrameSelected(s => { if (!s) { setMenuOpen(false); setSelectedRelatedId(null) } return !s }) }}>
            {/* Labels above the frame: date row + validation label */}
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 'min(0px, calc(100% - 160px))',
              width: '100%',
              marginBottom: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              pointerEvents: 'none',
            }}>
              <div style={{ minHeight: 1, flexShrink: 0 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#CCCCCC' }}>
                  {formatDate(dates[frameStartDi])} – {formatDate(dates[frameEndDi])}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, aspectRatio: '1/1' }}>
                  <g clipPath="url(#clip0_4292_1863)">
                    <path d="M7.5 2V1M7.5 2V3M7.5 2H5.25M1.5 5V9.5C1.5 10.0523 1.94771 10.5 2.5 10.5H9.5C10.0523 10.5 10.5 10.0523 10.5 9.5V5H1.5Z" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" stroke="#999999"/>
                    <path d="M1.5 5V3C1.5 2.44771 1.94771 2 2.5 2H3.5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" stroke="#999999"/>
                    <path d="M3.5 1V3" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" stroke="#999999"/>
                    <path d="M10.5 5V3C10.5 2.44771 10.0523 2 9.5 2H9.25" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" stroke="#999999"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_4292_1863">
                      <rect width="12" height="12" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', background: '#383642', visibility: validation ? 'visible' : 'hidden' }}>
                {validation === 'abnormal' && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, aspectRatio: '1/1' }}>
                    <path d="M3.37891 8.62128L6.00022 5.99998M6.00022 5.99998L8.62152 3.37866M6.00022 5.99998L3.37891 3.37866M6.00022 5.99998L8.62152 8.62128" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="#FF2060"/>
                  </svg>
                )}
                {validation === 'normal' && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, aspectRatio: '1/1' }}>
                    <path d="M2.5 6.5L4.5 8.5L9.5 3.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="#2DB173"/>
                  </svg>
                )}
                <span style={{
                  color: '#999',
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: 11,
                  fontStyle: 'normal',
                  fontWeight: 400,
                  lineHeight: '15px',
                }}>
                  {validation === 'abnormal' ? 'Abnormal' : 'Normal'}
                </span>
              </div>
            </div>
            {/* Abnormal/Normal buttons below the frame */}
            {frameSelected && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 'max(0px, calc(50% - 75px))',
                marginTop: 6,
                display: 'flex',
                pointerEvents: 'all',
              }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', border: '1px solid #2A2A3A', borderRadius: 20, overflow: 'hidden' }}>
                  <SegmentButton label="Abnormal" active={validation === 'abnormal'} activeColor="#E8394A" onClick={() => { onValidate('abnormal'); setFrameSelected(false) }} />
                  <div style={{ width: 1, background: '#2A2A3A', flexShrink: 0 }} />
                  <SegmentButton label="Normal" active={validation === 'normal'} activeColor="#22C55E" onClick={() => { onValidate('normal'); setFrameSelected(false) }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Related unclassified group frame overlays — same FC rows, different time window */}
        {relatedGroupsData.flatMap(({ rg, rgFrameLeft, rgFrameWidth, rgFrameStartDi, rgFrameEndDi }) => {
          const sel = selectedRelatedId === rg.pattern.id
          const b = (s: string) => sel ? s.replace('dashed', 'solid').replace('1px', '2px') : s
          return [
            <div key={`${rg.pattern.id}-bg`} style={{ position: 'absolute', top: 0, bottom: 0, left: rgFrameLeft, width: rgFrameWidth, background: UNC_FRAME_STYLE.bg, zIndex: -1 }} />,
            <div
              key={`${rg.pattern.id}-border`}
              style={{
                position: 'absolute', top: 0, bottom: 0,
                left: rgFrameLeft, width: rgFrameWidth,
                borderRadius: UNC_FRAME_STYLE.borderRadius,
                borderTop: b(UNC_FRAME_STYLE.borderTop),
                borderBottom: b(UNC_FRAME_STYLE.borderBottom),
                borderLeft: b(UNC_FRAME_STYLE.borderLeft),
                borderRight: b(UNC_FRAME_STYLE.borderRight),
                background: UNC_FRAME_STYLE.overlayBg,
                cursor: 'pointer', zIndex: 5,
              }}
              onClick={() => setSelectedRelatedId(id => {
                const next = id === rg.pattern.id ? null : rg.pattern.id
                if (next) { setFrameSelected(false); setMenuOpen(false) }
                return next
              })}
            >
              <div style={{ position: 'absolute', bottom: '100%', left: 'min(0px, calc(100% - 160px))', marginBottom: 4, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4, pointerEvents: 'none' }}>
                <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#CCCCCC' }}>
                  {formatDate(dates[rgFrameStartDi])} – {formatDate(dates[rgFrameEndDi])}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                  <g clipPath="url(#rg-cal)">
                    <path d="M7.5 2V1M7.5 2V3M7.5 2H5.25M1.5 5V9.5C1.5 10.0523 1.94771 10.5 2.5 10.5H9.5C10.0523 10.5 10.5 10.0523 10.5 9.5V5H1.5Z" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" stroke="#999999"/>
                    <path d="M1.5 5V3C1.5 2.44771 1.94771 2 2.5 2H3.5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" stroke="#999999"/>
                    <path d="M3.5 1V3" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" stroke="#999999"/>
                    <path d="M10.5 5V3C10.5 2.44771 10.0523 2 9.5 2H9.25" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" stroke="#999999"/>
                  </g>
                  <defs><clipPath id="rg-cal"><rect width="12" height="12" fill="white"/></clipPath></defs>
                </svg>
              </div>
              {sel && (
                <div style={{ position: 'absolute', top: '100%', right: 'max(0px, calc(50% - 75px))', marginTop: 6, display: 'flex', pointerEvents: 'all' }}
                  onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', border: '1px solid #2A2A3A', borderRadius: 20, overflow: 'hidden' }}>
                    <SegmentButton label="Abnormal" active={relatedValidations[rg.pattern.id] === 'abnormal'} activeColor="#E8394A" onClick={() => onValidateRelated?.(rg.pattern.id, 'abnormal')} />
                    <div style={{ width: 1, background: '#2A2A3A', flexShrink: 0 }} />
                    <SegmentButton label="Normal" active={relatedValidations[rg.pattern.id] === 'normal'} activeColor="#22C55E" onClick={() => onValidateRelated?.(rg.pattern.id, 'normal')} />
                  </div>
                </div>
              )}
            </div>,
          ]
        })}

      {visibleFaultCodes.map((code, i) => {
        const fc = faultCodeMap.get(code)
        const fcMap = occMap.get(code)
        const isLast = i === visibleFaultCodes.length - 1

        return (
          <div key={code} style={{ marginBottom: !isLast ? 5 : 0 }}>

            {/* LABEL ROW — full card width */}
            <div style={{
              display: 'flex',
              alignItems: 'stretch',
              height: LABEL_HEIGHT,
              background: 'rgba(0,0,0,0.18)',
            }}>
              {/* Badge */}
              <div style={{
                width: BADGE_WIDTH,
                flexShrink: 0,
                background: status === 'unclassified' ? '#1A1A1A' : status === 'ongoing' ? '#1A1623' : '#23170D',
                borderTop: '1px solid #3D3D3D',
                borderLeft: '1px solid #3D3D3D',
                borderRight: '1px solid #3D3D3D',
                borderRadius: '4px 4px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{
                  fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", monospace',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  letterSpacing: '0.06em',
                }}>
                  {code}
                </span>
              </div>
              {/* Description — spans full remaining width */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 12px', overflow: 'hidden', borderBottom: `1px solid ${cardBorder}` }}>
                <span style={{ fontSize: 12, color: '#8080A0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fc?.description ?? '—'}
                </span>
              </div>
            </div>

            {/* DOTS ROW — badge-width spacer only, dots start right under badge */}
            <div style={{ display: 'flex', height: DOTS_HEIGHT }}>
              {/* Badge-width dark spacer — visually continues the badge frame */}
              <div style={{
                width: BADGE_WIDTH,
                flexShrink: 0,
                background: status === 'unclassified' ? '#1A1A1A' : status === 'ongoing' ? '#1A1623' : '#23170D',
                borderLeft: '1px solid #3D3D3D',
                borderRight: '1px solid #3D3D3D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, aspectRatio: '1/1', opacity: 0.6 }}>
                  <path d="M10.5 8.9982C10.5 7.12942 8.76225 5.25 6.64285 5.25L5.35714 5.25001C3.2269 5.25001 1.5 6.92814 1.5 8.9982C1.5 10.782 2.7823 12.2748 4.5 12.6536C4.77567 12.7144 5.06255 12.7464 5.35714 12.7464" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="white"/>
                  <path d="M7.5 8.99821C7.5 10.867 9.23775 12.7464 11.3572 12.7464H12.6428C14.7731 12.7464 16.5 11.0683 16.5 8.99821C16.5 7.21441 15.2177 5.72164 13.5 5.34288C13.2243 5.28209 12.9374 5.25 12.6428 5.25" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="white"/>
                </svg>
              </div>
              {/* Mini timeline for this FC code */}
              <div style={{ flex: 1, background: status === 'ongoing' ? '#1A1623' : status === 'new' ? '#23170D' : '#1A1A1A' }}>
                <svg width="100%" height={DOTS_HEIGHT} style={{ display: 'block' }} onMouseMove={handleSvgMouseMove}>
                  {/* Frame background rect */}
                  {hasFrame && FRAME_STYLE && (
                    <rect
                      x={`${startFraction * 100}%`}
                      y={0}
                      width={`${widthFraction * 100}%`}
                      height={DOTS_HEIGHT}
                      fill={validation ? '#383642' : FRAME_STYLE.bar}
                    />
                  )}
                  {relatedGroupsData.map(({ rg, rgStartFraction, rgWidthFraction }) => (
                    <rect key={rg.pattern.id} x={`${rgStartFraction * 100}%`} y={0} width={`${rgWidthFraction * 100}%`} height={DOTS_HEIGHT} fill={UNC_FRAME_STYLE.bar} />
                  ))}
                  {/* Grid lines */}
                  {dates.map((_, di) => {
                    if (di % labelStep !== 0) return null
                    const x = `${((di + 0.5) / dates.length) * 100}%`
                    return <line key={`g${di}`} x1={x} y1={0} x2={x} y2={DOTS_HEIGHT} stroke="#1A1A24" strokeWidth={1} />
                  })}
                  {/* Dots */}
                  {dates.map((date, di) => {
                    const occ = fcMap?.get(date)
                    if (!occ) return null
                    const cx = `${((di + 0.5) / dates.length) * 100}%`
                    const cy = DOTS_HEIGHT / 2
                    const inFrame = hasFrame && FRAME_STYLE && di >= frameStartDi && di <= frameEndDi
                    if (inFrame) {
                      const r = Math.min(5 + occ.count * 0.9, 11)
                      const fill = validation === 'abnormal' ? '#FF1F60' : validation === 'normal' ? '#30C27E' : FRAME_STYLE.dot
                      return <circle key={date} cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.92} />
                    }
                    if (occ.occStatus === 'normal' && status !== 'unclassified') {
                      return <circle key={date} cx={cx} cy={cy} r={5} fill="#2ECC71" fillOpacity={0.8} />
                    }
                    const r = occ.occStatus === 'normal' ? 5 : Math.min(5 + occ.count * 0.9, 11)
                    return <circle key={date} cx={cx} cy={cy} r={r} fill={abnormalColor} fillOpacity={0.92} />
                  })}
                  {relatedGroupsData.flatMap(({ rg, rgOccMap, rgFrameStartDi, rgFrameEndDi, rgHasFrame }) => {
                    const rgFcMap = rgOccMap.get(code)
                    if (!rgFcMap) return []
                    return dates.map((date, di) => {
                      const occ = rgFcMap.get(date)
                      if (!occ) return null
                      const cx = `${((di + 0.5) / dates.length) * 100}%`
                      const cy = DOTS_HEIGHT / 2
                      if (rgHasFrame && di >= rgFrameStartDi && di <= rgFrameEndDi) {
                        const r = Math.min(5 + occ.count * 0.9, 11)
                        return <circle key={`${rg.pattern.id}-${date}`} cx={cx} cy={cy} r={r} fill={UNC_FRAME_STYLE.dot} fillOpacity={0.92} />
                      }
                      const r = occ.occStatus === 'normal' ? 5 : Math.min(5 + occ.count * 0.9, 11)
                      return <circle key={`${rg.pattern.id}-${date}`} cx={cx} cy={cy} r={r} fill={ABNORMAL_COLORS['unclassified']} fillOpacity={0.92} />
                    })
                  })}
                </svg>
              </div>
            </div>

          </div>
        )
      })}
      </div>

      {/* Footer: date range + actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '7px 14px',
        borderTop: `1px solid ${cardBorder}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display: 'block', aspectRatio: '1/1' }}>
            <g clipPath="url(#clip0_4295_1920)">
              <path d="M8 4V8H12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="#999999"/>
              <path d="M14.5924 6.99992C14.1098 3.79241 11.3422 1.33325 8.00016 1.33325C4.31826 1.33325 1.3335 4.31802 1.3335 7.99992C1.3335 11.6818 4.31826 14.6666 8.00016 14.6666C10.7339 14.6666 13.0834 13.0211 14.1121 10.6666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="#999999"/>
              <path d="M11.3335 10.6667H14.2668C14.4878 10.6667 14.6668 10.8458 14.6668 11.0667V14.0001" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="#999999"/>
            </g>
            <defs>
              <clipPath id="clip0_4295_1920">
                <rect width="16" height="16" fill="white"/>
              </clipPath>
            </defs>
          </svg>
          <div style={{
            display: 'flex',
            width: 14,
            height: 14,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            aspectRatio: '1/1',
            position: 'absolute',
            right: -7,
            top: -9,
            borderRadius: 40,
            border: '1px solid #999',
            background: 'rgba(153,153,153,0.50)',
          }}>
            <span style={{ fontFamily: 'Roboto', fontSize: 10, fontStyle: 'normal', fontWeight: 500, lineHeight: '16.5px', color: '#FFF' }}>6</span>
          </div>
        </div>

        {menuOpen ? (
          <div style={{ display: 'flex', gap: 4 }}>
            {(['Ignore this pattern', 'Create an alert', 'Add to pattern', 'Inspect pattern'] as const).map(label => (
              <button key={label} onClick={() => {}} style={{
                background: 'transparent',
                border: '1px solid #3D3D3D',
                borderRadius: 6,
                color: '#999999',
                fontSize: 11,
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 500,
                padding: '3px 8px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}>
                {label}
              </button>
            ))}
          </div>
        ) : (
          <button onClick={() => { setMenuOpen(true); setFrameSelected(false) }} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            background: 'transparent',
            border: '1px solid #3D3D3D',
            borderRadius: 6,
            cursor: 'pointer',
            flexShrink: 0,
            padding: 0,
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="3" r="1" fill="#999999"/>
              <circle cx="8" cy="8" r="1" fill="#999999"/>
              <circle cx="8" cy="13" r="1" fill="#999999"/>
            </svg>
          </button>
        )}
        </div>

      </div>
    </div>
  )
}


function SegmentButton({ label, active, activeColor, onClick }: {
  label: string; active: boolean; activeColor: string; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      background: active ? activeColor : 'transparent', border: 'none',
      color: active ? '#FFFFFF' : '#71717A', fontSize: 11, fontWeight: 600,
      padding: '4px 12px', cursor: 'pointer',
    }}>
      {label}
    </button>
  )
}
