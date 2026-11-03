import type { Asset, Pattern, DerivedStatus } from '../data/types'

interface Props {
  assets: Asset[]
  patterns: Pattern[]
  selectedAssetId: string | null
  deriveStatus: (p: Pattern) => DerivedStatus
  onSelect: (id: string) => void
  sidebarWidth: number
}

export function AssetSidebar({
  assets, patterns, selectedAssetId,
  deriveStatus, onSelect, sidebarWidth,
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
                justifyContent: 'center',
                alignItems: 'flex-start',
                alignSelf: 'stretch',
                gap: 2,
                width: '100%',
                padding: '4px 4px 4px 9px',
                background: '#000',
                border: isSelected ? '2px solid #FFF' : '2px solid #000',
                borderRadius: 12,
                cursor: 'pointer',
                textAlign: 'left',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ color: isSelected ? '#FFFFFF' : '#B0B0CC', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {asset.label}
                </span>
                {newCount > 0 && (
                  <span style={{
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10,
                    padding: '0 5px 1px 5px',
                    borderRadius: 4,
                    border: '1px solid rgba(255, 106, 0, 0.19)',
                    background: 'rgba(255, 106, 0, 0.20)',
                    color: '#FF6A00',
                    fontFamily: 'Roboto', fontSize: 11, fontWeight: 500, lineHeight: '14px', whiteSpace: 'nowrap',
                  }}>
                    {newCount} new
                  </span>
                )}
              </div>
              {ongoingCount > 0 && (
                <span style={{
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10,
                  padding: '0 5px 1px 5px',
                  borderRadius: 4,
                  border: '1px solid rgba(139, 106, 255, 0.19)',
                  background: 'rgba(139, 106, 255, 0.20)',
                  opacity: isSelected ? 1 : 0.5,
                  color: '#8B6AFF',
                  fontFamily: 'Roboto', fontSize: 11, fontWeight: 500, lineHeight: '14px', whiteSpace: 'nowrap',
                }}>
                  {ongoingCount} ongoing
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

