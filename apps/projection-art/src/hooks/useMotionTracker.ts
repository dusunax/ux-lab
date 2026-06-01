import { useCallback, useEffect, useRef, useState } from 'react'
import type { InteractionPoint } from '../types'
import { landmarksToPoints } from '../adapters/interactionAdapters'

export type TrackerStatus = 'idle' | 'requesting' | 'loading' | 'active' | 'error'

export interface MotionTrackerState {
  status: TrackerStatus
  hands: InteractionPoint[][]
  error?: string
}

export interface MotionTrackerOptions {
  numHands?: 1 | 2
}

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

export function useMotionTracker(options?: MotionTrackerOptions) {
  const numHandsRef = useRef<1 | 2>(options?.numHands ?? 1)
  numHandsRef.current = options?.numHands ?? 1

  const [state, setState] = useState<MotionTrackerState>({ status: 'idle', hands: [] })
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const landmarkerRef = useRef<{
    detectForVideo: (v: HTMLVideoElement, t: number) => { landmarks: { x: number; y: number }[][] }
  } | null>(null)
  const rafRef = useRef<number>(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
      videoRef.current?.remove()
    }
  }, [])

  const requestCamera = useCallback(async () => {
    // Clean up any previous session before starting a new one
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.remove()
      videoRef.current = null
    }
    streamRef.current = null
    landmarkerRef.current = null

    setState({ status: 'requesting', hands: [] })
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return }
      streamRef.current = stream

      setState(s => ({ ...s, status: 'loading' }))

      const { HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
      const resolver = await FilesetResolver.forVisionTasks(WASM_CDN)
      const landmarker = await HandLandmarker.createFromOptions(resolver, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numHands: numHandsRef.current,
      })
      if (!mountedRef.current) return
      landmarkerRef.current = landmarker as typeof landmarkerRef.current

      const video = document.createElement('video')
      video.srcObject = stream
      video.playsInline = true
      video.muted = true
      await video.play()
      if (!mountedRef.current) return
      videoRef.current = video

      setState(s => ({ ...s, status: 'active' }))

      const detect = () => {
        if (!mountedRef.current || !videoRef.current || !landmarkerRef.current) return
        const t0 = performance.now()
        const result = landmarkerRef.current.detectForVideo(videoRef.current, t0)
        const hands = result.landmarks
          .map(lm => lm.length > 0 ? landmarksToPoints(lm) : [])
          .filter(h => h.length === 21)
        setState(s => ({ ...s, hands }))
        rafRef.current = requestAnimationFrame(detect)
      }
      rafRef.current = requestAnimationFrame(detect)
    } catch (err) {
      if (!mountedRef.current) return
      setState({ status: 'error', hands: [], error: String(err) })
    }
  }, [])

  return { state, requestCamera }
}
