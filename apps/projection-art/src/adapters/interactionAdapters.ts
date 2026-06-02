import type { InteractionPoint, MousePosition } from '../types'

export const POSE_LANDMARK_IDS = [
  'NOSE',
  'LEFT_EYE_INNER', 'LEFT_EYE', 'LEFT_EYE_OUTER',
  'RIGHT_EYE_INNER', 'RIGHT_EYE', 'RIGHT_EYE_OUTER',
  'LEFT_EAR', 'RIGHT_EAR',
  'MOUTH_LEFT', 'MOUTH_RIGHT',
  'LEFT_SHOULDER', 'RIGHT_SHOULDER',
  'LEFT_ELBOW', 'RIGHT_ELBOW',
  'LEFT_WRIST', 'RIGHT_WRIST',
  'LEFT_PINKY', 'RIGHT_PINKY',
  'LEFT_INDEX', 'RIGHT_INDEX',
  'LEFT_THUMB', 'RIGHT_THUMB',
  'LEFT_HIP', 'RIGHT_HIP',
  'LEFT_KNEE', 'RIGHT_KNEE',
  'LEFT_ANKLE', 'RIGHT_ANKLE',
  'LEFT_HEEL', 'RIGHT_HEEL',
  'LEFT_FOOT_INDEX', 'RIGHT_FOOT_INDEX',
] as const

export type PoseLandmarkId = (typeof POSE_LANDMARK_IDS)[number]

export function poseLandmarksToPoints(
  landmarks: { x: number; y: number }[]
): InteractionPoint[] {
  return landmarks.map((lm, i) => ({
    x: lm.x,
    y: lm.y,
    id: POSE_LANDMARK_IDS[i] ?? `pose_${i}`,
  }))
}

export const HAND_LANDMARK_IDS = [
  'WRIST',
  'THUMB_CMC', 'THUMB_MCP', 'THUMB_IP', 'THUMB_TIP',
  'INDEX_MCP', 'INDEX_PIP', 'INDEX_DIP', 'INDEX_TIP',
  'MIDDLE_MCP', 'MIDDLE_PIP', 'MIDDLE_DIP', 'MIDDLE_TIP',
  'RING_MCP', 'RING_PIP', 'RING_DIP', 'RING_TIP',
  'PINKY_MCP', 'PINKY_PIP', 'PINKY_DIP', 'PINKY_TIP',
] as const

export type HandLandmarkId = (typeof HAND_LANDMARK_IDS)[number]

export function mouseToPoints(pos: MousePosition): InteractionPoint[] {
  return [{ x: pos.nx, y: pos.ny, id: 'cursor' }]
}

export function landmarksToPoints(
  landmarks: { x: number; y: number }[]
): InteractionPoint[] {
  return landmarks.map((lm, i) => ({
    x: lm.x,
    y: lm.y,
    id: HAND_LANDMARK_IDS[i] ?? `lm_${i}`,
  }))
}
