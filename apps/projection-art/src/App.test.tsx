import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

// Lazy-loaded 컴포넌트 모킹
vi.mock('./demos/ParticleFlow/ParticleFlow', () => ({
  ParticleFlow: () => <div data-testid="mock-particle-flow" />,
}))
vi.mock('./demos/NeonTunnel/NeonTunnel', () => ({
  NeonTunnel: () => <div data-testid="mock-neon-tunnel" />,
}))
vi.mock('./demos/AudioReactiveVisual/AudioReactiveVisual', () => ({
  AudioReactiveVisual: () => <div data-testid="mock-audio-reactive" />,
}))

describe('App', () => {
  it('앱 컨테이너를 렌더링한다', () => {
    render(<App />)
    expect(screen.getByTestId('app-container')).toBeInTheDocument()
  })

  it('데모 네비게이션이 존재한다', () => {
    render(<App />)
    expect(screen.getByTestId('demo-nav')).toBeInTheDocument()
  })

  it('데모 드롭다운이 표시된다', () => {
    render(<App />)
    expect(screen.getByTestId('demo-select')).toBeInTheDocument()
  })

  it('전체화면 버튼이 존재한다', () => {
    render(<App />)
    expect(screen.getByTestId('fullscreen-btn')).toBeInTheDocument()
  })

  it('FPS 토글 버튼이 존재한다', () => {
    render(<App />)
    expect(screen.getByTestId('fps-toggle-btn')).toBeInTheDocument()
  })

  it('데모 드롭다운 변경 시 에러가 발생하지 않는다', () => {
    render(<App />)
    const select = screen.getByTestId('demo-select')
    expect(() => fireEvent.change(select, { target: { value: 'neon-tunnel' } })).not.toThrow()
    expect(() => fireEvent.change(select, { target: { value: 'audio-reactive' } })).not.toThrow()
    expect(() => fireEvent.change(select, { target: { value: 'particle-flow' } })).not.toThrow()
  })

  it('마우스 이동 이벤트를 처리한다', () => {
    render(<App />)
    const container = screen.getByTestId('app-container')
    expect(() =>
      fireEvent.mouseMove(container, { clientX: 400, clientY: 300 })
    ).not.toThrow()
  })

  it('전체화면 버튼 클릭 시 에러가 발생하지 않는다', () => {
    render(<App />)
    expect(() => fireEvent.click(screen.getByTestId('fullscreen-btn'))).not.toThrow()
  })

  it('FPS 토글 버튼 클릭 시 에러가 발생하지 않는다', () => {
    render(<App />)
    expect(() => fireEvent.click(screen.getByTestId('fps-toggle-btn'))).not.toThrow()
  })

  it('FPS 오버레이는 초기에 숨겨져 있다', () => {
    render(<App />)
    // visible=false이면 FpsOverlay가 null 반환
    expect(screen.queryByTestId('fps-overlay')).not.toBeInTheDocument()
  })

  it('FPS 버튼 클릭 시 FPS 오버레이가 표시된다', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('fps-toggle-btn'))
    expect(screen.getByTestId('fps-overlay')).toBeInTheDocument()
  })
})
