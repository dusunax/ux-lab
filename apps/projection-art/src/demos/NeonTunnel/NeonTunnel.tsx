import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import type { MousePosition } from '../../types'

// ─── 상수 ────────────────────────────────────────────────────────────────────

const RING_COUNT = 16
const RING_DEPTH = 2.8
const RING_SPEED = 5

// ─── 색상 팔레트 (사이버펑크 네온) ───────────────────────────────────────────

const PALETTES = [
  // 사이언-마젠타
  [new THREE.Color(0x00ffff), new THREE.Color(0xff00ff), new THREE.Color(0x4400ff)],
  // 그린-골드
  [new THREE.Color(0x00ff88), new THREE.Color(0xffcc00), new THREE.Color(0x0088ff)],
  // 핑크-퍼플
  [new THREE.Color(0xff0088), new THREE.Color(0x8800ff), new THREE.Color(0x00ccff)],
]

// ─── 단일 링 ──────────────────────────────────────────────────────────────────

interface TunnelRingProps {
  index: number
  total: number
  mousePos?: MousePosition
  paletteIdx: number
}

function TunnelRing({ index, total, mousePos, paletteIdx }: TunnelRingProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const baseZ = -index * RING_DEPTH
  const segments = 6 + (index % 3) * 2   // 6 / 8 / 10각형 교차
  const tubeRadius = 0.04 + (index % 4) * 0.01

  const palette = PALETTES[paletteIdx % PALETTES.length]
  const baseColor = palette[index % palette.length].clone()

  useFrame((state) => {
    if (!meshRef.current || !matRef.current) return
    const t = state.clock.elapsedTime

    const nx = mousePos?.nx ?? 0.5
    const ny = mousePos?.ny ?? 0.5

    // Z 위치 — 터널 앞으로 이동하며 루프
    const rawZ = baseZ + t * RING_SPEED
    const cycle = RING_DEPTH * total
    meshRef.current.position.z = ((rawZ % cycle) + cycle) % cycle - cycle * 0.5

    // 회전 — 마우스 틸트 + 자동 회전
    meshRef.current.rotation.z = t * (0.15 + index * 0.025)
    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      (ny - 0.5) * 0.6,
      0.03
    )
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      (nx - 0.5) * 0.6,
      0.03
    )

    // 반경 맥동 — index별 위상 차이로 파동 효과
    const pulse = 1 + Math.sin(t * 1.8 + index * 0.4) * 0.12
    meshRef.current.scale.setScalar(pulse)

    // 색상 순환
    const hueShift = (t * 0.15 + index * 0.05) % 1
    matRef.current.color.setHSL(hueShift, 1, 0.55)
  })

  return (
    <mesh ref={meshRef} position={[0, 0, baseZ]}>
      <torusGeometry args={[1.4 + index * 0.06, tubeRadius, 4, segments]} />
      <meshBasicMaterial ref={matRef} color={baseColor} toneMapped={false} />
    </mesh>
  )
}

// ─── 중심 기하학 오브젝트 ─────────────────────────────────────────────────────

function CenterGeometry({ mousePos }: { mousePos?: MousePosition }) {
  const groupRef = useRef<THREE.Group>(null)
  const icosaRef = useRef<THREE.Mesh>(null)
  const octaRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    const nx = mousePos?.nx ?? 0.5
    const ny = mousePos?.ny ?? 0.5

    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      (ny - 0.5) * 1.2,
      0.04
    )
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      (nx - 0.5) * 1.2 + t * 0.3,
      0.04
    )

    if (icosaRef.current) {
      const s = 1 + Math.sin(t * 2.2) * 0.2
      icosaRef.current.scale.setScalar(s)
    }
    if (octaRef.current) {
      octaRef.current.rotation.y = t * 1.5
      octaRef.current.rotation.x = t * 0.7
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 2]}>
      {/* 외부 와이어프레임 이코사헤드론 */}
      <mesh ref={icosaRef}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshBasicMaterial color={new THREE.Color(0x00ffcc)} wireframe toneMapped={false} />
      </mesh>
      {/* 내부 옥타헤드론 */}
      <mesh ref={octaRef} scale={0.25}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color={new THREE.Color(0xff44ff)} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ─── 씬 루트 ──────────────────────────────────────────────────────────────────

interface NeonTunnelSceneProps {
  mousePos?: MousePosition
}

function NeonTunnelScene({ mousePos }: NeonTunnelSceneProps) {
  const groupRef = useRef<THREE.Group>(null)
  const paletteRef = useRef(0)

  // 10초마다 팔레트 전환
  useFrame((state) => {
    paletteRef.current = Math.floor(state.clock.elapsedTime / 10) % PALETTES.length
    if (!groupRef.current) return
    const nx = mousePos?.nx ?? 0.5
    const ny = mousePos?.ny ?? 0.5
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      (nx - 0.5) * 0.6,
      0.04
    )
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      -(ny - 0.5) * 0.6,
      0.04
    )
  })

  return (
    <group ref={groupRef}>
      {Array.from({ length: RING_COUNT }).map((_, i) => (
        <TunnelRing
          key={i}
          index={i}
          total={RING_COUNT}
          mousePos={mousePos}
          paletteIdx={paletteRef.current}
        />
      ))}
      <CenterGeometry mousePos={mousePos} />
    </group>
  )
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

interface NeonTunnelProps {
  mousePos?: MousePosition
}

export function NeonTunnel({ mousePos }: NeonTunnelProps) {
  return (
    <div
      data-testid="neon-tunnel"
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 80, near: 0.1, far: 100 }}
        gl={{ antialias: true }}
        style={{ background: '#000' }}
        frameloop="always"
        dpr={[1, 2]}
      >
        <fog attach="fog" args={['#000', 8, 35]} />
        <Stars radius={40} depth={40} count={3000} factor={2.5} fade speed={0.5} />
        <NeonTunnelScene mousePos={mousePos} />
      </Canvas>
    </div>
  )
}

export default NeonTunnel
