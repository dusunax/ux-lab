import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Torus, Stars } from '@react-three/drei'
import * as THREE from 'three'
import type { MousePosition } from '../../types'

const TUNNEL_SEGMENTS = 12
const TUNNEL_DEPTH = 3

interface TunnelRingProps {
  index: number
  total: number
  mousePos?: MousePosition
}

function TunnelRing({ index, total, mousePos }: TunnelRingProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const z = -index * TUNNEL_DEPTH

  const hue = (index / total) * 0.8

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime

    const nx = mousePos?.nx ?? 0.5
    const ny = mousePos?.ny ?? 0.5
    const tiltX = (ny - 0.5) * 0.3
    const tiltY = (nx - 0.5) * 0.3

    meshRef.current.rotation.z = t * 0.3 + index * 0.2
    meshRef.current.rotation.x = tiltX
    meshRef.current.rotation.y = tiltY

    // 터널 앞으로 이동 — 사이클 루프
    meshRef.current.position.z =
      ((z + t * 4 + TUNNEL_DEPTH * total) % (TUNNEL_DEPTH * total)) - TUNNEL_DEPTH * total * 0.5
  })

  return (
    <Torus
      ref={meshRef}
      args={[1.5 + index * 0.05, 0.05, 6, 80]}
      position={[0, 0, z]}
    >
      <meshBasicMaterial
        color={new THREE.Color().setHSL(hue, 1, 0.6)}
        toneMapped={false}
      />
    </Torus>
  )
}

interface NeonTunnelSceneProps {
  mousePos?: MousePosition
}

function NeonTunnelScene({ mousePos }: NeonTunnelSceneProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    const nx = mousePos?.nx ?? 0.5
    const ny = mousePos?.ny ?? 0.5
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      (ny - 0.5) * 0.4,
      0.05
    )
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      (nx - 0.5) * 0.4,
      0.05
    )
    // Subtle oscillation
    groupRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
  })

  return (
    <group ref={groupRef}>
      {Array.from({ length: TUNNEL_SEGMENTS }).map((_, i) => (
        <TunnelRing key={i} index={i} total={TUNNEL_SEGMENTS} mousePos={mousePos} />
      ))}
    </group>
  )
}

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
        camera={{ position: [0, 0, 5], fov: 75, near: 0.1, far: 100 }}
        gl={{ antialias: true }}
        style={{ background: '#000' }}
        frameloop="always"
        dpr={[1, 2]}
      >
        <fog attach="fog" args={['#000', 5, 30]} />
        <Stars radius={30} depth={30} count={2000} factor={2} fade speed={1} />
        <NeonTunnelScene mousePos={mousePos} />
      </Canvas>
    </div>
  )
}

export default NeonTunnel
