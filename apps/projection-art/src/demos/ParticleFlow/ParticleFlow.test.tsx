import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ParticleFlow } from './ParticleFlow'

// p5는 동적 import를 사용하므로 모킹
vi.mock('p5', () => ({
  default: vi.fn().mockImplementation((_sketch: unknown, _container: unknown) => ({
    remove: vi.fn(),
  })),
}))

describe('ParticleFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('마운트 시 컨테이너 div를 렌더링한다', () => {
    render(<ParticleFlow />)
    expect(screen.getByTestId('particle-flow')).toBeInTheDocument()
  })

  it('컨테이너는 전체화면 포지셔닝 스타일을 가진다', () => {
    render(<ParticleFlow />)
    const container = screen.getByTestId('particle-flow')
    expect(container).toHaveStyle({ position: 'absolute' })
  })

  it('mousePos props를 받아 에러 없이 렌더링한다', () => {
    const mousePos = { x: 100, y: 200, nx: 0.5, ny: 0.5 }
    expect(() => render(<ParticleFlow mousePos={mousePos} />)).not.toThrow()
  })

  it('언마운트 시 에러가 발생하지 않는다', () => {
    const { unmount } = render(<ParticleFlow />)
    expect(() => unmount()).not.toThrow()
  })

  it('mousePos 없이도 정상 렌더링된다', () => {
    expect(() => render(<ParticleFlow />)).not.toThrow()
  })
})
