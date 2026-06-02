import type { InteractionPoint } from '../types'
import type { PoseLabel } from '../types'

// MediaPipe Pose landmark indices
const IDX = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
} as const

export function classifyPose(landmarks: InteractionPoint[]): PoseLabel {
  if (landmarks.length < 33) return 'standing'

  const lShoulder = landmarks[IDX.LEFT_SHOULDER]
  const rShoulder = landmarks[IDX.RIGHT_SHOULDER]
  const lWrist = landmarks[IDX.LEFT_WRIST]
  const rWrist = landmarks[IDX.RIGHT_WRIST]

  const lWristAbove = lWrist.y < lShoulder.y - 0.05
  const rWristAbove = rWrist.y < rShoulder.y - 0.05
  const wristSpread = Math.abs(lWrist.x - rWrist.x)
  const shoulderSpread = Math.abs(lShoulder.x - rShoulder.x)
  const isWide = wristSpread > shoulderSpread * 2.0

  // T-pose: arms wide AND wrists near shoulder height
  const lNearShoulder = Math.abs(lWrist.y - lShoulder.y) < 0.12
  const rNearShoulder = Math.abs(rWrist.y - rShoulder.y) < 0.12
  if (isWide && lNearShoulder && rNearShoulder) return 't-pose'

  // Both arms raised
  if (lWristAbove && rWristAbove) return 'arms-raised'

  // One arm raised
  if (lWristAbove || rWristAbove) return 'one-arm-raised'

  // Arms wide but not T-pose
  if (isWide) return 'arms-wide'

  return 'standing'
}

export function computeMotionEnergy(
  current: InteractionPoint[],
  previous: InteractionPoint[]
): number {
  if (current.length !== previous.length || current.length === 0) return 0
  let sum = 0
  for (let i = 0; i < current.length; i++) {
    const dx = current[i].x - previous[i].x
    const dy = current[i].y - previous[i].y
    sum += Math.sqrt(dx * dx + dy * dy)
  }
  return Math.min(1, sum / (current.length * 0.05))
}
