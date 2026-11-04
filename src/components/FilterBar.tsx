import { useState, useEffect, useRef } from 'react'
import type { Asset, FaultCode, ISODate, ViewMode, PanelMode } from '../data/types'
import { formatPeriodLabel, todayISO } from '../lib/dates'

interface Props {
  view: ViewMode
  onSetView: (v: ViewMode) => void
  onSimulateSession: () => void
  panelMode: PanelMode
  onSetPanelMode: (m: PanelMode) => void
  newCount: number
  ongoingCount: number
  inspectStart?: ISODate
  inspectEnd?: ISODate
  onNavigateInspect?: (dir: -1 | 1) => void
  assets?: Asset[]
  faultCodes?: FaultCode[]
  inspectAssetIds?: string[]
  inspectFaultCodes?: string[]
  onSetInspectAssetIds?: (ids: string[]) => void
  onSetInspectFaultCodes?: (codes: string[]) => void
}

const VIEWS: ViewMode[] = ['3D', '1W', '1M']

export default function FilterBar({ view, onSetView, onSimulateSession, panelMode, onSetPanelMode, newCount, ongoingCount, inspectStart, inspectEnd, onNavigateInspect, assets = [], faultCodes = [], inspectAssetIds = [], inspectFaultCodes = [], onSetInspectAssetIds, onSetInspectFaultCodes }: Props) {
  return (
    <div style={{ flexShrink: 0, background: '#12121A', borderBottom: '1px solid #1E1E2C' }}>
      {/* Top nav row */}
      <div style={{
        height: 48,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        borderBottom: '1px solid #1A1A26',
      }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 32 }}>
          <div style={{
            background: '#3D2EAA',
            borderRadius: 6,
            width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginRight: 4,
          }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 900 }}>R</span>
          </div>
          <span style={{ color: '#8B7EF8', fontWeight: 700, fontSize: 14 }}>RailGenius</span>
          <span style={{ color: '#3F3F52', fontSize: 14 }}>›</span>
          <span style={{ color: '#C4C4D4', fontWeight: 600, fontSize: 14 }}>Fault Codes Dashboard</span>
          <span style={{ color: '#52526A', fontSize: 14, marginLeft: 2 }}>▾</span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {['Live Map', 'Reporting', 'New corrective event'].map((label, i) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <span style={{ color: '#2A2A3A', margin: '0 10px', fontSize: 13 }}>|</span>}
              <span style={{ color: '#52526A', fontSize: 13, cursor: 'pointer' }}>{label}</span>
            </span>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 6,
            background: '#3D2EAA',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff',
          }}>
            MN
          </div>
          <span style={{ color: '#52526A', fontSize: 12 }}>Support</span>
          <span style={{ color: '#2A2A3A' }}>|</span>
          <span style={{ color: '#A0A0B8', fontSize: 12 }}>marc.nicasi@lineas.net</span>
        </div>
      </div>

      {/* Filter row */}
      <div style={{
        height: 44,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 12,
      }}>
        {panelMode === 'dashboard' ? (
          <>
            {/* Asset label */}
            <span style={{ color: '#C4C4D4', fontSize: 12, fontWeight: 600 }}>Asset</span>

            {/* Separator */}
            <span style={{ width: 1, height: 16, background: '#2A2A3C', display: 'inline-block' }} />

            {/* Anomalous Patterns */}
            <span style={{ color: '#52526A', fontSize: 12, fontWeight: 600 }}>Anomalous Patterns</span>

            {/* New badge (no border) */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                background: 'rgba(255,106,0,0.20)',
                color: '#FF6A00',
                fontFamily: 'Roboto, sans-serif',
                fontSize: 11,
                fontWeight: 500,
                lineHeight: '14px',
                padding: '0 5px 1px 5px',
                borderRadius: 4,
              }}>New</span>
              <span style={{ color: '#52526A', fontSize: 12 }}>({newCount})</span>
            </span>

            {/* Ongoing badge (no border) */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                background: 'rgba(139,106,255,0.20)',
                color: '#8B6AFF',
                fontFamily: 'Roboto, sans-serif',
                fontSize: 11,
                fontWeight: 500,
                lineHeight: '14px',
                padding: '0 5px 1px 5px',
                borderRadius: 4,
              }}>Ongoing</span>
              <span style={{ color: '#52526A', fontSize: 12 }}>({ongoingCount})</span>
            </span>
          </>
        ) : (
          <>
            <MultiSelectDropdown
              label="ASSET"
              placeholder="All assets"
              options={assets.map(a => ({ id: a.id, name: a.label }))}
              selected={inspectAssetIds}
              onToggle={id => {
                const next = inspectAssetIds.includes(id)
                  ? inspectAssetIds.filter(x => x !== id)
                  : [...inspectAssetIds, id]
                onSetInspectAssetIds?.(next)
              }}
              onClear={() => onSetInspectAssetIds?.([])}
            />
            <MultiSelectDropdown
              label="FAULT CODES"
              placeholder="All codes"
              options={faultCodes.map(fc => ({ id: fc.code, name: fc.code, sub: fc.description }))}
              selected={inspectFaultCodes}
              onToggle={code => {
                const next = inspectFaultCodes.includes(code)
                  ? inspectFaultCodes.filter(x => x !== code)
                  : [...inspectFaultCodes, code]
                onSetInspectFaultCodes?.(next)
              }}
              onClear={() => onSetInspectFaultCodes?.([])}
            />

            {/* Period navigator */}
            {inspectStart && inspectEnd && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => onNavigateInspect?.(-1)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #2A2A3C',
                    borderRadius: 6,
                    color: '#8A8AB0',
                    fontSize: 13,
                    width: 28, height: 28,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >◀</button>
                <span style={{
                  color: '#C4C4D4',
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '0 8px',
                  minWidth: 160,
                  textAlign: 'center',
                }}>
                  {formatPeriodLabel(inspectStart, inspectEnd)}
                </span>
                <button
                  onClick={() => onNavigateInspect?.(1)}
                  disabled={inspectEnd >= todayISO()}
                  style={{
                    background: 'transparent',
                    border: '1px solid #2A2A3C',
                    borderRadius: 6,
                    color: inspectEnd >= todayISO() ? '#2A2A3C' : '#8A8AB0',
                    fontSize: 13,
                    width: 28, height: 28,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: inspectEnd >= todayISO() ? 'default' : 'pointer',
                    padding: 0,
                  }}
                >▶</button>
              </div>
            )}
          </>
        )}

        <div style={{ flex: 1 }} />

        {/* Dashboard / Inspect toggle */}
        <div style={{
          display: 'flex',
          paddingRight: 15,
          alignItems: 'center',
          gap: 10,
          borderRadius: 38,
          border: '1px solid #848EA0',
        }}>
          {(['dashboard', 'inspect'] as PanelMode[]).map((m) => {
            const selected = panelMode === m
            const label = m === 'dashboard' ? 'Dashboard' : 'Inspect'
            return (
              <button
                key={m}
                onClick={() => onSetPanelMode(m)}
                style={{
                  background: selected ? '#fff' : 'transparent',
                  border: 'none',
                  borderRadius: 38,
                  color: selected ? '#000' : '#C1C8D3',
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: 11,
                  fontWeight: 700,
                  fontStyle: 'normal',
                  lineHeight: 'normal',
                  textAlign: 'center',
                  padding: '6px 14px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface MultiSelectOption {
  id: string
  name: string
  sub?: string
}

function MultiSelectDropdown({ label, placeholder, options, selected, onToggle, onClear }: {
  label: string
  placeholder: string
  options: MultiSelectOption[]
  selected: string[]
  onToggle: (id: string) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const displayText = selected.length === 0
    ? placeholder
    : selected.length === 1
      ? (options.find(o => o.id === selected[0])?.name ?? '1 selected')
      : `${selected.length} selected`

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          background: open ? '#1E1E2E' : '#1A1A26',
          border: `1px solid ${open ? '#6C4BF5' : selected.length > 0 ? '#4A3A8A' : '#2A2A3C'}`,
          borderRadius: 6,
          padding: '4px 12px',
          minWidth: 160,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 10, color: '#52526A', fontWeight: 600, letterSpacing: '0.06em' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, color: selected.length > 0 ? '#C4C4D4' : '#8A8AB0', flex: 1 }}>{displayText}</span>
          {selected.length > 0 && (
            <span
              onClick={e => { e.stopPropagation(); onClear() }}
              style={{ color: '#52526A', fontSize: 11, cursor: 'pointer', lineHeight: 1 }}
              title="Clear"
            >✕</span>
          )}
          <span style={{ color: '#52526A', fontSize: 11 }}>▾</span>
        </div>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 200,
          background: '#1A1A26', border: '1px solid #2A2A3C', borderRadius: 6,
          minWidth: 220, maxHeight: 260, overflowY: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {options.map(opt => {
            const checked = selected.includes(opt.id)
            return (
              <div
                key={opt.id}
                onClick={() => onToggle(opt.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', cursor: 'pointer',
                  background: checked ? 'rgba(108,75,245,0.08)' : 'transparent',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = checked ? 'rgba(108,75,245,0.14)' : 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = checked ? 'rgba(108,75,245,0.08)' : 'transparent')}
              >
                <div style={{
                  width: 14, height: 14, flexShrink: 0,
                  border: `1px solid ${checked ? '#6C4BF5' : '#3A3A4C'}`,
                  borderRadius: 3,
                  background: checked ? '#6C4BF5' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {checked && <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>✓</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: 13, color: '#C4C4D4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.name}</span>
                  {opt.sub && (
                    <span style={{ fontSize: 11, color: '#52526A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.sub}</span>
                  )}
                </div>
              </div>
            )
          })}
          {options.length === 0 && (
            <div style={{ padding: '12px', color: '#52526A', fontSize: 13 }}>No options</div>
          )}
        </div>
      )}
    </div>
  )
}
