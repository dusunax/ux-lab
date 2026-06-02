import { useCallback, useEffect, useRef, useState } from 'react'
import type { InteractionPoint } from '../types'
import { landmarksToPoints, poseLandmarksToPoints } from '../adapters/interactionAdapters'

export type TrackerStatus = 'idle' | 'requesting' | 'loading' | 'active' | 'error'
export type TrackerModel = 'hands' | 'pose'

export interface MotionTrackerState {
  status: TrackerStatus
  hands: InteractionPoint[][]
  error?: string
}

export interface MotionTrackerOptions {
  numHands?: 1 | 2
  model?: TrackerModel
}

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
const HAND_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
const POSE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

export function useMotionTracker(options?: MotionTrackerOptions) {
  const numHandsRef = useRef<1 | 2>(options?.numHands ?? 1)
  numHandsRef.current = options?.numHands ?? 1

  const modelRef = useRef<TrackerModel>(options?.model ?? 'hands')
  modelRef.current = options?.model ?? 'hands'

  const [state, setState] = useState<MotionTrackerState>({ status: 'idle', hands: [] })
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const landmarkerRef = useRef<{
    detectForVideo: (v: HTMLVideoElement, t: number) => { landmarks: { x: number; y: number }[][] }
  } | null>(null)
  const activeModelRef = useRef<TrackerModel>('hands')
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

      const currentModel = modelRef.current
      const { HandLandmarker, PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
      const resolver = await FilesetResolver.forVisionTasks(WASM_CDN)

      if (currentModel === 'pose') {
        const poseLandmarker = await PoseLandmarker.createFromOptions(resolver, {
          baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numPoses: 1,
        })
        if (!mountedRef.current) return
        landmarkerRef.current = poseLandmarker as typeof landmarkerRef.current
        activeModelRef.current = 'pose'
      } else {
        const landmarker = await HandLandmarker.createFromOptions(resolver, {
          baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: numHandsRef.current,
        })
        if (!mountedRef.current) return
        landmarkerRef.current = landmarker as typeof landmarkerRef.current
        activeModelRef.current = 'hands'
      }

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
        let hands: InteractionPoint[][]
        if (activeModelRef.current === 'pose') {
          hands = result.landmarks
            .map(lm => lm.length > 0 ? poseLandmarksToPoints(lm) : [])
            .filter(pts => pts.length === 33)
        } else {
          hands = result.landmarks
            .map(lm => lm.length > 0 ? landmarksToPoints(lm) : [])
            .filter(h => h.length === 21)
        }
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
