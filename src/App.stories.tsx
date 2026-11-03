import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { userEvent, within } from 'storybook/test'
import App from './App'
import { useStore } from './store/index'

const meta = {
  component: App,
  tags: ['ai-generated'],
  parameters: {
    layout: 'fullscreen',
  },
  beforeEach: () => {
    useStore.setState({ data: null, loadingState: 'loading', selectedAssetId: null })
  },
} satisfies Meta<typeof App>

export default meta
type Story = StoryObj<typeof meta>

export const Dashboard: Story = {
  play: async ({ canvas }) => {
    const asset = await canvas.findByText('485 001', {}, { timeout: 5000 })
    await expect(asset).toBeVisible()
    await expect(canvas.queryByText('Dashboard')).toBeTruthy()
  },
}

export const Inspect: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText('485 001', {}, { timeout: 5000 })
    await userEvent.click(canvas.getByText('Inspect'))
    await expect(canvas.getByText('Inspect')).toBeVisible()
  },
}
