import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { AssetSidebar } from './AssetSidebar'
import type { Asset, Pattern } from '../data/types'

const ASSETS: Asset[] = [
  { id: 'a1', label: 'Train 81' },
  { id: 'a2', label: 'Train 42' },
  { id: 'a3', label: 'Train 103' },
]

const PATTERNS: Pattern[] = [
  { id: 'p1', assetId: 'a1', faultCodes: ['FC001'], startDate: '2026-10-20' },
  { id: 'p2', assetId: 'a1', faultCodes: ['FC002'], startDate: '2026-09-01' },
  { id: 'p3', assetId: 'a2', faultCodes: ['FC003'], startDate: '2026-10-28' },
]

function deriveStatus(p: Pattern) {
  if (p.endDate) return 'resolved' as const
  return p.startDate >= '2026-10-15' ? 'new' as const : 'ongoing' as const
}

const meta = {
  component: AssetSidebar,
  tags: ['ai-generated'],
  args: {
    assets: ASSETS,
    patterns: PATTERNS,
    selectedAssetId: 'a1',
    deriveStatus,
    onSelect: () => {},
    sidebarWidth: 210,
  },
} satisfies Meta<typeof AssetSidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Train 81')).toBeVisible()
    await expect(canvas.getByText('Train 42')).toBeVisible()
    const newBadge = canvas.getAllByText(/new/)
    await expect(newBadge.length).toBeGreaterThan(0)
  },
}

export const NoneSelected: Story = {
  args: { selectedAssetId: null },
}

