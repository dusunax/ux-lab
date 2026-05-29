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

  it('3개의 데모 버튼이 표시된다', () => {
    render(<App />)
    expect(screen.getByTestId('demo-btn-particle-flow')).toBeInTheDocument()
    expect(screen.getByTestId('demo-btn-neon-tunnel')).toBeInTheDocument()
    expect(screen.getByTestId('demo-btn-audio-reactive')).toBeInTheDocument()
  })

  it('전체화면 버튼이 존재한다', () => {
    render(<App />)
    expect(screen.getByTestId('fullscreen-btn')).toBeInTheDocument()
  })

  it('데모 버튼 클릭 시 에러가 발생하지 않는다', () => {
    render(<App />)
    expect(() => fireEvent.click(screen.getByTestId('demo-btn-neon-tunnel'))).not.toThrow()
    expect(() => fireEvent.click(screen.getByTestId('demo-btn-audio-reactive'))).not.toThrow()
    expect(() => fireEvent.click(screen.getByTestId('demo-btn-particle-flow'))).not.toThrow()
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
})
