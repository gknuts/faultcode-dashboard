import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { AssetSidebar } from './AssetSidebar'
import type { Asset, Pattern, DerivedStatus } from '../data/types'

const ASSETS: Asset[] = [
  { id: 'a1', label: 'Train 81' },
  { id: 'a2', label: 'Train 42' },
  { id: 'a3', label: 'Train 103' },
]

// a1: 2 new, 1 ongoing, 1 unclassified — a2: 1 new — a3: 1 ongoing
const PATTERNS: Pattern[] = [
  { id: 'p1', assetId: 'a1', faultCodes: ['FC001'], startDate: '2026-10-28' },
  { id: 'p2', assetId: 'a1', faultCodes: ['FC002'], startDate: '2026-10-29' },
  { id: 'p3', assetId: 'a1', faultCodes: ['FC003'], startDate: '2026-09-01' },
  { id: 'p4', assetId: 'a1', faultCodes: ['FC004'], startDate: '2026-09-05', endDate: '2026-10-01' },
  { id: 'p5', assetId: 'a2', faultCodes: ['FC001'], startDate: '2026-10-30' },
  { id: 'p6', assetId: 'a3', faultCodes: ['FC002'], startDate: '2026-09-10' },
]

function deriveStatus(p: Pattern): DerivedStatus {
  const sessionDate = '2026-10-27'
  if (p.startDate >= sessionDate) return 'new'
  const today = '2026-11-03'
  if (!p.endDate || p.endDate >= today) return 'ongoing'
  return 'unclassified'
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
    sidebarWidth: 200,
  },
} satisfies Meta<typeof AssetSidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Train 81')).toBeVisible()
    await expect(canvas.getByText('Train 42')).toBeVisible()
    const newBadges = canvas.getAllByText(/new/)
    await expect(newBadges.length).toBeGreaterThan(0)
    await expect(canvas.getByText(/ongoing/)).toBeVisible()
    await expect(canvas.getByText(/unclassified/)).toBeVisible()
  },
}

export const NoneSelected: Story = {
  args: { selectedAssetId: null },
}

