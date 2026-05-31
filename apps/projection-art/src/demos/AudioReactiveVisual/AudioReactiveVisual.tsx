import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '../../hooks/useAudioAnalyzer'
import type { MousePosition } from '../../types'

// ─── 타입 ────────────────────────────────────────────────────────────────────

type DemoMode = 'music' | 'tab' | 'voice'

// ─── 공유 상수 ────────────────────────────────────────────────────────────────

const BAR_COUNT = 64
const BAR_WIDTH = 0.07
const BAR_GAP = 0.04
const TOTAL_WIDTH = BAR_COUNT * (BAR_WIDTH + BAR_GAP)

// ─── 음악 모드 씬 ─────────────────────────────────────────────────────────────

function WaveformLine({
  frequencyData,
  bassAmplitude,
}: {
  frequencyData: Uint8Array
  bassAmplitude: number
}) {
  const lineRef = useRef<THREE.Line>(null!)
  const geometryRef = useRef<THREE.BufferGeometry>(null!)
  const pointCount = 128
  const positions = useMemo(() => new Float32Array(pointCount * 3), [])

  useFrame(() => {
    if (!geometryRef.current) return
    const step = Math.floor(frequencyData.length / pointCount)
    for (let i = 0; i < pointCount; i++) {
      const v = (frequencyData[i * step] ?? 0) / 255
      positions[i * 3]     = (i / (pointCount - 1) - 0.5) * TOTAL_WIDTH * 1.2
      positions[i * 3 + 1] = -3.5 + v * 3.0 + bassAmplitude * 0.5
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

function FrequencyBars({
  frequencyData,
  mousePos,
}: {
  frequencyData: Uint8Array
  mousePos?: MousePosition
}) {
  const groupRef = useRef<THREE.Group>(null)
  const meshesRef = useRef<THREE.Mesh[]>([])
  const geometryRef = useRef(new THREE.BoxGeometry(BAR_WIDTH, 1, 0.08))

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

function AudioParticles({
  bassAmplitude,
  averageAmplitude,
}: {
  bassAmplitude: number
  averageAmplitude: number
}) {
  const particlesRef = useRef<THREE.Points>(null)
  const posRef = useRef(new Float32Array(AUDIO_PARTICLE_COUNT * 3))
  const velRef = useRef(new Float32Array(AUDIO_PARTICLE_COUNT * 3))
  const lifetimeRef = useRef(new Float32Array(AUDIO_PARTICLE_COUNT).fill(-1))

  useFrame((state) => {
    if (!particlesRef.current) return
    const t = state.clock.elapsedTime

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

function MusicScene({
  frequencyData,
  bassAmplitude,
  averageAmplitude,
  mousePos,
  isActive,
}: {
  frequencyData: Uint8Array
  bassAmplitude: number
  averageAmplitude: number
  mousePos?: MousePosition
  isActive: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!groupRef.current || isActive) return
    groupRef.current.rotation.y += state.clock.getDelta() * 0.2
  })
  return (
    <group ref={groupRef}>
      <FrequencyBars frequencyData={frequencyData} mousePos={mousePos} />
      <WaveformLine frequencyData={frequencyData} bassAmplitude={bassAmplitude} />
      {isActive && <AudioParticles bassAmplitude={bassAmplitude} averageAmplitude={averageAmplitude} />}
    </group>
  )
}

// ─── 음성 모드 씬 ─────────────────────────────────────────────────────────────

const WAVE_POINTS = 512
const WAVE_WIDTH = 16

function VoiceWave({
  timeDomainData,
  isVoiceActive,
}: {
  timeDomainData: Uint8Array
  isVoiceActive: boolean
}) {
  const lineRef = useRef<THREE.Line>(null!)
  const posRef = useRef(new Float32Array(WAVE_POINTS * 3))
  const colorRef = useRef(new THREE.Color(0x004422))
  const targetColor = useRef(new THREE.Color())

  useFrame(() => {
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
  averageAmplitude,
  isVoiceActive,
  mousePos,
}: {
  averageAmplitude: number
  isVoiceActive: boolean
  mousePos?: MousePosition
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const scaleRef = useRef(0.5)

  useFrame(() => {
    if (!meshRef.current) return
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

function VoiceScene({
  timeDomainData,
  averageAmplitude,
  isVoiceActive,
  mousePos,
}: {
  timeDomainData: Uint8Array
  averageAmplitude: number
  isVoiceActive: boolean
  mousePos?: MousePosition
}) {
  return (
    <group>
      <VoiceWave timeDomainData={timeDomainData} isVoiceActive={isVoiceActive} />
      <EnergyRing averageAmplitude={averageAmplitude} isVoiceActive={isVoiceActive} mousePos={mousePos} />
    </group>
  )
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

interface AudioReactiveVisualProps {
  mousePos?: MousePosition
}

export function AudioReactiveVisual({ mousePos }: AudioReactiveVisualProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<DemoMode>('music')
  const [audioFileName, setAudioFileName] = useState<string | null>(null)
  const [audioFileUrl, setAudioFileUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { state, activate, deactivate } = useAudioAnalyzer({ audioElement: audioRef.current })

  // object URL 정리
  useEffect(() => {
    return () => { if (audioFileUrl) URL.revokeObjectURL(audioFileUrl) }
  }, [audioFileUrl])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (audioFileUrl) URL.revokeObjectURL(audioFileUrl)
    const url = URL.createObjectURL(file)
    setAudioFileUrl(url)
    setAudioFileName(file.name)
    if (audioRef.current) {
      audioRef.current.src = url
      audioRef.current.load()
    }
  }, [audioFileUrl])

  const handleStart = useCallback(async () => {
    setError(null)
    try {
      if (mode === 'music') {
        await activate('file')
        audioRef.current?.play().catch(() => {})
      } else if (mode === 'tab') {
        await activate('tab')
      } else {
        await activate('microphone')
      }
    } catch {
      const messages: Record<DemoMode, string> = {
        music: '오디오 파일을 재생할 수 없습니다.',
        tab: '탭 오디오 캡처가 취소됐거나 권한이 거부됐습니다.',
        voice: '마이크 권한이 필요합니다. 브라우저에서 마이크 접근을 허용해주세요.',
      }
      setError(messages[mode])
    }
  }, [activate, mode])

  const handleStop = useCallback(() => {
    deactivate()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [deactivate])

  const handleRetab = useCallback(async () => {
    deactivate()
    setError(null)
    try {
      await activate('tab')
    } catch {
      setError('탭 오디오 캡처가 취소됐거나 권한이 거부됐습니다.')
    }
  }, [activate, deactivate])

  const canStart = mode !== 'music' || audioFileUrl !== null

  const rmsPercent = Math.round(state.averageAmplitude * 100)

  return (
    <div
      data-testid="audio-reactive-visual"
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
    >
      <audio ref={audioRef} loop preload="auto" style={{ display: 'none' }} aria-hidden="true" />
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        data-testid="file-input"
      />

      <Canvas
        camera={{ position: [0, 2, 10], fov: 60 }}
        gl={{ antialias: true }}
        style={{ background: '#000' }}
        dpr={[1, 2]}
      >
        <fog attach="fog" args={['#000', 15, 40]} />
        {mode !== 'voice' ? (
          <MusicScene
            frequencyData={state.frequencyData}
            bassAmplitude={state.bassAmplitude}
            averageAmplitude={state.averageAmplitude}
            mousePos={mousePos}
            isActive={state.isActive}
          />
        ) : (
          <VoiceScene
            timeDomainData={state.timeDomainData}
            averageAmplitude={state.averageAmplitude}
            isVoiceActive={state.isVoiceActive}
            mousePos={mousePos}
          />
        )}
      </Canvas>

      {/* 활성 표시 */}
      {state.isActive && (
        <div
          data-testid="active-indicator"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1.5rem',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            color: mode === 'voice'
              ? (state.isVoiceActive ? '#00ff88' : '#224433')
              : '#0ff',
            opacity: 0.8,
          }}
        >
          {mode === 'voice'
            ? (state.isVoiceActive ? '● SPEAKING' : '· LISTENING')
            : `● LIVE ${rmsPercent}%`}
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div
          data-testid="error-message"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#f66',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            textAlign: 'center',
            background: 'rgba(0,0,0,0.85)',
            padding: '1rem 2rem',
            borderRadius: '4px',
            border: '1px solid #f66',
          }}
        >
          {error}
        </div>
      )}

      {/* 하단 컨트롤 */}
      <div
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
        }}
      >
        {!state.isActive ? (
          <>
            {/* 모드 선택 */}
            <div
              data-testid="mode-selector"
              style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', overflow: 'hidden' }}
            >
              {(['music', 'tab', 'voice'] as DemoMode[]).map((m) => (
                <button
                  key={m}
                  data-testid={`mode-btn-${m}`}
                  onClick={() => setMode(m)}
                  style={{
                    background: mode === m ? 'rgba(0,255,255,0.15)' : 'transparent',
                    color: mode === m ? '#0ff' : '#666',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    fontSize: '0.82rem',
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                  }}
                >
                  {m === 'music' ? '🎵 음악' : m === 'tab' ? '🖥 탭' : '🎙 음성'}
                </button>
              ))}
            </div>

            {/* 음악 모드만 파일 피커 표시 */}
            {mode === 'music' && (
              <button
                data-testid="file-select-btn"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: audioFileName ? 'rgba(0,255,255,0.08)' : 'transparent',
                  color: audioFileName ? '#0ff' : '#555',
                  border: '1px solid',
                  borderColor: audioFileName ? 'rgba(0,255,255,0.4)' : 'rgba(255,255,255,0.15)',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontFamily: 'monospace',
                  maxWidth: '180px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
                title={audioFileName ?? '오디오 파일 선택'}
              >
                {audioFileName ?? '📂 파일 선택'}
              </button>
            )}

            {/* 탭 모드: 안내 */}
            {mode === 'tab' && (
              <span
                style={{
                  color: '#555',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  maxWidth: '200px',
                  lineHeight: 1.4,
                }}
              >
                Chrome 공유 팝업에서<br />탭 선택 + 오디오 체크
              </span>
            )}

            <button
              data-testid="start-button"
              onClick={handleStart}
              disabled={!canStart}
              style={{
                background: canStart ? 'rgba(0,255,255,0.15)' : 'rgba(255,255,255,0.03)',
                color: canStart ? '#0ff' : '#444',
                border: `1px solid ${canStart ? '#0ff' : '#333'}`,
                padding: '0.5rem 1.5rem',
                borderRadius: '4px',
                fontSize: '0.82rem',
                fontFamily: 'monospace',
                cursor: canStart ? 'pointer' : 'not-allowed',
              }}
            >
              ▶ 시작
            </button>
          </>
        ) : (
          <>
            {mode === 'tab' && (
              <button
                data-testid="retab-button"
                onClick={handleRetab}
                style={{
                  background: 'rgba(0,255,255,0.08)',
                  color: '#0cc',
                  border: '1px solid rgba(0,255,255,0.3)',
                  padding: '0.5rem 1.2rem',
                  borderRadius: '4px',
                  fontSize: '0.82rem',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                }}
              >
                🔄 탭 변경
              </button>
            )}
            <button
              data-testid="stop-button"
              onClick={handleStop}
              style={{
                background: 'rgba(255,0,100,0.15)',
                color: '#f06',
                border: '1px solid #f06',
                padding: '0.5rem 1.5rem',
                borderRadius: '4px',
                fontSize: '0.82rem',
                fontFamily: 'monospace',
                cursor: 'pointer',
              }}
            >
              ■ 정지
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default AudioReactiveVisual
