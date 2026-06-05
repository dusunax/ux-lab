import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { InteractionPoint } from '../../../types'

// ─── 팔레트 상수 ────────────────────────────────────────────────────────────
const COLOR_SPREAD  = '#00b4d8'
const COLOR_SURFACE = '#90e0ef'
const COLOR_BIOLUM  = '#80ffdb'

// ─── 스켈레톤 연결 (MediaPipe Pose) ─────────────────────────────────────────
const POSE_CONNECTIONS: [number, number][] = [
  [0, 1], [0, 4], [1, 2], [2, 3], [3, 7], [4, 5], [5, 6], [6, 8],
  [11, 12], [11, 23], [12, 24], [23, 24],
  [11, 13], [13, 15], [15, 17], [15, 19], [17, 19],
  [12, 14], [14, 16], [16, 18], [16, 20], [18, 20],
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
]

// ─── Trail 설정 ──────────────────────────────────────────────────────────────
const TRAIL_JOINTS  = [0, 15, 16, 27, 28] as const
const TRAIL_LENGTH  = 100
const TRAIL_LERP_A  = 0.85
const TRAIL_LERP_B  = 0.15

// ─── 파티클 ──────────────────────────────────────────────────────────────────
const PLANKTON_COUNT   = 400
const PLANKTON_RISE    = 0.002
const PLANKTON_PUSH_R  = 100
const PLANKTON_PUSH_F  = 0.3
const BIOLUM_ENERGY_TH = 0.6
const BIOLUM_MAX_RATIO = 0.3

// ─── 파도 레이어 설정 ────────────────────────────────────────────────────────
const WAVE_POINTS      = 120
const WAVE_PHASE_DELTA = 0.016
const SURFACE_Y_RATIO  = 0.2

interface WaveLayer {
  speed:   number
  opacity: number
  color:   string
  ampMult: number
}

const WAVE_LAYERS: WaveLayer[] = [
  { speed: 1.4, opacity: 0.6, color: '#caf0f8', ampMult: 1.0 },
  { speed: 1.0, opacity: 0.5, color: '#90e0ef', ampMult: 1.1 },
  { speed: 0.6, opacity: 0.4, color: '#00b4d8', ampMult: 1.2 },
  { speed: 0.3, opacity: 0.3, color: '#0077b6', ampMult: 1.3 },
]

// ─── 배경 GLSL ───────────────────────────────────────────────────────────────
const BG_VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const BG_FRAG = /* glsl */`
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    float y = vUv.y;

    vec3 c1 = vec3(0.012, 0.016, 0.369);
    vec3 c2 = vec3(0.000, 0.467, 0.714);
    vec3 c3 = vec3(0.000, 0.706, 0.847);
    vec3 c4 = vec3(0.565, 0.878, 0.937);
    vec3 c5 = vec3(0.792, 0.941, 0.973);

    vec3 col = mix(c1, c2, smoothstep(0.0,  0.30, y));
    col      = mix(col, c3, smoothstep(0.30, 0.55, y));
    col      = mix(col, c4, smoothstep(0.55, 0.75, y));
    col      = mix(col, c5, smoothstep(0.75, 1.0,  y));

    float n = sin(vUv.x * 5.2 + uTime * 0.20) * 0.012
            + sin(vUv.x * 2.7 - uTime * 0.08) * 0.008;
    float band = smoothstep(0.32 + n, 0.35 + n, y)
               * (1.0 - smoothstep(0.35 + n, 0.40 + n, y));
    col *= mix(1.0, 0.72, band * 0.55);

    float rays = 0.0;
    for (int i = 0; i < 6; i++) {
      float fi   = float(i);
      float rx   = 0.08 + fi * 0.16 + sin(uTime * 0.35 + fi * 1.4) * 0.03;
      float dist = abs(vUv.x - rx);
      float fade = max(0.0, 1.0 - (1.0 - y) / (0.55 + fi * 0.04));
      rays += max(0.0, (0.012 - dist) / 0.012) * fade;
    }
    col += vec3(rays * 0.25, rays * 0.38, rays * 0.48);

    gl_FragColor = vec4(col, 1.0);
  }
`

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────
function toWorld(x: number, y: number, vw: number, vh: number): [number, number] {
  return [(x - 0.5) * vw, -(y - 0.5) * vh]
}

