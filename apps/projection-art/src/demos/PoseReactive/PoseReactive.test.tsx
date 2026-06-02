import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PoseReactive } from './PoseReactive'

vi.mock('../../hooks/useMotionTracker', () => ({
  useMotionTracker: () => ({
    state: { status: 'idle', hands: [] },
    requestCamera: vi.fn(),
  }),
}))

vi.mock('../../hooks/useAiVisualParams', () => ({
  useAiVisualParams: () => ({
    params: {
      primaryColor: '#ff0000',
      accentColor: '#00ff00',
      particleDensity: 0.5,
      effectIntensity: 0.5,
      trailLength: 40,
    },
    isLoading: false,
  }),
}))

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
  useFrame: vi.fn(),
  useThree: () => ({ viewport: { width: 10, height: 8 } }),
}))

vi.mock('../../components/WebcamPermission', () => ({
  WebcamPermission: ({ status }: { status: string }) => (
    <div data-testid="webcam-permission">{status}</div>
  ),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PoseReactive', () => {
  it('shows WebcamPermission overlay when status is idle', () => {
    render(<PoseReactive />)
    expect(screen.getByTestId('webcam-permission')).toBeInTheDocument()
  })

  it('renders canvas element', () => {
    render(<PoseReactive />)
    expect(screen.getByTestId('canvas')).toBeInTheDocument()
  })
})

describe('PoseReactive active state', () => {
  it('shows pose status when active', () => {
    vi.doMock('../../hooks/useMotionTracker', () => ({
      useMotionTracker: () => ({
        state: { status: 'active', hands: [] },
        requestCamera: vi.fn(),
      }),
    }))
  })
})
