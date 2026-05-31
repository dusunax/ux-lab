import { useRef, useState, useCallback, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { useAudioAnalyzer } from '../../hooks/useAudioAnalyzer'
import type { MousePosition } from '../../types'
import { MusicScene } from './MusicScene'
import { VoiceScene } from './VoiceScene'

// ─── 타입 ────────────────────────────────────────────────────────────────────

type DemoMode = 'music' | 'tab' | 'voice'

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
  const [rmsPercent, setRmsPercent] = useState(0)
  const { isActive, isVoiceActive, audioDataRef, activate, deactivate } = useAudioAnalyzer({
    audioElementRef: audioRef,
  })

  useEffect(() => {
    return () => { if (audioFileUrl) URL.revokeObjectURL(audioFileUrl) }
  }, [audioFileUrl])

  // rmsPercent 100ms 주기 업데이트 — per-frame setState 제거
  useEffect(() => {
    if (!isActive) {
      setRmsPercent(0)
      return
    }
    const id = setInterval(() => {
      setRmsPercent(Math.round(audioDataRef.current.averageAmplitude * 100))
    }, 100)
    return () => clearInterval(id)
  }, [isActive, audioDataRef])

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
        dpr={[1, 1.5]}
      >
        <fog attach="fog" args={['#000', 15, 40]} />
        {mode !== 'voice' ? (
          <MusicScene
            audioDataRef={audioDataRef}
            mousePos={mousePos}
            isActive={isActive}
          />
        ) : (
          <VoiceScene
            audioDataRef={audioDataRef}
            isVoiceActive={isVoiceActive}
            mousePos={mousePos}
          />
        )}
      </Canvas>

      {/* 활성 표시 */}
      {isActive && (
        <div
          data-testid="active-indicator"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1.5rem',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            color: mode === 'voice'
              ? (isVoiceActive ? '#00ff88' : '#224433')
              : '#0ff',
            opacity: 0.8,
          }}
        >
          {mode === 'voice'
            ? (isVoiceActive ? '● SPEAKING' : '· LISTENING')
            : `● LIVE ${rmsPercent}%`}
        </div>
      )}

      {/* 에러 — 컨트롤 바로 위 */}
      {error && (
        <div
          data-testid="error-message"
          style={{
            position: 'absolute',
            bottom: '7rem',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#f66',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            textAlign: 'center',
            background: 'rgba(0,0,0,0.85)',
            padding: '0.6rem 1.5rem',
            borderRadius: '4px',
            border: '1px solid #f66',
            whiteSpace: 'nowrap',
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
        {!isActive ? (
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
                Chrome 공유 팝업에서<br />탭 선택 + 탭 오디오 공유 체크
              </span>
            )}

            {/* 음성 모드: 노이즈 게이트 안내 */}
            {mode === 'voice' && (
              <span
                style={{
                  color: '#444',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  maxWidth: '180px',
                  lineHeight: 1.4,
                }}
              >
                조용한 환경에서<br />목소리로 반응합니다
              </span>
            )}

            <button
              data-testid="start-button"
              onClick={handleStart}
              disabled={!canStart}
              title={!canStart ? '파일을 먼저 선택해주세요' : undefined}
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
                🔄 탭 다시 선택
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
