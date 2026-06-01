import { describe, it, expect } from 'vitest'
import { mouseToPoints, landmarksToPoints, HAND_LANDMARK_IDS } from './interactionAdapters'
import type { MousePosition } from '../types'

describe('mouseToPoints', () => {
  it('returns single point with normalized coords', () => {
    const pos: MousePosition = { x: 800, y: 450, nx: 0.5, ny: 0.5 }
    const pts = mouseToPoints(pos)
    expect(pts).toHaveLength(1)
    expect(pts[0]).toEqual({ x: 0.5, y: 0.5, id: 'cursor' })
  })

  it('maps nx/ny not raw x/y', () => {
    const pos: MousePosition = { x: 1920, y: 1080, nx: 0.75, ny: 0.25 }
    const [pt] = mouseToPoints(pos)
    expect(pt.x).toBe(0.75)
    expect(pt.y).toBe(0.25)
  })
})

describe('landmarksToPoints', () => {
  it('maps 21 landmarks with correct ids', () => {
    const landmarks = Array.from({ length: 21 }, (_, i) => ({ x: i * 0.05, y: i * 0.04 }))
    const pts = landmarksToPoints(landmarks)
    expect(pts).toHaveLength(21)
    expect(pts[0].id).toBe('WRIST')
    expect(pts[4].id).toBe('THUMB_TIP')
    expect(pts[8].id).toBe('INDEX_TIP')
    expect(pts[20].id).toBe('PINKY_TIP')
  })

  it('preserves x/y values', () => {
    const landmarks = [{ x: 0.3, y: 0.7 }]
    const pts = landmarksToPoints(landmarks)
    expect(pts[0].x).toBe(0.3)
    expect(pts[0].y).toBe(0.7)
  })

  it('uses fallback id for extra landmarks', () => {
    const landmarks = Array.from({ length: 22 }, (_, i) => ({ x: 0, y: 0 }))
    const pts = landmarksToPoints(landmarks)
    expect(pts[21].id).toBe('lm_21')
  })

  it('HAND_LANDMARK_IDS has 21 entries', () => {
    expect(HAND_LANDMARK_IDS).toHaveLength(21)
  })
})
