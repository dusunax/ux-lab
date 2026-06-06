import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { InteractionPoint } from '../../../types'
import {
  COLOR_SURFACE,
  COLOR_BIOLUM,
  PLANKTON_COUNT,
  PLANKTON_RISE,
  PLANKTON_PUSH_R,
  PLANKTON_PUSH_F,
  BIOLUM_ENERGY_TH,
  BIOLUM_MAX_RATIO,
  FINGERTIP_INDICES,
} from './underwaterConstants'

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────
function toWorld(x: number, y: number, vw: number, vh: number): [number, number] {
  return [(x - 0.5) * vw, -(y - 0.5) * vh]
}

function seededRandom(seed: number): number {
  const s = Math.sin(seed * 9301.0 + 49297.0) * 233280.0
  return s - Math.floor(s)
}

// ─── 타입 ────────────────────────────────────────────────────────────────────
interface UnderwaterPlanktonProps {
  leftHand:  InteractionPoint[]
  rightHand: InteractionPoint[]
  energy:    number
  circleSprite: THREE.Texture
}

export function UnderwaterPlankton({
  leftHand,
  rightHand,
  energy,
  circleSprite,
}: UnderwaterPlanktonProps) {
  const { viewport, size } = useThree()

  const planktonData = useMemo(() => {
    const xs    = new Float32Array(PLANKTON_COUNT)
    const ys    = new Float32Array(PLANKTON_COUNT)
    const seeds = new Float32Array(PLANKTON_COUNT)
    for (let i = 0; i < PLANKTON_COUNT; i++) {
      xs[i]    = seededRandom(i * 3)
      ys[i]    = seededRandom(i * 3 + 1)
      seeds[i] = seededRandom(i * 3 + 2)
    }
    return { xs, ys, seeds }
  }, [])

  const planktonGeoRef   = useRef<THREE.BufferGeometry | null>(null)
  const planktonColorRef = useRef<THREE.BufferAttribute | null>(null)

  useFrame(({ clock }) => {
    const vw = viewport.width
    const vh = viewport.height
    const t  = clock.getElapsedTime()
    const geo = planktonGeoRef.current
    if (!geo) return

    const { xs, ys, seeds } = planktonData
    const biolumRatio = Math.min(
      1,
      Math.max(0, (energy - BIOLUM_ENERGY_TH) / (1 - BIOLUM_ENERGY_TH))
    )
    const pxPerUnit = size.width / vw
    const fingertipWorlds = [leftHand, rightHand].flatMap(hand =>
      FINGERTIP_INDICES
        .map(idx => hand[idx])
        .filter((pt): pt is InteractionPoint => Boolean(pt))
        .map(pt => toWorld(pt.x, pt.y, vw, vh))
    )
    const pushR = PLANKTON_PUSH_R / pxPerUnit

    const positions  = new Float32Array(PLANKTON_COUNT * 3)
    const colorsData = new Float32Array(PLANKTON_COUNT * 3)
    const colorBase  = new THREE.Color(COLOR_SURFACE)
    const colorBio   = new THREE.Color(COLOR_BIOLUM)

    for (let i = 0; i < PLANKTON_COUNT; i++) {
      ys[i] += PLANKTON_RISE
      xs[i] += Math.sin(ys[i] * 8.0 + seeds[i] * 6.28 + t * 0.3) * 0.0003

      if (ys[i] > 1.0) {
        ys[i] = 0
        xs[i] = seededRandom(i * 3 + t)
      }

      let wx = (xs[i] - 0.5) * vw
      let wy = (ys[i] - 0.5) * vh
      let wz = -0.25 - seeds[i] * 1.8

      fingertipWorlds.forEach(([fx, fy]) => {
        const dx = wx - fx
        const dy = wy - fy
        const d  = Math.sqrt(dx * dx + dy * dy)
        if (d < pushR && d > 0.001) {
          const force = PLANKTON_PUSH_F * (1 - d / pushR)
          wx += (dx / d) * force * (0.008 + energy * 0.012) * vw
          wy += (dy / d) * force * (0.006 + energy * 0.010) * vh
          wz += force * 0.25
        }
      })

      positions[i * 3]     = wx
      positions[i * 3 + 1] = wy
      positions[i * 3 + 2] = wz

      const isBio = seeds[i] < biolumRatio * BIOLUM_MAX_RATIO
      const c = isBio ? colorBio : colorBase
      colorsData[i * 3]     = c.r
      colorsData[i * 3 + 1] = c.g
      colorsData[i * 3 + 2] = c.b
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setDrawRange(0, PLANKTON_COUNT)

    if (!planktonColorRef.current) {
      const colorAttr = new THREE.BufferAttribute(colorsData, 3)
      geo.setAttribute('color', colorAttr)
      planktonColorRef.current = colorAttr
    } else {
      planktonColorRef.current.copyArray(colorsData)
      planktonColorRef.current.needsUpdate = true
    }
  })

  return (
    <points renderOrder={2} frustumCulled={false}>
      <bufferGeometry ref={geo => { planktonGeoRef.current = geo }}>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(PLANKTON_COUNT * 3), 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[new Float32Array(PLANKTON_COUNT * 3), 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        map={circleSprite}
        alphaTest={0.01}
        vertexColors
        size={0.06}
        transparent
        opacity={0.78}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  )
}
