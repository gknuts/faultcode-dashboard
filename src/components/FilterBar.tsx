import type { ViewMode } from '../data/types'

interface Props {
  view: ViewMode
  onSetView: (v: ViewMode) => void
  onSimulateSession: () => void
}

const VIEWS: ViewMode[] = ['3D', '1W', '1M']

export default function FilterBar({ view, onSetView, onSimulateSession }: Props) {
  return (
    <div style={{
      height: 48,
      background: '#0A0A0D',
      borderBottom: '1px solid #1F1F22',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 12,
      flexShrink: 0,
    }}>
      <div style={{ flex: 1 }} />

      <button
        onClick={onSimulateSession}
        title="Mark all current patterns as seen — simulates opening the app in a new session"
        style={{
          background: 'rgba(108,75,245,0.15)',
          border: '1px solid rgba(108,75,245,0.4)',
          borderRadius: 6,
          color: '#9B7DFF',
          fontSize: 11,
          fontWeight: 600,
          padding: '5px 12px',
          cursor: 'pointer',
        }}
      >
        Simulate new session
      </button>

      <div style={{ display: 'flex', background: '#18181C', borderRadius: 6, padding: 2, border: '1px solid #2A2A2E' }}>
        {VIEWS.map((v) => (
          <button
            key={v}
            onClick={() => onSetView(v)}
            style={{
              background: view === v ? '#2A2A2E' : 'transparent',
              border: 'none',
              borderRadius: 4,
              color: view === v ? '#FFFFFF' : '#71717A',
              fontSize: 12,
              fontWeight: 600,
              padding: '4px 12px',
              cursor: 'pointer',
            }}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}
