import { useRef } from 'react'
import type { MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { AudioData } from '../../hooks/useAudioAnalyzer'
import type { MousePosition } from '../../types'

const WAVE_POINTS = 512
const WAVE_WIDTH = 16

function VoiceWave({
  audioDataRef,
  isVoiceActive,
}: {
  audioDataRef: MutableRefObject<AudioData>
  isVoiceActive: boolean
}) {
  const lineRef = useRef<THREE.Line>(null!)
  const posRef = useRef(new Float32Array(WAVE_POINTS * 3))
  const colorRef = useRef(new THREE.Color(0x004422))
  const targetColor = useRef(new THREE.Color())

  useFrame(() => {
    const { timeDomainData } = audioDataRef.current
    const step = Math.max(1, Math.floor(timeDomainData.length / WAVE_POINTS))
    for (let i = 0; i < WAVE_POINTS; i++) {
      const v = ((timeDomainData[i * step] ?? 128) - 128) / 128
      posRef.current[i * 3]     = (i / (WAVE_POINTS - 1) - 0.5) * WAVE_WIDTH
      posRef.current[i * 3 + 1] = isVoiceActive ? v * 3.2 : v * 0.06
      posRef.current[i * 3 + 2] = 0
    }
    const geo = lineRef.current?.geometry
    if (geo) geo.attributes.position.needsUpdate = true

    targetColor.current.set(isVoiceActive ? 0x00ff88 : 0x003311)
    colorRef.current.lerp(targetColor.current, 0.08)
    const mat = lineRef.current?.material as THREE.LineBasicMaterial
    if (mat) mat.color.copy(colorRef.current)
  })

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={posRef.current}
          count={WAVE_POINTS}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={0x003311} toneMapped={false} />
    </line>
  )
}

function EnergyRing({
  audioDataRef,
  isVoiceActive,
  mousePos,
}: {
  audioDataRef: MutableRefObject<AudioData>
  isVoiceActive: boolean
  mousePos?: MousePosition
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const scaleRef = useRef(0.5)

  useFrame(() => {
    if (!meshRef.current) return
    const { averageAmplitude } = audioDataRef.current
    const nx = mousePos?.nx ?? 0.5
    const ny = mousePos?.ny ?? 0.5
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, (ny - 0.5) * 0.6, 0.05)
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, (nx - 0.5) * 1.0, 0.05)
    scaleRef.current = THREE.MathUtils.lerp(
      scaleRef.current, isVoiceActive ? 0.5 + averageAmplitude * 4 : 0.3, 0.12
    )
    meshRef.current.scale.setScalar(scaleRef.current)
    const mat = meshRef.current.material as THREE.MeshBasicMaterial
    mat.color.setHSL(
      isVoiceActive ? 0.38 + averageAmplitude * 0.15 : 0.35,
      isVoiceActive ? 1 : 0.3,
      isVoiceActive ? 0.3 + averageAmplitude * 0.3 : 0.1
    )
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -2]}>
      <torusGeometry args={[3.5, 0.04, 8, 96]} />
      <meshBasicMaterial color={0x004422} toneMapped={false} />
    </mesh>
  )
}

export interface VoiceSceneProps {
  audioDataRef: MutableRefObject<AudioData>
  isVoiceActive: boolean
  mousePos?: MousePosition
}

export function VoiceScene({ audioDataRef, isVoiceActive, mousePos }: VoiceSceneProps) {
  return (
    <group>
      <VoiceWave audioDataRef={audioDataRef} isVoiceActive={isVoiceActive} />
      <EnergyRing audioDataRef={audioDataRef} isVoiceActive={isVoiceActive} mousePos={mousePos} />
    </group>
  )
}
