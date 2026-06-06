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

// Float32Array (33*2) → InteractionPoint[]
function coordsToPoints(coords: Float32Array): InteractionPoint[] {
  const pts: InteractionPoint[] = []
  for (let i = 0; i < 33; i++) {
    pts.push({ x: coords[i * 2], y: coords[i * 2 + 1] })
  }
  return pts
}

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
  const workerRef = useRef<Worker | null>(null)
  const workerReadyRef = useRef(false)
  const pendingFrameRef = useRef(false)
  const rafRef = useRef<number>(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
      videoRef.current?.remove()
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  const requestCamera = useCallback(async () => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.remove()
      videoRef.current = null
    }
    workerRef.current?.terminate()
    workerRef.current = null
    workerReadyRef.current = false
    pendingFrameRef.current = false
    streamRef.current = null
    landmarkerRef.current = null

    setState({ status: 'requesting', hands: [] })

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return }
      streamRef.current = stream
      setState(s => ({ ...s, status: 'loading' }))

      const currentModel = modelRef.current

      const video = document.createElement('video')
      video.srcObject = stream
      video.playsInline = true
      video.muted = true
      await video.play()
      if (!mountedRef.current) return
      videoRef.current = video

      if (currentModel === 'pose') {
        // Pose — offload to Web Worker, communicate via ImageBitmap + Float32Array transferable
        const worker = new Worker(
          new URL('../workers/poseWorker.ts', import.meta.url),
          { type: 'module' }
        )
        workerRef.current = worker

        const runPoseMainThread = () => {
          if (!mountedRef.current || !videoRef.current) return
          ;(async () => {
            try {
              const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
              const resolver = await FilesetResolver.forVisionTasks(WASM_CDN)
              const poseLandmarker = await PoseLandmarker.createFromOptions(resolver, {
                baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: 'GPU' },
                runningMode: 'VIDEO',
                numPoses: 1,
              })
              if (!mountedRef.current) return
              landmarkerRef.current = poseLandmarker as typeof landmarkerRef.current
              setState(s => ({ ...s, status: 'active' }))
              const detect = () => {
                if (!mountedRef.current || !videoRef.current || !landmarkerRef.current) return
                const result = landmarkerRef.current.detectForVideo(videoRef.current, performance.now())
                const hands = result.landmarks
                  .map(lm => lm.length > 0 ? poseLandmarksToPoints(lm) : [])
                  .filter(pts => pts.length === 33)
                setState(s => ({ ...s, hands }))
                rafRef.current = requestAnimationFrame(detect)
              }
              rafRef.current = requestAnimationFrame(detect)
            } catch (err) {
              setState({ status: 'error', hands: [], error: String(err) })
            }
          })()
        }

        worker.onmessage = (e: MessageEvent) => {
          const { type, coords } = e.data as { type: string; coords: Float32Array | null }

          if (type === 'ready') {
            workerReadyRef.current = true
            if (mountedRef.current) setState(s => ({ ...s, status: 'active' }))
            return
          }

          if (type === 'result') {
            pendingFrameRef.current = false
            if (!mountedRef.current) return
            const pts = coords ? [coordsToPoints(coords)] : []
            setState(s => ({ ...s, hands: pts }))
            return
          }

          // Worker failed to load model — fall back to main thread
          if (type === 'error') {
            workerReadyRef.current = false
            runPoseMainThread()
          }
        }

        worker.onerror = () => {
          workerReadyRef.current = false
          runPoseMainThread()
        }

        // Capture and transfer frames to worker
        const detectLoop = () => {
          if (!mountedRef.current || !videoRef.current) return
          rafRef.current = requestAnimationFrame(detectLoop)

          if (!workerReadyRef.current || pendingFrameRef.current) return
          pendingFrameRef.current = true
          createImageBitmap(videoRef.current)
            .then(bitmap => {
              workerRef.current?.postMessage(
                { type: 'detect', bitmap, timestamp: performance.now() },
                [bitmap]
              )
            })
            .catch(() => { pendingFrameRef.current = false })
        }
        rafRef.current = requestAnimationFrame(detectLoop)

      } else {
        // Hands — run on main thread (21 landmarks, low latency)
        const { HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
        const resolver = await FilesetResolver.forVisionTasks(WASM_CDN)
        const landmarker = await HandLandmarker.createFromOptions(resolver, {
          baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: numHandsRef.current,
        })
        if (!mountedRef.current) return
        landmarkerRef.current = landmarker as typeof landmarkerRef.current
        setState(s => ({ ...s, status: 'active' }))

        const detect = () => {
          if (!mountedRef.current || !videoRef.current || !landmarkerRef.current) return
          const result = landmarkerRef.current.detectForVideo(videoRef.current, performance.now())
          const hands = result.landmarks
            .map(lm => lm.length > 0 ? landmarksToPoints(lm) : [])
            .filter(h => h.length === 21)
          setState(s => ({ ...s, hands }))
          rafRef.current = requestAnimationFrame(detect)
        }
        rafRef.current = requestAnimationFrame(detect)
      }
    } catch (err) {
      if (!mountedRef.current) return
      setState({ status: 'error', hands: [], error: String(err) })
    }
  }, [])

  return { state, requestCamera }
}
