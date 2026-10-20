import type { Asset, Pattern, DerivedStatus } from '../data/types'

interface Props {
  assets: Asset[]
  patterns: Pattern[]
  selectedAssetId: string | null
  showNew: boolean
  showOngoing: boolean
  deriveStatus: (p: Pattern) => DerivedStatus
  onSelect: (id: string) => void
  onToggleNew: () => void
  onToggleOngoing: () => void
  sidebarWidth: number
}

export function AssetSidebar({
  assets, patterns, selectedAssetId, showNew, showOngoing,
  deriveStatus, onSelect, onToggleNew, onToggleOngoing, sidebarWidth,
}: Props) {
  function countFor(assetId: string, status: DerivedStatus) {
    return patterns.filter(p => p.assetId === assetId && deriveStatus(p) === status).length
  }

  return (
    <div style={{
      width: sidebarWidth,
      background: '#0C0C14',
      borderRight: '1px solid #1E1E28',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Filter toggles — top of sidebar, mirroring mockup */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #1A1A22',
        display: 'flex',
        gap: 14,
        flexShrink: 0,
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
          <Checkbox checked={showNew} onChange={onToggleNew} color="#E8394A" />
          <span style={{ fontSize: 12, color: showNew ? '#E8394A' : '#42424E', fontWeight: 600 }}>New</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
          <Checkbox checked={showOngoing} onChange={onToggleOngoing} color="#D97010" />
          <span style={{ fontSize: 12, color: showOngoing ? '#D97010' : '#42424E', fontWeight: 600 }}>Ongoing</span>
        </label>
      </div>

      {/* Asset list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {assets.map((asset) => {
          const newCount = countFor(asset.id, 'new')
          const ongoingCount = countFor(asset.id, 'ongoing')
          const isSelected = asset.id === selectedAssetId

          return (
            <button
              key={asset.id}
              onClick={() => onSelect(asset.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 5,
                width: '100%',
                padding: '8px 10px',
                background: isSelected ? 'rgba(90,60,220,0.30)' : 'transparent',
                border: isSelected ? '1px solid rgba(108,75,245,0.5)' : '1px solid transparent',
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'left',
                boxSizing: 'border-box',
              }}
            >
              <span style={{ color: isSelected ? '#FFFFFF' : '#B0B0CC', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                {asset.label}
              </span>
              {(newCount > 0 || ongoingCount > 0) && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {newCount > 0 && (
                    <span style={{
                      background: '#C4223A', color: '#FFD0D8',
                      fontSize: 10, fontWeight: 700, padding: '2px 7px',
                      borderRadius: 10, whiteSpace: 'nowrap',
                    }}>
                      {newCount} new
                    </span>
                  )}
                  {ongoingCount > 0 && (
                    <span style={{
                      background: '#B55A08', color: '#FFD8A8',
                      fontSize: 10, fontWeight: 700, padding: '2px 7px',
                      borderRadius: 10, whiteSpace: 'nowrap',
                    }}>
                      {ongoingCount} ongoing
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Checkbox({ checked, onChange, color }: { checked: boolean; onChange: () => void; color: string }) {
  return (
    <div onClick={onChange} style={{
      width: 13, height: 13, borderRadius: 3,
      border: `2px solid ${checked ? color : '#2A2A3A'}`,
      background: checked ? color : 'transparent',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {checked && (
        <svg width={7} height={5} viewBox="0 0 7 5" fill="none">
          <path d="M1 2.5l1.5 1.5 3.5-3.5" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}
