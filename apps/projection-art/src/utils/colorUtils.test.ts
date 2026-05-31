import { describe, it, expect } from 'vitest'
import { hslToRgb, amplitudeToColor, lerpColor, randomVelocity, mapRange } from './colorUtils'

describe('hslToRgb', () => {
  it('빨강 (0°, 100%, 50%) → [255, 0, 0]', () => {
    const [r, g, b] = hslToRgb(0, 100, 50)
    expect(r).toBe(255)
    expect(g).toBe(0)
    expect(b).toBe(0)
  })

  it('초록 (120°, 100%, 50%) → [0, 255, 0]', () => {
    const [r, g, b] = hslToRgb(120, 100, 50)
    expect(r).toBe(0)
    expect(g).toBe(255)
    expect(b).toBe(0)
  })

  it('파랑 (240°, 100%, 50%) → [0, 0, 255]', () => {
    const [r, g, b] = hslToRgb(240, 100, 50)
    expect(r).toBe(0)
    expect(g).toBe(0)
    expect(b).toBe(255)
  })

  it('흰색 (0°, 0%, 100%) → [255, 255, 255]', () => {
    const [r, g, b] = hslToRgb(0, 0, 100)
    expect(r).toBe(255)
    expect(g).toBe(255)
    expect(b).toBe(255)
  })

  it('검정 (0°, 0%, 0%) → [0, 0, 0]', () => {
    const [r, g, b] = hslToRgb(0, 0, 0)
    expect(r).toBe(0)
    expect(g).toBe(0)
    expect(b).toBe(0)
  })

  it('반환값은 항상 [0, 255] 범위여야 한다', () => {
    for (let h = 0; h < 360; h += 30) {
      const [r, g, b] = hslToRgb(h, 80, 60)
      expect(r).toBeGreaterThanOrEqual(0)
      expect(r).toBeLessThanOrEqual(255)
      expect(g).toBeGreaterThanOrEqual(0)
      expect(g).toBeLessThanOrEqual(255)
      expect(b).toBeGreaterThanOrEqual(0)
      expect(b).toBeLessThanOrEqual(255)
    }
  })
})

describe('amplitudeToColor', () => {
  it('유효한 CSS hsl 문자열을 반환한다', () => {
    const color = amplitudeToColor(0.5)
    expect(color).toMatch(/^hsl\(\d+(\.\d+)?,\s*\d+(\.\d+)?%,\s*\d+(\.\d+)?%\)$/)
  })

  it('amplitude 0 ~ 1 범위에서 에러 없이 동작한다', () => {
    expect(() => amplitudeToColor(0)).not.toThrow()
    expect(() => amplitudeToColor(0.5)).not.toThrow()
    expect(() => amplitudeToColor(1)).not.toThrow()
  })

  it('범위 초과 amplitude도 클램핑한다', () => {
    expect(() => amplitudeToColor(-0.5)).not.toThrow()
    expect(() => amplitudeToColor(1.5)).not.toThrow()
  })

  it('baseHue를 커스텀 지정할 수 있다', () => {
    const color1 = amplitudeToColor(0.5, 0)
    const color2 = amplitudeToColor(0.5, 180)
    expect(color1).not.toBe(color2)
  })
})

describe('lerpColor', () => {
  it('t=0이면 colorA를 반환한다', () => {
    expect(lerpColor('#000000', '#ffffff', 0)).toBe('#000000')
  })

  it('t=1이면 colorB를 반환한다', () => {
    expect(lerpColor('#000000', '#ffffff', 1)).toBe('#ffffff')
  })

  it('t=0.5이면 중간값을 반환한다', () => {
    // Math.round(127.5) === 128 → 0x80
    const mid = lerpColor('#000000', '#ffffff', 0.5)
    expect(mid).toBe('#808080')
  })

  it('유효한 hex 색상 문자열을 반환한다', () => {
    const result = lerpColor('#ff0000', '#0000ff', 0.3)
    expect(result).toMatch(/^#[0-9a-f]{6}$/)
  })
})

describe('randomVelocity', () => {
  it('vx와 vy를 포함하는 객체를 반환한다', () => {
    const v = randomVelocity(5)
    expect(v).toHaveProperty('vx')
    expect(v).toHaveProperty('vy')
  })

  it('속도 크기는 speed와 같아야 한다 (부동소수점 허용)', () => {
    const speed = 5
    const { vx, vy } = randomVelocity(speed)
    const magnitude = Math.sqrt(vx * vx + vy * vy)
    expect(magnitude).toBeCloseTo(speed, 5)
  })

  it('speed=0이면 vx와 vy의 크기는 0이다', () => {
    const { vx, vy } = randomVelocity(0)
    expect(Math.abs(vx)).toBe(0)
    expect(Math.abs(vy)).toBe(0)
  })
})

describe('mapRange', () => {
  it('기본 매핑이 정확해야 한다', () => {
    expect(mapRange(5, 0, 10, 0, 100)).toBe(50)
  })

  it('inMin == inMax이면 outMin을 반환한다', () => {
    expect(mapRange(5, 5, 5, 0, 100)).toBe(0)
  })

  it('최소값을 매핑하면 outMin을 반환한다', () => {
    expect(mapRange(0, 0, 10, 20, 80)).toBe(20)
  })

  it('최대값을 매핑하면 outMax를 반환한다', () => {
    expect(mapRange(10, 0, 10, 20, 80)).toBe(80)
  })
})
