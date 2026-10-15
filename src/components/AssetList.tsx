import { ChevronUp, ChevronDown } from 'lucide-react'
import { useStore } from '../store/index'
import type { FaultCode } from '../data/types'

export interface VirtualRow {
  type: 'asset' | 'code' | 'separator'
  key: string
  assetId: string
  assetLabel: string
  faultCode?: string
  faultCodeDesc?: string
  isHidden: boolean
  height: number
  start: number
  index: number
}

interface AssetListProps {
  rows: VirtualRow[]
  totalHeight: number
  faultCodeMap: Map<string, FaultCode>
}

export function AssetList({ rows, totalHeight, faultCodeMap }: AssetListProps) {
  const { collapsedAssets, toggleCollapsedAsset } = useStore()

  return (
    <div style={{ position: 'relative', height: totalHeight, width: 420, background: '#000000' }}>
      {rows.map((row) => {
        if (row.type === 'separator') {
          return (
            <div
              key={row.key}
              style={{
                position: 'absolute',
                top: row.start,
                left: 0,
                width: 420,
                height: row.height,
                background: '#0B0B0C',
              }}
            />
          )
        }

        if (row.type === 'asset') {
          const isCollapsed = collapsedAssets.includes(row.assetId)
          return (
            <div
              key={row.key}
              style={{
                position: 'absolute',
                top: row.start,
                left: 0,
                width: 420,
                height: row.height,
                background: '#000000',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                userSelect: 'none',
              }}
              onClick={() => toggleCollapsedAsset(row.assetId)}
            >
              {/* Chevron */}
              <div style={{ width: 24, display: 'flex', justifyContent: 'center', marginLeft: 4 }}>
                {isCollapsed
                  ? <ChevronDown size={14} color="#A1A1AA" />
                  : <ChevronUp size={14} color="#A1A1AA" />}
              </div>
              {/* Accent bar */}
              <div style={{ width: 6, height: 36, background: '#6C4BF5', borderRadius: 3, marginLeft: 22, flexShrink: 0 }} />
              {/* Label */}
              <span style={{ marginLeft: 12, fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>
                {row.assetLabel}
              </span>
            </div>
          )
        }

        // fault code row
        const fc = faultCodeMap.get(row.faultCode ?? '')
        return (
          <div
            key={row.key}
            style={{
              position: 'absolute',
              top: row.start,
              left: 0,
              width: 420,
              height: row.height,
              background: '#0B0B0C',
              display: 'flex',
              alignItems: 'center',
              opacity: row.isHidden ? 0.35 : 1,
            }}
          >
            {/* Badge */}
            <div
              style={{
                marginLeft: 72,
                background: '#1C1C1E',
                border: row.isHidden ? 'none' : '1px solid #3A3A3C',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 15,
                fontWeight: 700,
                color: row.isHidden ? '#A1A1AA' : '#FFFFFF',
                minWidth: 72,
                textAlign: 'center',
                flexShrink: 0,
              }}
            >
              {row.faultCode}
            </div>
            {/* Description */}
            <span
              style={{
                marginLeft: 12,
                fontSize: 14,
                color: '#A1A1AA',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 220,
              }}
              title={fc?.description}
            >
              {fc?.description}
            </span>
          </div>
        )
      })}
    </div>
  )
}
