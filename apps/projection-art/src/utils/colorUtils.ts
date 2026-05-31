/**
 * HSL → RGB 변환 (0-255 범위)
 */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sn = s / 100
  const ln = l / 100

  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = ln - c / 2

  let r = 0, g = 0, b = 0
  if (h < 60)       { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else              { r = c; g = 0; b = x }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ]
}

/**
 * 진폭값(0~1)을 색상 팔레트 색상으로 변환 (사이버펑크 네온 팔레트)
 */
export function amplitudeToColor(amplitude: number, baseHue = 200): string {
  const clamped = Math.max(0, Math.min(1, amplitude))
  const hue = (baseHue + clamped * 120) % 360
  const saturation = 80 + clamped * 20
  const lightness = 40 + clamped * 30
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

/**
 * 두 색상 사이를 선형 보간 (hex 문자열)
 */
export function lerpColor(colorA: string, colorB: string, t: number): string {
  const parse = (hex: string): [number, number, number] => {
    const c = hex.replace('#', '')
    return [
      parseInt(c.slice(0, 2), 16),
      parseInt(c.slice(2, 4), 16),
      parseInt(c.slice(4, 6), 16),
    ]
  }
  const [r1, g1, b1] = parse(colorA)
  const [r2, g2, b2] = parse(colorB)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * 파티클 생성 시 무작위 속도 벡터 반환
 */
export function randomVelocity(speed: number): { vx: number; vy: number } {
  const angle = Math.random() * Math.PI * 2
  return {
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
  }
}

/**
 * 값을 [inMin, inMax] → [outMin, outMax]로 선형 매핑
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  if (inMax === inMin) return outMin
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin
}
