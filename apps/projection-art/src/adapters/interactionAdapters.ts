import type { InteractionPoint, MousePosition } from '../types'

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