function seededRandom(seed: number): number {
  const s = Math.sin(seed * 9301.0 + 49297.0) * 233280.0
  return s - Math.floor(s)
}

// ─── 타입 ────────────────────────────────────────────────────────────────────
export interface UnderwaterSceneProps {
  pose:   InteractionPoint[]
  energy: number
}

interface LerpedJoint {
  x: number
  y: number
}

// ─── 컴포넌트 ────────────────────────────────────────────────────────────────
export function UnderwaterScene({ pose, energy }: UnderwaterSceneProps) {
  const { viewport, size } = useThree()
  const isActive = pose.length === 33

  // ── 배경 uniform ────────────────────────────────────────────────────────────
  const bgUniforms = useMemo(
    () => ({ uTime: { value: 0 } }),
    []
  )

  // ── 파도 — THREE.Line 인스턴스 직접 보유 ────────────────────────────────────
  const waveLinesRef = useRef<THREE.Line[]>([])
  const wavePhaseRef = useRef(0)

  useEffect(() => {
    waveLinesRef.current = WAVE_LAYERS.map(layer => {
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(WAVE_POINTS * 3), 3))
      const mat = new THREE.LineBasicMaterial({
        color: layer.color,
        transparent: true,
        opacity: layer.opacity,
        toneMapped: false,
      })
      const line = new THREE.Line(geo, mat)
      line.renderOrder = 1
      return line
    })

    return () => {
      waveLinesRef.current.forEach(l => {
        l.geometry.dispose()
        ;(l.material as THREE.Material).dispose()
      })
    }
  }, [])

  // ── 플랑크톤 초기화 (랜덤 시드 고정) ───────────────────────────────────────
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

  // ── 스켈레톤 refs (glow + core 각각 독립) ──────────────────────────────────
  const skeletonGlowGeoRef = useRef<THREE.BufferGeometry | null>(null)
  const skeletonCoreGeoRef = useRef<THREE.BufferGeometry | null>(null)

  // ── Trail refs ──────────────────────────────────────────────────────────────
  const trailRingRef    = useRef<Float32Array[]>(
    TRAIL_JOINTS.map(() => new Float32Array(TRAIL_LENGTH * 3))
  )
  const trailHeadRef    = useRef<number[]>(TRAIL_JOINTS.map(() => 0))
  const trailCountRef   = useRef<number[]>(TRAIL_JOINTS.map(() => 0))
  const trailGeoRefs    = useRef<(THREE.BufferGeometry | null)[]>(TRAIL_JOINTS.map(() => null))
  const lerpedJointsRef = useRef<LerpedJoint[]>(
    TRAIL_JOINTS.map(() => ({ x: 0, y: 0 }))
  )

  // ── 관절 Points ref ─────────────────────────────────────────────────────────
  const jointsGeoRef = useRef<THREE.BufferGeometry | null>(null)

  // ─── useFrame ────────────────────────────────────────────────────────────────
  useFrame(({ clock, scene }) => {
    const vw = viewport.width
    const vh = viewport.height
    const t  = clock.getElapsedTime()

    bgUniforms.uTime.value = t
    wavePhaseRef.current += WAVE_PHASE_DELTA

    // ── 파도 레이어 업데이트 ─────────────────────────────────────────────────
    const baseAmp  = 0.04 * vh + energy * 0.08 * vh
    const surfaceY = vh * 0.5 - vh * SURFACE_Y_RATIO

    WAVE_LAYERS.forEach((layer, li) => {
      const line = waveLinesRef.current[li]
      if (!line) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!scene.children.includes(line as any)) scene.add(line as any)

      const geo  = line.geometry
      const freq = 2.5 + li * 0.4
      const positions = new Float32Array(WAVE_POINTS * 3)

      for (let i = 0; i < WAVE_POINTS; i++) {
        const t01 = i / (WAVE_POINTS - 1)
        const wx  = (t01 - 0.5) * vw
        const wy  = surfaceY +
          Math.sin(wx * freq + wavePhaseRef.current * layer.speed) * baseAmp * layer.ampMult
        positions[i * 3]     = wx
        positions[i * 3 + 1] = wy
        positions[i * 3 + 2] = 0
      }
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    })

    // ── 플랑크톤 업데이트 ───────────────────────────────────────────────────
    const geo = planktonGeoRef.current
    if (geo) {
      const { xs, ys, seeds } = planktonData
      const biolumRatio = Math.min(
        1,
        Math.max(0, (energy - BIOLUM_ENERGY_TH) / (1 - BIOLUM_ENERGY_TH))
      )
      const pxPerUnit = size.width / vw
      const wrist15 = isActive && pose[15]
        ? toWorld(pose[15].x, pose[15].y, vw, vh)
        : null
      const wrist16 = isActive && pose[16]
        ? toWorld(pose[16].x, pose[16].y, vw, vh)
        : null
      const pushR = PLANKTON_PUSH_R / pxPerUnit

      const positions  = new Float32Array(PLANKTON_COUNT * 3)
      const colorsData = new Float32Array(PLANKTON_COUNT * 3)
      const colorBase  = new THREE.Color(COLOR_SURFACE)
      const colorBio   = new THREE.Color(COLOR_BIOLUM)

      for (let i = 0; i < PLANKTON_COUNT; i++) {
        ys[i] += PLANKTON_RISE
        if (ys[i] > 1.0) {
          ys[i] = 0
          xs[i] = seededRandom(i * 3 + t)
        }

        let wx = (xs[i] - 0.5) * vw
        let wy = (ys[i] - 0.5) * vh

        if (wrist15) {
          const dx = wx - wrist15[0]
          const dy = wy - wrist15[1]
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d < pushR && d > 0.001) {
            const force = PLANKTON_PUSH_F * (1 - d / pushR)
            wx += (dx / d) * force * 0.01 * vw
            wy += (dy / d) * force * 0.01 * vh
          }
        }
        if (wrist16) {
          const dx = wx - wrist16[0]
          const dy = wy - wrist16[1]
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d < pushR && d > 0.001) {
            const force = PLANKTON_PUSH_F * (1 - d / pushR)
            wx += (dx / d) * force * 0.01 * vw
            wy += (dy / d) * force * 0.01 * vh
          }
        }

        positions[i * 3]     = wx
        positions[i * 3 + 1] = wy
        positions[i * 3 + 2] = 0

        const isBio = seeds[i] < biolumRatio * BIOLUM_MAX_RATIO
        const c = isBio ? colorBio : colorBase
        colorsData[i * 3]     = c.r
        colorsData[i * 3 + 1] = c.g
        colorsData[i * 3 + 2] = c.b
      }

      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

      if (!planktonColorRef.current) {
        const colorAttr = new THREE.BufferAttribute(colorsData, 3)
        geo.setAttribute('color', colorAttr)
        planktonColorRef.current = colorAttr
      } else {
        planktonColorRef.current.array = colorsData
        planktonColorRef.current.needsUpdate = true
      }
    }

    // ── 스켈레톤 geometry 업데이트 (glow + core 동시) ──────────────────────
    if (skeletonGlowGeoRef.current && skeletonCoreGeoRef.current) {
      if (isActive) {
        const positions = new Float32Array(POSE_CONNECTIONS.length * 2 * 3)
        POSE_CONNECTIONS.forEach(([a, b], ci) => {
          const pa = pose[a], pb = pose[b]
          if (!pa || !pb) return
          const [ax, ay] = toWorld(pa.x, pa.y, vw, vh)
          const [bx, by] = toWorld(pb.x, pb.y, vw, vh)
          const base = ci * 6
          positions[base]     = ax; positions[base + 1] = ay; positions[base + 2] = 0
          positions[base + 3] = bx; positions[base + 4] = by; positions[base + 5] = 0
        })
        const attr = new THREE.BufferAttribute(positions, 3)
        skeletonGlowGeoRef.current.setAttribute('position', attr)
        skeletonCoreGeoRef.current.setAttribute('position', attr.clone())
      }
    }

    // ── 관절 Points 업데이트 ─────────────────────────────────────────────
    if (jointsGeoRef.current) {
      if (isActive) {
        const positions = new Float32Array(33 * 3)
        pose.forEach((pt, i) => {
          const [wx, wy] = toWorld(pt.x, pt.y, vw, vh)
          positions[i * 3]     = wx
          positions[i * 3 + 1] = wy
          positions[i * 3 + 2] = 0
        })
        jointsGeoRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        jointsGeoRef.current.setDrawRange(0, 33)
      } else {
        jointsGeoRef.current.setDrawRange(0, 0)
      }
    }

    // ── Trail 업데이트 ──────────────────────────────────────────────────
    TRAIL_JOINTS.forEach((jointIdx, ti) => {
      if (isActive && pose[jointIdx]) {
        const [tx, ty] = toWorld(pose[jointIdx].x, pose[jointIdx].y, vw, vh)
        lerpedJointsRef.current[ti].x =
          lerpedJointsRef.current[ti].x * TRAIL_LERP_A + tx * TRAIL_LERP_B
        lerpedJointsRef.current[ti].y =
          lerpedJointsRef.current[ti].y * TRAIL_LERP_A + ty * TRAIL_LERP_B

        const lx   = lerpedJointsRef.current[ti].x
        const ly   = lerpedJointsRef.current[ti].y
        const head = trailHeadRef.current[ti]
        const ring = trailRingRef.current[ti]

        ring[head * 3]     = lx
        ring[head * 3 + 1] = ly
        ring[head * 3 + 2] = 0

        trailHeadRef.current[ti] = (head + 1) % TRAIL_LENGTH
        if (trailCountRef.current[ti] < TRAIL_LENGTH) trailCountRef.current[ti]++
      } else {
        trailHeadRef.current[ti]  = 0
        trailCountRef.current[ti] = 0
      }

      const trailGeo = trailGeoRefs.current[ti]
      if (trailGeo) {
        trailGeo.setAttribute(
          'position',
          new THREE.BufferAttribute(trailRingRef.current[ti].slice(), 3)
        )
        trailGeo.setDrawRange(0, trailCountRef.current[ti])
      }
    })
  })

  const jointSize = 0.08 + energy * 0.05

  return (
    <>
      {/* 1. 배경 쿼드 — GLSL ocean gradient */}
      <mesh position={[0, 0, -4]} renderOrder={0}>
        <planeGeometry args={[30, 20]} />
        <shaderMaterial
          vertexShader={BG_VERT}
          fragmentShader={BG_FRAG}
          uniforms={bgUniforms}
          depthWrite={false}
        />
      </mesh>

      {/* 2. 파도 레이어 (4겹) — useEffect에서 scene.add로 주입, JSX 없음 */}

      {/* 3. 플랑크톤 파티클 (400개) */}
      <points renderOrder={2}>
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
          vertexColors
          size={0.05}
          transparent
          opacity={0.65}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </points>

      {/* 4a. 스켈레톤 Glow Pass */}
      <lineSegments renderOrder={3}>
        <bufferGeometry ref={geo => { skeletonGlowGeoRef.current = geo }}>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(POSE_CONNECTIONS.length * 6), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={COLOR_SPREAD}
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>

      {/* 4b. 스켈레톤 Core Pass */}
      <lineSegments renderOrder={4}>
        <bufferGeometry ref={geo => { skeletonCoreGeoRef.current = geo }}>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(POSE_CONNECTIONS.length * 6), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#caf0f8"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>

      {/* 5. Body Trail (lerp 0.85, 길이 100) */}
      {TRAIL_JOINTS.map((_, ti) => (
        <points key={`trail-${ti}`} renderOrder={5}>
          <bufferGeometry ref={geo => { if (geo) trailGeoRefs.current[ti] = geo }}>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(TRAIL_LENGTH * 3), 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            color={COLOR_SPREAD}
            size={0.045}
            transparent
            opacity={0.5}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </points>
      ))}

      {/* 6. Joint Points (33개) */}
      <points renderOrder={6}>
        <bufferGeometry ref={geo => { jointsGeoRef.current = geo }}>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(33 * 3), 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={COLOR_SURFACE}
          size={jointSize}
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
    </>
  )
}
