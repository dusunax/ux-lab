import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AudioReactiveVisual } from './AudioReactiveVisual'

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useFrame: vi.fn(),
}))

vi.mock('../../hooks/useAudioAnalyzer', () => ({
  useAudioAnalyzer: vi.fn(() => ({
    state: {
      isActive: false,
      frequencyData: new Uint8Array(1024),
      averageAmplitude: 0,
      bassAmplitude: 0,
      midAmplitude: 0,
      trebleAmplitude: 0,
    },
    activate: vi.fn().mockResolvedValue(undefined),
    deactivate: vi.fn(),
  })),
}))

describe('AudioReactiveVisual', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('마운트 시 컨테이너를 렌더링한다', () => {
    render(<AudioReactiveVisual />)
    expect(screen.getByTestId('audio-reactive-visual')).toBeInTheDocument()
  })

  it('비활성 상태에서 시작 버튼이 표시된다', () => {
    render(<AudioReactiveVisual />)
    expect(screen.getByTestId('start-button')).toBeInTheDocument()
  })

  it('오디오 소스 선택 드롭다운이 표시된다', () => {
    render(<AudioReactiveVisual />)
    expect(screen.getByTestId('source-select')).toBeInTheDocument()
  })

  it('소스 선택이 file과 microphone 옵션을 가진다', () => {
    render(<AudioReactiveVisual />)
    const select = screen.getByTestId('source-select') as HTMLSelectElement
    const options = Array.from(select.options).map(o => o.value)
    expect(options).toContain('file')
    expect(options).toContain('microphone')
  })

  it('시작 버튼 클릭 시 에러 없이 동작한다', async () => {
    render(<AudioReactiveVisual />)
    const startBtn = screen.getByTestId('start-button')
    expect(() => fireEvent.click(startBtn)).not.toThrow()
  })

  it('mousePos props를 받아 에러 없이 렌더링한다', () => {
    const mousePos = { x: 500, y: 300, nx: 0.5, ny: 0.3 }
    expect(() => render(<AudioReactiveVisual mousePos={mousePos} />)).not.toThrow()
  })

  it('언마운트 시 에러가 발생하지 않는다', () => {
    const { unmount } = render(<AudioReactiveVisual />)
    expect(() => unmount()).not.toThrow()
  })

  it('R3F Canvas가 렌더링된다', () => {
    render(<AudioReactiveVisual />)
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument()
  })

  it('소스를 microphone으로 변경할 수 있다', () => {
    render(<AudioReactiveVisual />)
    const select = screen.getByTestId('source-select') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'microphone' } })
    expect(select.value).toBe('microphone')
  })
})
