import { useRef, useState, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '../../hooks/useAudioAnalyzer'
import type { MousePosition } from '../../types'

const BAR_COUNT = 64
const BAR_WIDTH = 0.08
const BAR_GAP = 0.05

interface FrequencyBarProps {
  index: number
  total: number
  amplitude: number
  hue: number
}

function FrequencyBar({ index, total, amplitude, hue }: FrequencyBarProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const height = Math.max(0.05, amplitude * 8)
  const x = (index - total / 2) * (BAR_WIDTH + BAR_GAP)

  useFrame(() => {
    if (!meshRef.current) return
    const target = new THREE.Vector3(x, height / 2 - 2, 0)
    meshRef.current.position.lerp(target, 0.15)
    const targetScale = new THREE.Vector3(BAR_WIDTH, height, 0.1)
    meshRef.current.scale.lerp(targetScale, 0.15)
  })

  return (
    <mesh ref={meshRef} position={[x, 0, 0]}>
      <boxGeometry args={[BAR_WIDTH, 1, 0.1]} />
      <meshBasicMaterial
        color={new THREE.Color().setHSL(hue / 360, 1, 0.5 + amplitude * 0.3)}
        toneMapped={false}
      />
    </mesh>
  )
}

interface AudioSceneProps {
  frequencyData: Uint8Array
  mousePos?: MousePosition
  isActive: boolean
}

function AudioScene({ frequencyData, mousePos, isActive }: AudioSceneProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    const nx = mousePos?.nx ?? 0.5
    const ny = mousePos?.ny ?? 0.5
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      (ny - 0.5) * 0.5,
      0.08
    )
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      (nx - 0.5) * 1.0,
      0.08
    )
    if (!isActive) {
      groupRef.current.rotation.y += state.clock.getDelta() * 0.3
    }
  })

  // Downsample frequencyData to BAR_COUNT
  const step = Math.floor(frequencyData.length / BAR_COUNT)
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const value = frequencyData[i * step] ?? 0
    return value / 255
  })

  return (
    <group ref={groupRef}>
      {bars.map((amp, i) => (
        <FrequencyBar
          key={i}
          index={i}
          total={BAR_COUNT}
          amplitude={amp}
          hue={(i / BAR_COUNT) * 300 + 180}
        />
      ))}
    </group>
  )
}

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
      {/* hidden audio element for bundled file */}
      <audio
        ref={audioRef}
        src="/audio/demo.mp3"
        loop
        preload="auto"
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true }}
        style={{ background: '#000' }}
        dpr={[1, 2]}
      >
        <AudioScene
          frequencyData={state.frequencyData}
          mousePos={mousePos}
          isActive={state.isActive}
        />
      </Canvas>

      {/* UI overlay */}
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
    </div>
  )
}

export default AudioReactiveVisual
