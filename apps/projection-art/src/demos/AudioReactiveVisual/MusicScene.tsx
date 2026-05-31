import { useRef, useMemo, useEffect } from 'react'
import type { MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { AudioData } from '../../hooks/useAudioAnalyzer'
import type { MousePosition } from '../../types'

export const BAR_COUNT = 64
export const BAR_WIDTH = 0.07
export const BAR_GAP = 0.04
export const TOTAL_WIDTH = BAR_COUNT * (BAR_WIDTH + BAR_GAP)

function WaveformLine({ audioDataRef }: { audioDataRef: MutableRefObject<AudioData> }) {
  const lineRef = useRef<THREE.Line>(null!)
  const geometryRef = useRef<THREE.BufferGeometry>(null!)
  const pointCount = 128
  const positions = useMemo(() => new Float32Array(pointCount * 3), [])

  useFrame(() => {
    if (!geometryRef.current) return
    const { frequencyData, bassAmplitude } = audioDataRef.current
    const step = Math.floor(frequencyData.length / pointCount)
    for (let i = 0; i < pointCount; i++) {
      const v = (frequencyData[i * step] ?? 0) / 255
      positions[i * 3]     = (i / (pointCount - 1) - 0.5) * TOTAL_WIDTH * 1.2
      positions[i * 3 + 1] = -3.5 + v * 3.0 + bassAmplitude * 0.5
      positions[i * 3 + 2] = 0
    }
    geometryRef.current.attributes.position.needsUpdate = true
    const mat = lineRef.current?.material as THREE.LineBasicMaterial
    if (mat) mat.color.setHSL(0.5 + bassAmplitude * 0.3, 1, 0.7)
  })

  return (
    <line ref={lineRef}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={pointCount}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={0x00ffff} toneMapped={false} />
    </line>
  )
}

function FrequencyBars({
  audioDataRef,
  mousePos,
}: {
  audioDataRef: MutableRefObject<AudioData>
  mousePos?: MousePosition
}) {
  const groupRef = useRef<THREE.Group>(null)
  const meshesRef = useRef<THREE.Mesh[]>([])
  const geometryRef = useRef(new THREE.BoxGeometry(BAR_WIDTH, 1, 0.08))

  useEffect(() => () => { geometryRef.current.dispose() }, [])

  useFrame(() => {
    if (!groupRef.current) return
    const nx = mousePos?.nx ?? 0.5
    const ny = mousePos?.ny ?? 0.5
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x, (ny - 0.5) * 0.4, 0.07
    )
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y, (nx - 0.5) * 0.8, 0.07
    )

    const { frequencyData } = audioDataRef.current
    const step = Math.floor(frequencyData.length / BAR_COUNT)
    meshesRef.current.forEach((mesh, i) => {
      if (!mesh) return
      const v = (frequencyData[i * step] ?? 0) / 255
      mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, Math.max(0.05, v * 7), 0.2)
      mesh.position.y = mesh.scale.y * 0.5 - 2
      const mat = mesh.material as THREE.MeshBasicMaterial
      mat.color.setHSL((i / BAR_COUNT) * 0.7 + 0.45, 1, 0.4 + v * 0.3)
    })
  })

  return (
    <group ref={groupRef}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) meshesRef.current[i] = el }}
          geometry={geometryRef.current}
          position={[(i - BAR_COUNT / 2) * (BAR_WIDTH + BAR_GAP), 0, 0]}
        >
          <meshBasicMaterial
            color={new THREE.Color().setHSL((i / BAR_COUNT) * 0.7 + 0.45, 1, 0.5)}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

const AUDIO_PARTICLE_COUNT = 200

function AudioParticles({ audioDataRef }: { audioDataRef: MutableRefObject<AudioData> }) {
  const particlesRef = useRef<THREE.Points>(null)
  const posRef = useRef(new Float32Array(AUDIO_PARTICLE_COUNT * 3))
  const velRef = useRef(new Float32Array(AUDIO_PARTICLE_COUNT * 3))
  const lifetimeRef = useRef(new Float32Array(AUDIO_PARTICLE_COUNT).fill(-1))

  useFrame((state) => {
    if (!particlesRef.current) return
    const t = state.clock.elapsedTime
    const { bassAmplitude, averageAmplitude } = audioDataRef.current

    if (bassAmplitude > 0.45) {
      const count = Math.floor(bassAmplitude * 8)
      for (let k = 0; k < count; k++) {
        const slot = lifetimeRef.current.findIndex(l => l < 0)
        if (slot < 0) break
        const angle = Math.random() * Math.PI * 2
        const speed = 0.04 + bassAmplitude * 0.08
        posRef.current[slot * 3] = 0
        posRef.current[slot * 3 + 1] = 0
        posRef.current[slot * 3 + 2] = 0
        velRef.current[slot * 3] = Math.cos(angle) * speed
        velRef.current[slot * 3 + 1] = Math.sin(angle) * speed + 0.02
        velRef.current[slot * 3 + 2] = (Math.random() - 0.5) * 0.03
        lifetimeRef.current[slot] = 1.0
      }
    }

    for (let i = 0; i < AUDIO_PARTICLE_COUNT; i++) {
      if (lifetimeRef.current[i] < 0) continue
      posRef.current[i * 3]     += velRef.current[i * 3]
      posRef.current[i * 3 + 1] += velRef.current[i * 3 + 1]
      posRef.current[i * 3 + 2] += velRef.current[i * 3 + 2]
      velRef.current[i * 3 + 1] -= 0.001
      lifetimeRef.current[i] -= 0.015
      if (lifetimeRef.current[i] < 0) posRef.current[i * 3] = 9999
    }

    if (particlesRef.current.geometry.attributes.position) {
      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }
    const mat = particlesRef.current.material as THREE.PointsMaterial
    mat.size = 0.06 + averageAmplitude * 0.12 + Math.sin(t * 4) * 0.01
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={posRef.current}
          count={AUDIO_PARTICLE_COUNT}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.08} color={0xff88ff} transparent opacity={0.9} toneMapped={false} sizeAttenuation />
    </points>
  )
}

export interface MusicSceneProps {
  audioDataRef: MutableRefObject<AudioData>
  mousePos?: MousePosition
  isActive: boolean
}

export function MusicScene({ audioDataRef, mousePos, isActive }: MusicSceneProps) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (!groupRef.current || isActive) return
    groupRef.current.rotation.y += delta * 0.2
  })
  return (
    <group ref={groupRef}>
      <FrequencyBars audioDataRef={audioDataRef} mousePos={mousePos} />
      <WaveformLine audioDataRef={audioDataRef} />
      {isActive && <AudioParticles audioDataRef={audioDataRef} />}
    </group>
  )
}
