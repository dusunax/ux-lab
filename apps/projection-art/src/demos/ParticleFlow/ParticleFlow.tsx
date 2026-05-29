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

const PARTICLE_COUNT = 1000
const SPAWN_RATE = 8
const BASE_SPEED = 2.5

function createParticle(x: number, y: number, p: p5Type): Particle {
  const angle = p.random(p.TWO_PI)
  const speed = p.random(0.5, BASE_SPEED)
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 0,
    maxLife: p.random(60, 180),
    size: p.random(2, 6),
    hue: p.random(160, 280),
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

    p.setup = () => {
      const canvas = p.createCanvas(p.windowWidth, p.windowHeight)
      canvas.parent(containerRef.current!)
      p.colorMode(p.HSB, 360, 100, 100, 100)
      p.background(0)
    }

    p.draw = () => {
      // 잔상 효과
      p.background(0, 0, 0, 12)

      const mx = mousePosRef.current?.x ?? p.mouseX
      const my = mousePosRef.current?.y ?? p.mouseY

      // 파티클 생성
      if (particles.length < PARTICLE_COUNT) {
        for (let i = 0; i < SPAWN_RATE; i++) {
          const ox = p.random(-20, 20)
          const oy = p.random(-20, 20)
          particles.push(createParticle(mx + ox, my + oy, p))
        }
      }

      // 파티클 업데이트 & 렌더
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i]
        pt.x += pt.vx
        pt.y += pt.vy
        pt.vy += 0.02 // 중력
        pt.life++

        const progress = pt.life / pt.maxLife
        const alpha = (1 - progress) * 80

        p.noStroke()
        p.fill(pt.hue + progress * 60, 80, 100, alpha)
        p.ellipse(pt.x, pt.y, pt.size * (1 - progress * 0.5))

        if (pt.life >= pt.maxLife) {
          particles.splice(i, 1)
        }
      }
    }

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight)
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
