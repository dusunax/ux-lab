import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HandReactive } from './HandReactive'
import type { MousePosition } from '../../types'

// Mock useMotionTracker so we can control state
vi.mock('../../hooks/useMotionTracker', () => ({
  useMotionTracker: vi.fn(() => ({
    state: { status: 'idle', points: [] },
    requestCamera: vi.fn(),
    useFallback: vi.fn(),
  })),
}))

const mousePos: MousePosition = { x: 400, y: 300, nx: 0.5, ny: 0.5 }

describe('HandReactive', () => {
  it('mounts without error', () => {
    expect(() => render(<HandReactive mousePos={mousePos} />)).not.toThrow()
  })

  it('shows webcam permission overlay in idle state', () => {
    render(<HandReactive mousePos={mousePos} />)
    expect(screen.getByTestId('webcam-permission')).toBeInTheDocument()
  })

  it('shows active status indicator when tracking', async () => {
    const { useMotionTracker } = await import('../../hooks/useMotionTracker')
    vi.mocked(useMotionTracker).mockReturnValue({
      state: {
        status: 'active',
        points: Array.from({ length: 21 }, (_, i) => ({ x: i * 0.05, y: 0.5, id: `lm_${i}` })),
      },
      requestCamera: vi.fn(),
      useFallback: vi.fn(),
    })
    render(<HandReactive mousePos={mousePos} />)
    expect(screen.getByTestId('tracker-status')).toHaveTextContent('Hand tracking')
  })

  it('shows mouse fallback status when in fallback', async () => {
    const { useMotionTracker } = await import('../../hooks/useMotionTracker')
    vi.mocked(useMotionTracker).mockReturnValue({
      state: { status: 'fallback', points: [] },
      requestCamera: vi.fn(),
      useFallback: vi.fn(),
    })
    render(<HandReactive mousePos={mousePos} />)
    expect(screen.getByTestId('tracker-status')).toHaveTextContent('Mouse fallback')
  })
})
