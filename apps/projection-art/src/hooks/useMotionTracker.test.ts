import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMotionTracker } from './useMotionTracker'

// Mock @mediapipe/tasks-vision
const mockDetectForVideo = vi.fn(() => ({ landmarks: [] }))
const mockCreateFromOptions = vi.fn().mockResolvedValue({ detectForVideo: mockDetectForVideo })
const mockForVisionTasks = vi.fn().mockResolvedValue({})

vi.mock('@mediapipe/tasks-vision', () => ({
  HandLandmarker: { createFromOptions: mockCreateFromOptions },
  PoseLandmarker: { createFromOptions: mockCreateFromOptions },
  FilesetResolver: { forVisionTasks: mockForVisionTasks },
}))

HTMLVideoElement.prototype.play = vi.fn().mockResolvedValue(undefined)

const mockStream = { getTracks: () => [{ stop: vi.fn() }] }
const mockGetUserMedia = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('navigator', {
    ...globalThis.navigator,
    mediaDevices: { getUserMedia: mockGetUserMedia },
  })
  mockGetUserMedia.mockResolvedValue(mockStream)
  mockCreateFromOptions.mockResolvedValue({ detectForVideo: mockDetectForVideo })
  mockForVisionTasks.mockResolvedValue({})
  mockDetectForVideo.mockReturnValue({ landmarks: [] })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useMotionTracker', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useMotionTracker())
    expect(result.current.state.status).toBe('idle')
    expect(result.current.state.hands).toHaveLength(0)
  })

  it('transitions to requesting when requestCamera is called', () => {
    const { result } = renderHook(() => useMotionTracker())
    act(() => { result.current.requestCamera() })
    expect(result.current.state.status).toBe('requesting')
  })

  it('transitions to error when getUserMedia throws', async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'))
    const { result } = renderHook(() => useMotionTracker())
    await act(async () => { await result.current.requestCamera() })
    expect(result.current.state.status).toBe('error')
    expect(result.current.state.error).toContain('Permission denied')
  })

  it('reaches active status after camera + model load', async () => {
    const { result } = renderHook(() => useMotionTracker())
    await act(async () => { await result.current.requestCamera() })
    expect(result.current.state.status).toBe('active')
  })

  it('updates hands when landmarks detected', async () => {
    const fakeLandmarks = Array.from({ length: 21 }, (_, i) => ({ x: i * 0.05, y: 0.5 }))
    mockDetectForVideo.mockReturnValue({ landmarks: [fakeLandmarks] })

    vi.spyOn(global, 'requestAnimationFrame').mockImplementationOnce(cb => {
      cb(performance.now())
      return 1
    })

    const { result } = renderHook(() => useMotionTracker())
    await act(async () => { await result.current.requestCamera() })
    expect(result.current.state.hands[0]).toHaveLength(21)
    expect(result.current.state.hands[0][0].id).toBe('WRIST')
  })
})
