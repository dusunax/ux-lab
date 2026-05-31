import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FpsOverlay } from './FpsOverlay'
import type { FrameRateState } from '../hooks/useFrameRate'

const makeState = (overrides: Partial<FrameRateState> = {}): FrameRateState => ({
  fps: 60,
  avgFps: 58,
  minFps: 45,
  maxFps: 62,
  frameTime: 16.67,
  ...overrides,
})

describe('FpsOverlay', () => {
  it('visible=true이면 오버레이가 표시된다', () => {
    render(<FpsOverlay state={makeState()} visible />)
    expect(screen.getByTestId('fps-overlay')).toBeInTheDocument()
  })

  it('visible=false이면 렌더링되지 않는다', () => {
    render(<FpsOverlay state={makeState()} visible={false} />)
    expect(screen.queryByTestId('fps-overlay')).not.toBeInTheDocument()
  })

  it('FPS 값이 표시된다', () => {
    render(<FpsOverlay state={makeState({ fps: 60 })} />)
    expect(screen.getByTestId('fps-overlay')).toHaveTextContent('FPS')
  })

  it('minFps가 Infinity이면 "--"으로 표시된다', () => {
    render(<FpsOverlay state={makeState({ minFps: Infinity })} />)
    expect(screen.getByTestId('fps-overlay')).toHaveTextContent('--')
  })

  it('avgFps < 50이면 빨간색 border를 사용한다', () => {
    render(<FpsOverlay state={makeState({ avgFps: 30, fps: 30 })} />)
    const el = screen.getByTestId('fps-overlay')
    expect(el).toHaveStyle({ border: '1px solid #f44' })
  })

  it('avgFps >= 60이면 초록색 border를 사용한다', () => {
    render(<FpsOverlay state={makeState({ avgFps: 60, fps: 60 })} />)
    const el = screen.getByTestId('fps-overlay')
    expect(el).toHaveStyle({ border: '1px solid #0f0' })
  })

  it('frameTime이 표시된다', () => {
    render(<FpsOverlay state={makeState({ frameTime: 16.67 })} />)
    expect(screen.getByTestId('fps-overlay')).toHaveTextContent('16.67ms')
  })
})
