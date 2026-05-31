import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AudioReactiveVisual } from './AudioReactiveVisual'

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useFrame: vi.fn(),
}))

const mockActivate = vi.fn().mockResolvedValue(undefined)
const mockDeactivate = vi.fn()

const baseAudioData = {
  frequencyData: new Uint8Array(1024),
  timeDomainData: new Uint8Array(2048),
  averageAmplitude: 0,
  bassAmplitude: 0,
  midAmplitude: 0,
  trebleAmplitude: 0,
  isVoiceActive: false,
}

const mockUseAudioAnalyzer = vi.fn(() => ({
  isActive: false,
  isVoiceActive: false,
  audioDataRef: { current: baseAudioData },
  activate: mockActivate,
  deactivate: mockDeactivate,
}))

vi.mock('../../hooks/useAudioAnalyzer', () => ({
  useAudioAnalyzer: () => mockUseAudioAnalyzer(),
}))

describe('AudioReactiveVisual', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAudioAnalyzer.mockReturnValue({
      isActive: false,
      isVoiceActive: false,
      audioDataRef: { current: baseAudioData },
      activate: mockActivate,
      deactivate: mockDeactivate,
    })
  })

  it('컨테이너를 렌더링한다', () => {
    render(<AudioReactiveVisual />)
    expect(screen.getByTestId('audio-reactive-visual')).toBeInTheDocument()
  })

  it('R3F Canvas가 렌더링된다', () => {
    render(<AudioReactiveVisual />)
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument()
  })

  it('비활성 상태에서 모드 선택 UI가 표시된다', () => {
    render(<AudioReactiveVisual />)
    expect(screen.getByTestId('mode-selector')).toBeInTheDocument()
    expect(screen.getByTestId('mode-btn-music')).toBeInTheDocument()
    expect(screen.getByTestId('mode-btn-tab')).toBeInTheDocument()
    expect(screen.getByTestId('mode-btn-voice')).toBeInTheDocument()
  })

  it('기본 모드는 음악이다', () => {
    render(<AudioReactiveVisual />)
    expect(screen.getByTestId('mode-btn-music')).toHaveStyle({ color: '#0ff' })
  })

  it('비활성 상태에서 시작 버튼이 표시된다', () => {
    render(<AudioReactiveVisual />)
    expect(screen.getByTestId('start-button')).toBeInTheDocument()
  })

  it('음악 모드에서 파일 선택 전 시작 버튼이 비활성화된다', () => {
    render(<AudioReactiveVisual />)
    expect(screen.getByTestId('start-button')).toBeDisabled()
  })

  it('음악 모드에서 파일 선택 후 시작하면 activate("file")을 호출한다', () => {
    render(<AudioReactiveVisual />)
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' })
    const fileInput = screen.getByTestId('file-input')
    fireEvent.change(fileInput, { target: { files: [file] } })
    fireEvent.click(screen.getByTestId('start-button'))
    expect(mockActivate).toHaveBeenCalledWith('file')
  })

  it('음성 모드 선택 후 시작하면 activate("microphone")을 호출한다', () => {
    render(<AudioReactiveVisual />)
    fireEvent.click(screen.getByTestId('mode-btn-voice'))
    fireEvent.click(screen.getByTestId('start-button'))
    expect(mockActivate).toHaveBeenCalledWith('microphone')
  })

  it('탭 모드 선택 후 시작하면 activate("tab")을 호출한다', () => {
    render(<AudioReactiveVisual />)
    fireEvent.click(screen.getByTestId('mode-btn-tab'))
    fireEvent.click(screen.getByTestId('start-button'))
    expect(mockActivate).toHaveBeenCalledWith('tab')
  })

  it('탭 모드에서 파일 피커가 없다', () => {
    render(<AudioReactiveVisual />)
    fireEvent.click(screen.getByTestId('mode-btn-tab'))
    expect(screen.queryByTestId('file-select-btn')).not.toBeInTheDocument()
  })

  it('활성 상태에서 정지 버튼이 표시된다', () => {
    mockUseAudioAnalyzer.mockReturnValue({
      isActive: true,
      isVoiceActive: false,
      audioDataRef: { current: baseAudioData },
      activate: mockActivate,
      deactivate: mockDeactivate,
    })
    render(<AudioReactiveVisual />)
    expect(screen.getByTestId('stop-button')).toBeInTheDocument()
    expect(screen.queryByTestId('mode-selector')).not.toBeInTheDocument()
  })

  it('정지 버튼 클릭 시 deactivate를 호출한다', () => {
    mockUseAudioAnalyzer.mockReturnValue({
      isActive: true,
      isVoiceActive: false,
      audioDataRef: { current: baseAudioData },
      activate: mockActivate,
      deactivate: mockDeactivate,
    })
    render(<AudioReactiveVisual />)
    fireEvent.click(screen.getByTestId('stop-button'))
    expect(mockDeactivate).toHaveBeenCalled()
  })

  it('활성 상태에서 active-indicator가 표시된다', () => {
    mockUseAudioAnalyzer.mockReturnValue({
      isActive: true,
      isVoiceActive: false,
      audioDataRef: { current: baseAudioData },
      activate: mockActivate,
      deactivate: mockDeactivate,
    })
    render(<AudioReactiveVisual />)
    expect(screen.getByTestId('active-indicator')).toBeInTheDocument()
  })

  it('mousePos props를 받아 에러 없이 렌더링한다', () => {
    const mousePos = { x: 500, y: 300, nx: 0.5, ny: 0.3 }
    expect(() => render(<AudioReactiveVisual mousePos={mousePos} />)).not.toThrow()
  })

  it('언마운트 시 에러가 발생하지 않는다', () => {
    const { unmount } = render(<AudioReactiveVisual />)
    expect(() => unmount()).not.toThrow()
  })
})
