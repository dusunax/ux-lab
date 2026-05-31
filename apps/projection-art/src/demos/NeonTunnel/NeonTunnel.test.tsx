import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NeonTunnel } from './NeonTunnel'

// @react-three/fiber Canvas는 WebGL을 사용하므로 모킹
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useFrame: vi.fn(),
}))

vi.mock('@react-three/drei', () => ({
  Torus: ({ children }: { children?: React.ReactNode }) => (
    <mesh data-testid="torus">{children}</mesh>
  ),
  Stars: () => <mesh data-testid="stars" />,
}))

describe('NeonTunnel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('마운트 시 컨테이너를 렌더링한다', () => {
    render(<NeonTunnel />)
    expect(screen.getByTestId('neon-tunnel')).toBeInTheDocument()
  })

  it('R3F Canvas가 렌더링된다', () => {
    render(<NeonTunnel />)
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument()
  })

  it('mousePos props를 받아 에러 없이 렌더링한다', () => {
    const mousePos = { x: 300, y: 400, nx: 0.3, ny: 0.4 }
    expect(() => render(<NeonTunnel mousePos={mousePos} />)).not.toThrow()
  })

  it('언마운트 시 에러가 발생하지 않는다', () => {
    const { unmount } = render(<NeonTunnel />)
    expect(() => unmount()).not.toThrow()
  })

  it('컨테이너는 전체화면 포지셔닝 스타일을 가진다', () => {
    render(<NeonTunnel />)
    const container = screen.getByTestId('neon-tunnel')
    expect(container).toHaveStyle({ position: 'absolute' })
  })
})
