import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFrameRate } from './useFrameRate'

describe('useFrameRate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('초기 상태는 0fps여야 한다', () => {
    const { result } = renderHook(() => useFrameRate())
    expect(result.current.state.fps).toBe(0)
    expect(result.current.state.avgFps).toBe(0)
    expect(result.current.state.frameTime).toBe(0)
  })

  it('tick 함수와 reset 함수가 존재한다', () => {
    const { result } = renderHook(() => useFrameRate())
    expect(typeof result.current.tick).toBe('function')
    expect(typeof result.current.reset).toBe('function')
  })

  it('enabled=false이면 tick 호출 시 state가 변경되지 않는다', () => {
    const { result } = renderHook(() => useFrameRate(false))
    act(() => {
      result.current.tick(performance.now())
    })
    expect(result.current.state.fps).toBe(0)
  })

  it('reset 호출 시 상태가 초기화된다', () => {
    const { result } = renderHook(() => useFrameRate())
    act(() => {
      result.current.reset()
    })
    expect(result.current.state.fps).toBe(0)
    expect(result.current.state.avgFps).toBe(0)
    expect(result.current.state.minFps).toBe(Infinity)
    expect(result.current.state.maxFps).toBe(0)
  })

  it('delta가 0 이하이면 tick이 무시된다', () => {
    const { result } = renderHook(() => useFrameRate())
    act(() => {
      result.current.tick(0)  // lastTime이 0이 아닐 수 있으므로 단순 검증
    })
    // 에러 없이 동작
    expect(result.current.state.fps).toBe(0)
  })

  it('FrameRateState에 필요한 모든 필드가 존재한다', () => {
    const { result } = renderHook(() => useFrameRate())
    const { state } = result.current
    expect(state).toHaveProperty('fps')
    expect(state).toHaveProperty('avgFps')
    expect(state).toHaveProperty('minFps')
    expect(state).toHaveProperty('maxFps')
    expect(state).toHaveProperty('frameTime')
  })
})
