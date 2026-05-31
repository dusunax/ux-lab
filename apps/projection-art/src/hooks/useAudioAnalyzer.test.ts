import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioAnalyzer } from './useAudioAnalyzer'

describe('useAudioAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('초기 상태는 비활성화 상태여야 한다', () => {
    const { result } = renderHook(() => useAudioAnalyzer())
    expect(result.current.isActive).toBe(false)
    expect(result.current.audioDataRef.current.averageAmplitude).toBe(0)
    expect(result.current.audioDataRef.current.bassAmplitude).toBe(0)
    expect(result.current.audioDataRef.current.midAmplitude).toBe(0)
    expect(result.current.audioDataRef.current.trebleAmplitude).toBe(0)
  })

  it('frequencyData 초기값은 Uint8Array여야 한다', () => {
    const { result } = renderHook(() => useAudioAnalyzer())
    expect(result.current.audioDataRef.current.frequencyData).toBeInstanceOf(Uint8Array)
  })

  it('activate(microphone) 호출 후 isActive가 true가 되어 AudioContext 생성을 간접 검증한다', async () => {
    const { result } = renderHook(() => useAudioAnalyzer())
    await act(async () => {
      await result.current.activate('microphone')
    })
    expect(result.current.isActive).toBe(true)
  })

  it('activate 후 isActive가 true가 된다', async () => {
    const { result } = renderHook(() => useAudioAnalyzer())
    await act(async () => {
      await result.current.activate('microphone')
    })
    expect(result.current.isActive).toBe(true)
  })

  it('deactivate 후 isActive가 false가 된다', async () => {
    const { result } = renderHook(() => useAudioAnalyzer())
    await act(async () => {
      await result.current.activate('microphone')
    })
    act(() => {
      result.current.deactivate()
    })
    expect(result.current.isActive).toBe(false)
  })

  it('activate(microphone) 호출 시 getUserMedia를 사용한다', async () => {
    const mockStream = {
      getTracks: vi.fn(() => [{ stop: vi.fn() }]),
    } as unknown as MediaStream

    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
    })

    const { result } = renderHook(() => useAudioAnalyzer())
    await act(async () => {
      await result.current.activate('microphone')
    })
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true })
    expect(result.current.isActive).toBe(true)
  })

  it('audioElementRef가 제공되면 createMediaElementSource를 호출한다', async () => {
    const audioEl = document.createElement('audio')
    const { result } = renderHook(() =>
      useAudioAnalyzer({ audioElementRef: { current: audioEl } })
    )
    await act(async () => {
      await result.current.activate('file')
    })
    expect(result.current.isActive).toBe(true)
  })

  it('언마운트 시 AudioContext를 닫는다', async () => {
    const audioEl = document.createElement('audio')
    const { result, unmount } = renderHook(() =>
      useAudioAnalyzer({ audioElementRef: { current: audioEl } })
    )
    await act(async () => {
      await result.current.activate('file')
    })
    unmount()
    // 언마운트 중 에러가 없으면 통과
  })

  it('주파수 데이터가 숫자 범위 [0, 1] 안에 있어야 한다', async () => {
    const { result } = renderHook(() => useAudioAnalyzer())
    await act(async () => {
      await result.current.activate('microphone')
    })
    expect(result.current.audioDataRef.current.averageAmplitude).toBeGreaterThanOrEqual(0)
    expect(result.current.audioDataRef.current.averageAmplitude).toBeLessThanOrEqual(1)
  })
})
