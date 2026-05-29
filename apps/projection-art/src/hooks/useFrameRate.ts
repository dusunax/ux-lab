import { useState, useRef, useCallback, useEffect } from 'react'

interface FrameRateState {
  fps: number
  avgFps: number
  minFps: number
  maxFps: number
  frameTime: number
}

const SAMPLE_SIZE = 60  // 1초 분량의 샘플 (60fps 기준)

/**
 * requestAnimationFrame 루프 기반 FPS 모니터링 훅
 * 렌더 루프가 있는 부모에서 매 프레임 tick()을 호출해 사용
 */
export function useFrameRate(enabled = true) {
  const [state, setState] = useState<FrameRateState>({
    fps: 0,
    avgFps: 0,
    minFps: Infinity,
    maxFps: 0,
    frameTime: 0,
  })

  const lastTimeRef = useRef<number>(0)
  const samplesRef = useRef<number[]>([])
  const frameCountRef = useRef(0)

  const tick = useCallback((now: number) => {
    if (!enabled) return

    const delta = now - lastTimeRef.current
    lastTimeRef.current = now

    if (delta <= 0 || delta > 1000) return  // 첫 프레임 또는 탭 비활성화 후 복귀 무시

    const currentFps = Math.round(1000 / delta)
    frameCountRef.current += 1

    const samples = samplesRef.current
    samples.push(currentFps)
    if (samples.length > SAMPLE_SIZE) samples.shift()

    // 10프레임마다 집계 업데이트 (setState 호출 최소화)
    if (frameCountRef.current % 10 === 0) {
      const avg = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length)
      const min = Math.min(...samples)
      const max = Math.max(...samples)
      setState({
        fps: currentFps,
        avgFps: avg,
        minFps: min,
        maxFps: max,
        frameTime: Math.round(delta * 100) / 100,
      })
    }
  }, [enabled])

  const reset = useCallback(() => {
    samplesRef.current = []
    frameCountRef.current = 0
    lastTimeRef.current = 0
    setState({ fps: 0, avgFps: 0, minFps: Infinity, maxFps: 0, frameTime: 0 })
  }, [])

  useEffect(() => {
    if (!enabled) return
    lastTimeRef.current = performance.now()
  }, [enabled])

  return { state, tick, reset }
}
