import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UnderwaterPoseReactive } from './UnderwaterPoseReactive'

// computeHandEnergy는 파일 내 unexported 함수이므로 동작은 컴포넌트를 통해 간접 검증

vi.mock('../../../hooks/useMotionTracker', () => ({
  useMotionTracker: vi.fn(() => ({
    state: { status: 'idle', hands: [] },
    requestCamera: vi.fn(),
  })),
}))

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
  useFrame:  vi.fn(),
  useThree:  () => ({ viewport: { width: 10, height: 8 }, size: { width: 1280, height: 720 }, clock: { getElapsedTime: () => 0 }, scene: { fog: null, children: [], add: vi.fn() } }),
}))

vi.mock('./UnderwaterScene', () => ({
  UnderwaterScene: () => <div data-testid="underwater-scene" />,
}))

const { useMotionTracker } = await import('../../../hooks/useMotionTracker')
const mockUseMotionTracker = vi.mocked(useMotionTracker)

beforeEach(() => {
  vi.clearAllMocks()
  mockUseMotionTracker.mockReturnValue({
    state: { status: 'idle', hands: [] },
    requestCamera: vi.fn(),
  })
})

describe('UnderwaterPoseReactive — 렌더링', () => {
  it('Canvas를 렌더링한다', () => {
    render(<UnderwaterPoseReactive />)
    expect(screen.getByTestId('canvas')).toBeInTheDocument()
  })

  it('idle 상태에서 카메라 권한 모달을 표시한다', () => {
    render(<UnderwaterPoseReactive />)
    expect(screen.getByTestId('webcam-allow-btn')).toBeInTheDocument()
  })

  it('idle 모달에 "카메라 허용하기" 버튼이 있다', () => {
    render(<UnderwaterPoseReactive />)
    expect(screen.getByTestId('webcam-allow-btn')).toHaveTextContent('카메라 허용하기')
  })

  it('idle 모달에 "바다속으로" 설명 텍스트가 있다', () => {
    render(<UnderwaterPoseReactive />)
    expect(screen.getByText(/바다속으로/)).toBeInTheDocument()
  })
})

describe('UnderwaterPoseReactive — 상태별 모달', () => {
  it('requesting 상태에서 스피너를 표시하고 버튼을 숨긴다', () => {
    mockUseMotionTracker.mockReturnValue({
      state: { status: 'requesting', hands: [] },
      requestCamera: vi.fn(),
    })
    render(<UnderwaterPoseReactive />)
    expect(screen.queryByTestId('webcam-allow-btn')).not.toBeInTheDocument()
    expect(screen.getByText(/권한을 기다리는 중/)).toBeInTheDocument()
  })

  it('loading 상태에서 모델 로딩 텍스트를 표시한다', () => {
    mockUseMotionTracker.mockReturnValue({
      state: { status: 'loading', hands: [] },
      requestCamera: vi.fn(),
    })
    render(<UnderwaterPoseReactive />)
    expect(screen.getByText(/MediaPipe 모델을 불러오는 중/)).toBeInTheDocument()
  })

  it('error 상태에서 재연결 버튼을 표시한다', () => {
    mockUseMotionTracker.mockReturnValue({
      state: { status: 'error', hands: [] },
      requestCamera: vi.fn(),
    })
    render(<UnderwaterPoseReactive />)
    expect(screen.getByTestId('webcam-allow-btn')).toHaveTextContent('카메라 다시 연결')
  })

  it('error 상태에서 에러 안내 텍스트를 표시한다', () => {
    mockUseMotionTracker.mockReturnValue({
      state: { status: 'error', hands: [] },
      requestCamera: vi.fn(),
    })
    render(<UnderwaterPoseReactive />)
    expect(screen.getByText(/카메라 접근이 차단/)).toBeInTheDocument()
  })

  it('active 상태에서 권한 모달을 표시하지 않는다', () => {
    mockUseMotionTracker.mockReturnValue({
      state: { status: 'active', hands: [[], []] },
      requestCamera: vi.fn(),
    })
    render(<UnderwaterPoseReactive />)
    expect(screen.queryByTestId('webcam-allow-btn')).not.toBeInTheDocument()
  })
})

describe('UnderwaterPoseReactive — 인터랙션', () => {
  it('카메라 허용 버튼 클릭 시 requestCamera를 호출한다', () => {
    const requestCamera = vi.fn()
    mockUseMotionTracker.mockReturnValue({
      state: { status: 'idle', hands: [] },
      requestCamera,
    })
    render(<UnderwaterPoseReactive />)
    fireEvent.click(screen.getByTestId('webcam-allow-btn'))
    expect(requestCamera).toHaveBeenCalledOnce()
  })

  it('model: hands, numHands: 2 로 useMotionTracker를 호출한다', () => {
    render(<UnderwaterPoseReactive />)
    expect(mockUseMotionTracker).toHaveBeenCalledWith({ model: 'hands', numHands: 2 })
  })
})
