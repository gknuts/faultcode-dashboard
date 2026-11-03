import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import App from './App'
import { useStore } from './store/index'

const meta = {
  component: App,
  tags: ['ai-generated'],
  parameters: {
    layout: 'fullscreen',
  },
  beforeEach: () => {
    // Reset store so each story mount triggers a fresh data load
    useStore.setState({ data: null, loadingState: 'loading', selectedAssetId: null })
  },
} satisfies Meta<typeof App>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    // Wait for data to load — first asset label appears once fetch resolves
    const asset = await canvas.findByText('485 001', {}, { timeout: 5000 })
    await expect(asset).toBeVisible()
  },
}
