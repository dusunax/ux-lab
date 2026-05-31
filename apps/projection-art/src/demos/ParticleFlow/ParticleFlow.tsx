import { useRef, useEffect, useCallback } from 'react'
import type p5Type from 'p5'
import type { MousePosition } from '../../types'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  hue: number
}

const MAX_PARTICLES = 400   // 상한 — 절대 이 이상 넘지 않음
const MIN_PARTICLES = 80    // 하한 — 부하가 심해도 이만큼은 유지
const SPAWN_PER_FRAME = 3
const FLOW_STRENGTH = 0.06
const GRAVITY = 0.018
const FPS_LOW = 28          // 이 아래면 파티클 줄임
const FPS_HIGH = 52         // 이 위면 파티클 늘림
const ADAPT_INTERVAL = 45   // 프레임 단위로 한도 재평가

// p.noise() 없이 sin/cos 기반 플로우 필드 — 저사양에서도 안정적
function flowAngle(x: number, y: number, t: number): number {
  return Math.sin(x * 0.007 + t) * Math.cos(y * 0.006 + t * 0.7) * Math.PI * 2
}

function createParticle(x: number, y: number, p: p5Type): Particle {
  const angle = p.random(p.TWO_PI)
  const speed = p.random(1, 3)
  return {
    x: x + p.random(-10, 10),
    y: y + p.random(-10, 10),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 0,
    maxLife: p.random(60, 160),
    size: p.random(2, 5),
    hue: p.random(160, 300),
  }
}

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
    let t = 0
    let particleLimit = MAX_PARTICLES  // 런타임 적응형 한도

    p.setup = () => {
      const canvas = p.createCanvas(p.windowWidth, p.windowHeight)
      canvas.parent(containerRef.current!)
      p.pixelDensity(1)  // 고DPI 스케일링 끔 — 렌더 비용 절반
      p.colorMode(p.HSB, 360, 100, 100, 100)
      p.background(0)
    }

    p.draw = () => {
      p.blendMode(p.BLEND)
      p.background(0, 0, 0, 10)
      t += 0.004

      // ── 적응형 파티클 한도 — 주기적으로 FPS 체크 후 조정 ──
      if (p.frameCount % ADAPT_INTERVAL === 0) {
        const fps = p.frameRate()
        if (fps < FPS_LOW && particleLimit > MIN_PARTICLES) {
          particleLimit = Math.max(MIN_PARTICLES, particleLimit - 60)
        } else if (fps > FPS_HIGH && particleLimit < MAX_PARTICLES) {
          particleLimit = Math.min(MAX_PARTICLES, particleLimit + 30)
        }
      }

      const mx = mousePosRef.current?.x ?? p.mouseX
      const my = mousePosRef.current?.y ?? p.mouseY

      if (particles.length < particleLimit) {
        for (let i = 0; i < SPAWN_PER_FRAME; i++) {
          particles.push(createParticle(mx, my, p))
        }
      }

      p.noStroke()
      p.blendMode(p.ADD)

      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i]

        const angle = flowAngle(pt.x, pt.y, t)
        pt.vx += Math.cos(angle) * FLOW_STRENGTH
        pt.vy += Math.sin(angle) * FLOW_STRENGTH + GRAVITY
        pt.vx *= 0.96
        pt.vy *= 0.96

        pt.x += pt.vx
        pt.y += pt.vy
        pt.life++

        const progress = pt.life / pt.maxLife
        const alpha = (1 - progress) * (progress < 0.15 ? progress / 0.15 : 1) * 80

        p.fill(pt.hue + progress * 40, 80, 100, alpha)
        p.ellipse(pt.x, pt.y, pt.size * (1 - progress * 0.5))

        if (pt.life >= pt.maxLife) particles.splice(i, 1)
      }

      p.blendMode(p.BLEND)

      if (p.mouseIsPressed && particles.length < MAX_PARTICLES) {
        for (let i = 0; i < 12; i++) {
          const b = createParticle(mx, my, p)
          b.vx *= 2.5
          b.vy *= 2.5
          b.hue = p.random(0, 60)
          particles.push(b)
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
