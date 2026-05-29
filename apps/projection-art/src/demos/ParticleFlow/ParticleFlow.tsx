import { useRef, useEffect, useCallback } from 'react'
import type p5Type from 'p5'
import type { MousePosition } from '../../types'

// ─── 파티클 구조체 ───────────────────────────────────────────────────────────

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  hue: number
  glowIntensity: number
}

// ─── 상수 ────────────────────────────────────────────────────────────────────

const MAX_PARTICLES = 1200
const SPAWN_PER_FRAME = 10
const FLOW_SCALE = 0.004   // 플로우 필드 노이즈 스케일
const FLOW_STRENGTH = 0.8  // 플로우 필드가 파티클에 미치는 힘
const GRAVITY = 0.015

function createParticle(x: number, y: number, p: p5Type): Particle {
  const angle = p.random(p.TWO_PI)
  const speed = p.random(0.8, 3.5)
  return {
    x: x + p.random(-15, 15),
    y: y + p.random(-15, 15),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 0,
    maxLife: p.random(80, 220),
    size: p.random(1.5, 5),
    hue: p.random(160, 300),  // 사이버 팔레트: 시안~보라
    glowIntensity: p.random(4, 16),
  }
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

interface ParticleFlowProps {
  mousePos?: MousePosition
}

export function ParticleFlow({ mousePos }: ParticleFlowProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5Ref = useRef<p5Type | null>(null)
  const mousePosRef = useRef<MousePosition | undefined>(mousePos)

  useEffect(() => {
    mousePosRef.current = mousePos
  }, [mousePos])

  const sketch = useCallback((p: p5Type) => {
    const particles: Particle[] = []
    let noiseOffset = 0

    p.setup = () => {
      const canvas = p.createCanvas(p.windowWidth, p.windowHeight)
      canvas.parent(containerRef.current!)
      p.colorMode(p.HSB, 360, 100, 100, 100)
      p.background(0)
    }

    p.draw = () => {
      // 잔상 효과 — 반투명 오버레이
      p.background(0, 0, 0, 8)
      noiseOffset += 0.003

      const mx = mousePosRef.current?.x ?? p.mouseX
      const my = mousePosRef.current?.y ?? p.mouseY

      // ── 파티클 생성 ──────────────────────────────────────
      if (particles.length < MAX_PARTICLES) {
        for (let i = 0; i < SPAWN_PER_FRAME; i++) {
          particles.push(createParticle(mx, my, p))
        }
      }

      // ── 파티클 업데이트 & 렌더 ───────────────────────────
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i]

        // 플로우 필드 힘 적용
        const angle = p.noise(pt.x * FLOW_SCALE, pt.y * FLOW_SCALE, noiseOffset) * p.TWO_PI * 3
        pt.vx += Math.cos(angle) * FLOW_STRENGTH * 0.05
        pt.vy += Math.sin(angle) * FLOW_STRENGTH * 0.05 + GRAVITY

        // 속도 감쇠 (속도 누적 방지)
        pt.vx *= 0.97
        pt.vy *= 0.97

        pt.x += pt.vx
        pt.y += pt.vy
        pt.life++

        const progress = pt.life / pt.maxLife
        const alpha = (1 - progress) * (progress < 0.2 ? progress * 5 : 1) * 85

        // ── 글로우 효과: drawingContext.shadowBlur ───────────
        const ctx = p.drawingContext as CanvasRenderingContext2D
        const glowColor = `hsla(${pt.hue + progress * 50}, 100%, 70%, ${alpha / 100})`
        ctx.shadowColor = glowColor
        ctx.shadowBlur = pt.glowIntensity * (1 - progress * 0.7)

        p.noStroke()
        p.fill(pt.hue + progress * 40, 85, 100, alpha)
        const sz = pt.size * (1 - progress * 0.6)
        p.ellipse(pt.x, pt.y, sz)

        // 코어 — 더 밝고 작은 점
        ctx.shadowBlur = 0
        p.fill(pt.hue + 20, 40, 100, alpha * 0.6)
        p.ellipse(pt.x, pt.y, sz * 0.4)

        if (pt.life >= pt.maxLife) {
          particles.splice(i, 1)
        }
      }

      // ── 마우스 클릭 폭발 효과 (mouseIsPressed) ────────────
      if (p.mouseIsPressed && particles.length < MAX_PARTICLES) {
        for (let i = 0; i < 20; i++) {
          const burst = createParticle(mx, my, p)
          burst.vx *= 2.5
          burst.vy *= 2.5
          burst.glowIntensity *= 2
          burst.hue = p.random(0, 60)  // 폭발은 주황~빨강
          particles.push(burst)
        }
      }
    }

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight)
      p.background(0)
    }
  }, [])

  useEffect(() => {
    let p5Instance: p5Type | null = null

    import('p5').then(({ default: P5 }) => {
      if (containerRef.current) {
        p5Instance = new P5(sketch, containerRef.current)
        p5Ref.current = p5Instance
      }
    })

    return () => {
      if (p5Ref.current) {
        p5Ref.current.remove()
        p5Ref.current = null
      }
      p5Instance?.remove()
    }
  }, [sketch])

  return (
    <div
      ref={containerRef}
      data-testid="particle-flow"
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
    />
  )
}

export default ParticleFlow
