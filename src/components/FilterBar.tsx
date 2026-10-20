import type { ViewMode } from '../data/types'

interface Props {
  view: ViewMode
  onSetView: (v: ViewMode) => void
  onSimulateSession: () => void
}

const VIEWS: ViewMode[] = ['3D', '1W', '1M']

export default function FilterBar({ view, onSetView, onSimulateSession }: Props) {
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
        {/* Asset dropdown (cosmetic) */}
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          background: '#1A1A26', border: '1px solid #2A2A3C', borderRadius: 6,
          padding: '4px 12px', minWidth: 160, cursor: 'pointer',
        }}>
          <span style={{ fontSize: 10, color: '#52526A', fontWeight: 600, letterSpacing: '0.06em' }}>ASSET</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#8A8AB0' }}>Select...</span>
            <span style={{ color: '#52526A', fontSize: 11, marginLeft: 'auto' }}>▾</span>
          </div>
        </div>

        {/* Fault codes dropdown (cosmetic) */}
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          background: '#1A1A26', border: '1px solid #2A2A3C', borderRadius: 6,
          padding: '4px 12px', minWidth: 160, cursor: 'pointer',
        }}>
          <span style={{ fontSize: 10, color: '#52526A', fontWeight: 600, letterSpacing: '0.06em' }}>FAULT CODES</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#8A8AB0' }}>All</span>
            <span style={{ color: '#52526A', fontSize: 11, marginLeft: 'auto' }}>▾</span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Simulate session */}
        <button
          onClick={onSimulateSession}
          title="Simulate opening the app in a new session"
          style={{
            background: 'rgba(108,75,245,0.12)',
            border: '1px solid rgba(108,75,245,0.35)',
            borderRadius: 6,
            color: '#8B6EF5',
            fontSize: 11,
            fontWeight: 600,
            padding: '6px 14px',
            cursor: 'pointer',
          }}
        >
          Simulate new session
        </button>

        {/* View selector */}
        <div style={{ display: 'flex', background: '#1A1A26', borderRadius: 6, overflow: 'hidden', border: '1px solid #2A2A3C' }}>
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => onSetView(v)}
              style={{
                background: view === v ? '#6C4BF5' : 'transparent',
                border: 'none',
                color: view === v ? '#FFFFFF' : '#52526A',
                fontSize: 13,
                fontWeight: 700,
                padding: '6px 18px',
                cursor: 'pointer',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
