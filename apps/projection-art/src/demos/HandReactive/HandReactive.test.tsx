import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HandReactive } from './HandReactive'

vi.mock('../../hooks/useMotionTracker', () => ({
  useMotionTracker: vi.fn(() => ({
    state: { status: 'idle', hands: [] },
    requestCamera: vi.fn(),
  })),
}))

describe('HandReactive', () => {
  it('mounts without error', () => {
    expect(() => render(<HandReactive />)).not.toThrow()
  })

  it('shows webcam permission overlay in idle state', () => {
    render(<HandReactive />)
    expect(screen.getByTestId('webcam-permission')).toBeInTheDocument()
  })

  it('shows active status indicator and hand-mode buttons when tracking', async () => {
    const { useMotionTracker } = await import('../../hooks/useMotionTracker')
    vi.mocked(useMotionTracker).mockReturnValue({
      state: {
        status: 'active',
        hands: [Array.from({ length: 21 }, (_, i) => ({ x: i * 0.05, y: 0.5, id: `lm_${i}` }))],
      },
      requestCamera: vi.fn(),
    })
    render(<HandReactive />)
    expect(screen.getByTestId('tracker-status')).toHaveTextContent('Hand tracking')
    expect(screen.getByTestId('hand-mode-1')).toBeInTheDocument()
    expect(screen.getByTestId('hand-mode-2')).toBeInTheDocument()
  })

  it('shows webcam permission overlay in error state (no fallback)', async () => {
    const { useMotionTracker } = await import('../../hooks/useMotionTracker')
    vi.mocked(useMotionTracker).mockReturnValue({
      state: { status: 'error', hands: [], error: 'Permission denied' },
      requestCamera: vi.fn(),
    })
    render(<HandReactive />)
    expect(screen.getByTestId('webcam-permission')).toBeInTheDocument()
    expect(screen.queryByTestId('tracker-status')).not.toBeInTheDocument()
  })
})
