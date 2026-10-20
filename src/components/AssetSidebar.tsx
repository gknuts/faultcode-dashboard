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
}

export function AssetSidebar({
  assets, patterns, selectedAssetId, showNew, showOngoing,
  deriveStatus, onSelect, onToggleNew, onToggleOngoing,
}: Props) {
  function countFor(assetId: string, status: DerivedStatus) {
    return patterns.filter(p => p.assetId === assetId && deriveStatus(p) === status).length
  }

  return (
    <div style={{ width: 220, background: '#0A0A0D', borderRight: '1px solid #1F1F22', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* New / Ongoing filter toggles */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #1F1F22', display: 'flex', gap: 14, flexShrink: 0 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
          <Checkbox checked={showNew} onChange={onToggleNew} color="#F0436A" />
          <span style={{ fontSize: 12, color: showNew ? '#F0436A' : '#52525B', fontWeight: 600 }}>New</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
          <Checkbox checked={showOngoing} onChange={onToggleOngoing} color="#F97316" />
          <span style={{ fontSize: 12, color: showOngoing ? '#F97316' : '#52525B', fontWeight: 600 }}>Ongoing</span>
        </label>
      </div>

      {/* Asset list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
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
                gap: 4,
                width: '100%',
                padding: '8px 14px',
                background: isSelected ? 'rgba(108,75,245,0.18)' : 'transparent',
                border: 'none',
                borderLeft: isSelected ? '3px solid #7C5CF6' : '3px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                boxSizing: 'border-box',
              }}
            >
              <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {asset.label}
              </span>
              {(newCount > 0 || ongoingCount > 0) && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {newCount > 0 && (
                    <span style={{
                      background: 'rgba(240,67,106,0.2)', color: '#F0436A',
                      fontSize: 10, fontWeight: 700, padding: '1px 6px',
                      borderRadius: 10, border: '1px solid rgba(240,67,106,0.4)',
                      whiteSpace: 'nowrap',
                    }}>
                      {newCount} new
                    </span>
                  )}
                  {ongoingCount > 0 && (
                    <span style={{
                      background: 'rgba(249,115,22,0.15)', color: '#F97316',
                      fontSize: 10, fontWeight: 700, padding: '1px 6px',
                      borderRadius: 10, border: '1px solid rgba(249,115,22,0.35)',
                      whiteSpace: 'nowrap',
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
    <div
      onClick={onChange}
      style={{
        width: 13, height: 13, borderRadius: 3,
        border: `2px solid ${checked ? color : '#3F3F46'}`,
        background: checked ? color : 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}
    >
      {checked && (
        <svg width={7} height={5} viewBox="0 0 7 5" fill="none">
          <path d="M1 2.5l1.5 1.5 3.5-3.5" stroke="#000" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}
