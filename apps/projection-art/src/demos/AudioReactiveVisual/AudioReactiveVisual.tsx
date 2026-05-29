import { useRef, useState, useCallback, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '../../hooks/useAudioAnalyzer'
import type { MousePosition } from '../../types'

// ─── 상수 ────────────────────────────────────────────────────────────────────

const BAR_COUNT = 64
const BAR_WIDTH = 0.07
const BAR_GAP = 0.04
const TOTAL_WIDTH = BAR_COUNT * (BAR_WIDTH + BAR_GAP)

// ─── 파형 라인 ───────────────────────────────────────────────────────────────

interface WaveformLineProps {
  frequencyData: Uint8Array
  bassAmplitude: number
}

function WaveformLine({ frequencyData, bassAmplitude }: WaveformLineProps) {
  const lineRef = useRef<THREE.Line>(null!)
  const geometryRef = useRef<THREE.BufferGeometry>(null!)

  const pointCount = 128
  const positions = useMemo(
    () => new Float32Array(pointCount * 3),
    []
  )

  useFrame(() => {
    if (!geometryRef.current) return

    const step = Math.floor(frequencyData.length / pointCount)
    for (let i = 0; i < pointCount; i++) {
      const v = (frequencyData[i * step] ?? 0) / 255
      const x = (i / (pointCount - 1) - 0.5) * TOTAL_WIDTH * 1.2
      const y = -3.5 + v * 3.0 + bassAmplitude * 0.5
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = 0
    }
    geometryRef.current.attributes.position.needsUpdate = true
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
      <lineBasicMaterial
        color={new THREE.Color().setHSL(0.5 + bassAmplitude * 0.3, 1, 0.7)}
        toneMapped={false}
      />
    </line>
  )
}

// ─── 주파수 바 ───────────────────────────────────────────────────────────────

interface FrequencyBarsProps {
  frequencyData: Uint8Array
  mousePos?: MousePosition
}

function FrequencyBars({ frequencyData, mousePos }: FrequencyBarsProps) {
  const groupRef = useRef<THREE.Group>(null)
  const meshesRef = useRef<THREE.Mesh[]>([])
  const geometryRef = useRef<THREE.BoxGeometry>(new THREE.BoxGeometry(BAR_WIDTH, 1, 0.08))

  useFrame(() => {
    if (!groupRef.current) return

    const nx = mousePos?.nx ?? 0.5
    const ny = mousePos?.ny ?? 0.5
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      (ny - 0.5) * 0.4,
      0.07
    )
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      (nx - 0.5) * 0.8,
      0.07
    )

    const step = Math.floor(frequencyData.length / BAR_COUNT)
    meshesRef.current.forEach((mesh, i) => {
      if (!mesh) return
      const v = (frequencyData[i * step] ?? 0) / 255
      const targetH = Math.max(0.05, v * 7)
      mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, targetH, 0.2)
      mesh.position.y = mesh.scale.y * 0.5 - 2
      const mat = mesh.material as THREE.MeshBasicMaterial
      mat.color.setHSL((i / BAR_COUNT) * 0.7 + 0.45, 1, 0.4 + v * 0.3)
    })
  })

  return (
    <group ref={groupRef}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const x = (i - BAR_COUNT / 2) * (BAR_WIDTH + BAR_GAP)
        return (
          <mesh
            key={i}
            ref={(el) => { if (el) meshesRef.current[i] = el }}
            geometry={geometryRef.current}
            position={[x, 0, 0]}
          >
            <meshBasicMaterial
              color={new THREE.Color().setHSL((i / BAR_COUNT) * 0.7 + 0.45, 1, 0.5)}
              toneMapped={false}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// ─── 오디오 파티클 시스템 ─────────────────────────────────────────────────────

const AUDIO_PARTICLE_COUNT = 200

interface AudioParticlesProps {
  bassAmplitude: number
  averageAmplitude: number
}

function AudioParticles({ bassAmplitude, averageAmplitude }: AudioParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null)
  const posRef = useRef<Float32Array>(new Float32Array(AUDIO_PARTICLE_COUNT * 3))
  const velRef = useRef<Float32Array>(new Float32Array(AUDIO_PARTICLE_COUNT * 3))
  const lifetimeRef = useRef<Float32Array>(new Float32Array(AUDIO_PARTICLE_COUNT).fill(-1))

  useFrame((state) => {
    if (!particlesRef.current) return
    const t = state.clock.elapsedTime

    // 베이스 비트에 반응해 파티클 발사
    if (bassAmplitude > 0.45) {
      const count = Math.floor(bassAmplitude * 8)
      for (let k = 0; k < count; k++) {
        // 빈 슬롯 탐색
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

    // 파티클 업데이트
    for (let i = 0; i < AUDIO_PARTICLE_COUNT; i++) {
      if (lifetimeRef.current[i] < 0) continue
      posRef.current[i * 3] += velRef.current[i * 3]
      posRef.current[i * 3 + 1] += velRef.current[i * 3 + 1]
      posRef.current[i * 3 + 2] += velRef.current[i * 3 + 2]
      velRef.current[i * 3 + 1] -= 0.001  // 중력
      lifetimeRef.current[i] -= 0.015
      if (lifetimeRef.current[i] < 0) {
        posRef.current[i * 3] = 9999  // 화면 밖으로
      }
    }

    if (particlesRef.current.geometry.attributes.position) {
      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }

    // 맥동하는 크기
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
      <pointsMaterial
        size={0.08}
        color={new THREE.Color(0xff88ff)}
        transparent
        opacity={0.9}
        toneMapped={false}
        sizeAttenuation
      />
    </points>
  )
}

// ─── 씬 루트 ──────────────────────────────────────────────────────────────────

interface AudioSceneProps {
  frequencyData: Uint8Array
  bassAmplitude: number
  averageAmplitude: number
  mousePos?: MousePosition
  isActive: boolean
}

function AudioScene({
  frequencyData,
  bassAmplitude,
  averageAmplitude,
  mousePos,
  isActive,
}: AudioSceneProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    if (!isActive) {
      groupRef.current.rotation.y += state.clock.getDelta() * 0.2
    }
  })

  return (
    <group ref={groupRef}>
      <FrequencyBars frequencyData={frequencyData} mousePos={mousePos} />
      <WaveformLine frequencyData={frequencyData} bassAmplitude={bassAmplitude} />
      {isActive && (
        <AudioParticles bassAmplitude={bassAmplitude} averageAmplitude={averageAmplitude} />
      )}
    </group>
  )
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

interface AudioReactiveVisualProps {
  mousePos?: MousePosition
}

export function AudioReactiveVisual({ mousePos }: AudioReactiveVisualProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [audioSource, setAudioSource] = useState<'file' | 'microphone'>('file')
  const { state, activate, deactivate } = useAudioAnalyzer({ audioElement: audioRef.current })

  const handleStart = useCallback(async () => {
    try {
      await activate(audioSource)
      if (audioSource === 'file' && audioRef.current) {
        audioRef.current.play().catch(() => {})
      }
    } catch {
      // 에러는 useAudioAnalyzer 내부에서 처리
    }
  }, [activate, audioSource])

  const handleStop = useCallback(() => {
    deactivate()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [deactivate])

  return (
    <div
      data-testid="audio-reactive-visual"
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
    >
      <audio
        ref={audioRef}
        src="/audio/demo.mp3"
        loop
        preload="auto"
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      <Canvas
        camera={{ position: [0, 2, 10], fov: 60 }}
        gl={{ antialias: true }}
        style={{ background: '#000' }}
        dpr={[1, 2]}
      >
        <fog attach="fog" args={['#000', 15, 40]} />
        <AudioScene
          frequencyData={state.frequencyData}
          bassAmplitude={state.bassAmplitude}
          averageAmplitude={state.averageAmplitude}
          mousePos={mousePos}
          isActive={state.isActive}
        />
      </Canvas>

      {/* UI 오버레이 */}
      <div
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
        }}
      >
        {!state.isActive ? (
          <>
            <select
              data-testid="source-select"
              value={audioSource}
              onChange={(e) => setAudioSource(e.target.value as 'file' | 'microphone')}
              style={{
                background: 'rgba(0,0,0,0.7)',
                color: '#0ff',
                border: '1px solid #0ff',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              <option value="file">🎵 번들 음원</option>
              <option value="microphone">🎙️ 마이크 입력</option>
            </select>
            <button
              data-testid="start-button"
              onClick={handleStart}
              style={{
                background: 'rgba(0,255,255,0.15)',
                color: '#0ff',
                border: '1px solid #0ff',
                padding: '0.75rem 2rem',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            >
              ▶ 시작
            </button>
          </>
        ) : (
          <button
            data-testid="stop-button"
            onClick={handleStop}
            style={{
              background: 'rgba(255,0,100,0.15)',
              color: '#f06',
              border: '1px solid #f06',
              padding: '0.75rem 2rem',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          >
            ■ 정지
          </button>
        )}
      </div>

      {/* FPS 인디케이터 (활성화 중에만) */}
      {state.isActive && (
        <div
          data-testid="active-indicator"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1.5rem',
            color: '#0f0',
            fontSize: '0.8rem',
            fontFamily: 'monospace',
            opacity: 0.7,
          }}
        >
          ● LIVE {Math.round(state.averageAmplitude * 100)}%
        </div>
      )}
    </div>
  )
}

export default AudioReactiveVisual
