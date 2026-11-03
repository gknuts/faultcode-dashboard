import { useState } from 'react'
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
  const [search, setSearch] = useState('')

  function countFor(assetId: string, status: DerivedStatus) {
    return patterns.filter(p => p.assetId === assetId && deriveStatus(p) === status).length
  }

  const filteredAssets = search.trim()
    ? assets.filter(a => a.label.toLowerCase().includes(search.toLowerCase()))
    : assets

  return (
    <div style={{
      width: sidebarWidth,
      background: '#151515',
      borderRight: '1px solid #1E1E28',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Search box */}
      <div style={{ padding: '8px 8px 4px 8px', flexShrink: 0 }}>
        <div style={{
          display: 'flex',
          width: '100%',
          height: 28,
          padding: '5px 10px',
          alignItems: 'center',
          gap: 8,
          borderRadius: 32,
          border: '1px solid #3C3C3C',
          boxSizing: 'border-box',
        }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search"
            className="asset-search"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontFamily: 'Roboto',
              fontSize: 12,
              fontWeight: 500,
              lineHeight: '16px',
              minWidth: 0,
            }}
          />
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <path d="M11.3335 11.3334L14.0002 14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="white" strokeOpacity="0.3"/>
            <path d="M2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667C8.80867 12.6667 10.1441 12.0677 11.1096 11.0995C12.0718 10.1348 12.6667 8.80353 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="white" strokeOpacity="0.3"/>
          </svg>
        </div>
      </div>

      {/* Asset list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {filteredAssets.map((asset) => {
          const newCount = countFor(asset.id, 'new')
          const ongoingCount = countFor(asset.id, 'ongoing')
          const unclassifiedCount = countFor(asset.id, 'unclassified')
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
                <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
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
              {unclassifiedCount > 0 && (
                <span style={{
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10,
                  padding: '0 5px 1px 5px',
                  borderRadius: 4,
                  border: '1px solid rgba(82, 82, 91, 0.25)',
                  background: 'rgba(82, 82, 91, 0.15)',
                  opacity: isSelected ? 1 : 0.5,
                  color: '#71717A',
                  fontFamily: 'Roboto', fontSize: 11, fontWeight: 500, lineHeight: '14px', whiteSpace: 'nowrap',
                }}>
                  {unclassifiedCount} unclassified
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

