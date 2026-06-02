import { describe, it, expect } from 'vitest'
import { classifyPose, computeMotionEnergy } from './classifyPose'
import type { InteractionPoint } from '../types'

function makeLandmarks(overrides: Partial<Record<number, { x: number; y: number }>> = {}): InteractionPoint[] {
  const defaults = Array.from({ length: 33 }, (_, i) => ({ x: 0.5, y: 0.5, id: `lm_${i}` }))
  Object.entries(overrides).forEach(([idx, val]) => {
    defaults[Number(idx)] = { ...defaults[Number(idx)], ...val }
  })
  return defaults
}

describe('classifyPose', () => {
  it('returns standing for default neutral pose', () => {
    expect(classifyPose(makeLandmarks())).toBe('standing')
  })

  it('returns standing for empty landmarks', () => {
    expect(classifyPose([])).toBe('standing')
  })

  it('detects arms-raised when both wrists above shoulders', () => {
    const landmarks = makeLandmarks({
      11: { x: 0.4, y: 0.4 },  // LEFT_SHOULDER
      12: { x: 0.6, y: 0.4 },  // RIGHT_SHOULDER
      15: { x: 0.4, y: 0.2 },  // LEFT_WRIST (above shoulder)
      16: { x: 0.6, y: 0.2 },  // RIGHT_WRIST (above shoulder)
    })
    expect(classifyPose(landmarks)).toBe('arms-raised')
  })

  it('detects one-arm-raised when only one wrist above shoulder', () => {
    const landmarks = makeLandmarks({
      11: { x: 0.4, y: 0.4 },
      12: { x: 0.6, y: 0.4 },
      15: { x: 0.4, y: 0.2 },  // LEFT_WRIST above
      16: { x: 0.6, y: 0.6 },  // RIGHT_WRIST below
    })
    expect(classifyPose(landmarks)).toBe('one-arm-raised')
  })

  it('detects t-pose when arms wide and near shoulder height', () => {
    const landmarks = makeLandmarks({
      11: { x: 0.4, y: 0.4 },
      12: { x: 0.6, y: 0.4 },
      15: { x: 0.1, y: 0.42 },  // LEFT_WRIST wide, near shoulder height
      16: { x: 0.9, y: 0.42 },  // RIGHT_WRIST wide, near shoulder height
    })
    expect(classifyPose(landmarks)).toBe('t-pose')
  })

  it('detects arms-wide when wrists are spread', () => {
    const landmarks = makeLandmarks({
      11: { x: 0.4, y: 0.4 },
      12: { x: 0.6, y: 0.4 },
      15: { x: 0.05, y: 0.7 },  // LEFT_WRIST wide but low
      16: { x: 0.95, y: 0.7 },  // RIGHT_WRIST wide but low
    })
    expect(classifyPose(landmarks)).toBe('arms-wide')
  })
})

describe('computeMotionEnergy', () => {
  it('returns 0 for empty arrays', () => {
    expect(computeMotionEnergy([], [])).toBe(0)
  })

  it('returns 0 for identical poses', () => {
    const pts = makeLandmarks()
    expect(computeMotionEnergy(pts, pts)).toBe(0)
  })

  it('returns positive value for different poses', () => {
    const a = makeLandmarks({ 0: { x: 0.5, y: 0.5 } })
    const b = makeLandmarks({ 0: { x: 0.6, y: 0.6 } })
    expect(computeMotionEnergy(a, b)).toBeGreaterThan(0)
  })

  it('clamps result to [0, 1]', () => {
    const a = makeLandmarks()
    const b = makeLandmarks()
    b.forEach((_, i) => { b[i] = { ...b[i], x: 0, y: 0 } })
    const energy = computeMotionEnergy(a, b)
    expect(energy).toBeGreaterThanOrEqual(0)
    expect(energy).toBeLessThanOrEqual(1)
  })
})
