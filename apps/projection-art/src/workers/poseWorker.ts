// Web Worker: MediaPipe Pose inference
// Receives ImageBitmap frames from main thread via Float32Array transferable

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
const POSE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

type PoseLandmarkerInstance = {
  detectForVideo: (src: ImageBitmap, timestamp: number) => {
    landmarks: { x: number; y: number }[][]
  }
}

let landmarker: PoseLandmarkerInstance | null = null

async function init() {
  try {
    const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
    const resolver = await FilesetResolver.forVisionTasks(WASM_CDN)
    landmarker = await PoseLandmarker.createFromOptions(resolver, {
      baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numPoses: 1,
    }) as PoseLandmarkerInstance
    self.postMessage({ type: 'ready' })
  } catch {
    // GPU delegate may not be available in worker; retry with CPU
    try {
      const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
      const resolver = await FilesetResolver.forVisionTasks(WASM_CDN)
      landmarker = await PoseLandmarker.createFromOptions(resolver, {
        baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: 'CPU' },
        runningMode: 'VIDEO',
        numPoses: 1,
      }) as PoseLandmarkerInstance
      self.postMessage({ type: 'ready' })
    } catch (err) {
      self.postMessage({ type: 'error', message: String(err) })
    }
  }
}

self.onmessage = (e: MessageEvent) => {
  const { type, bitmap, timestamp } = e.data as {
    type: string
    bitmap?: ImageBitmap
    timestamp?: number
  }

  if (type !== 'detect' || !landmarker || !bitmap) {
    bitmap?.close()
    return
  }

  try {
    const result = landmarker.detectForVideo(bitmap, timestamp ?? performance.now())
    bitmap.close()

    const lm = result.landmarks[0]
    if (!lm || lm.length !== 33) {
      self.postMessage({ type: 'result', coords: null })
      return
    }

    // Pack x,y pairs into Float32Array — transferable, zero-copy
    const coords = new Float32Array(33 * 2)
    for (let i = 0; i < 33; i++) {
      coords[i * 2]     = lm[i].x
      coords[i * 2 + 1] = lm[i].y
    }
    self.postMessage({ type: 'result', coords }, [coords.buffer])
  } catch {
    bitmap?.close()
    self.postMessage({ type: 'result', coords: null })
  }
}

init()
