import { useState, useCallback, lazy, Suspense, type CSSProperties } from 'react'
import { KeystoneOverlay, loadTransform, screenToProjectionPoint, KEYSTONE_STORAGE_KEY, defaultTransform } from '../components/KeystoneOverlay'
import type { ProjectionTransform } from '../components/KeystoneOverlay'
import type { MousePosition } from '../types'

const ParticleFlow      = lazy(() => import('../demos/ParticleFlow/ParticleFlow').then(m => ({ default: m.ParticleFlow })))
const NeonTunnel        = lazy(() => import('../demos/NeonTunnel/NeonTunnel').then(m => ({ default: m.NeonTunnel })))
const AudioReactiveVisual = lazy(() => import('../demos/AudioReactiveVisual/AudioReactiveVisual').then(m => ({ default: m.AudioReactiveVisual })))
const HandReactive      = lazy(() => import('../demos/HandReactive/HandReactive').then(m => ({ default: m.HandReactive })))
const PoseReactive      = lazy(() => import('../demos/PoseReactive/PoseReactive').then(m => ({ default: m.PoseReactive })))

// mix-blend-mode: screen — 검정은 투명하게 처리되어 밝은 색만 합성됨
const LAYER: CSSProperties = {
  position: 'absolute',
  inset: 0,
  mixBlendMode: 'screen',
  pointerEvents: 'none',
}

// 웹캠 필요 레이어는 pointer-events 유지
const LAYER_INTERACTIVE: CSSProperties = {
  ...LAYER,
  pointerEvents: 'auto',
}

export function CombinedDemo() {
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0, nx: 0.5, ny: 0.5 })
  const [transform, setTransform] = useState<ProjectionTransform>(loadTransform)
  const [showKeystone, setShowKeystone] = useState(false)
  const [showHandLayer, setShowHandLayer] = useState(false)
  const [showPoseLayer, setShowPoseLayer] = useState(false)

  const handleTransformChange = useCallback((t: ProjectionTransform) => {
    setTransform(t)
    localStorage.setItem(KEYSTONE_STORAGE_KEY, JSON.stringify(t))
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const point = screenToProjectionPoint(transform, e.clientX, e.clientY)
    setMousePos(point)
  }, [transform])

  const handleKeystoneReset = useCallback(() => {
    handleTransformChange(defaultTransform(window.innerWidth, window.innerHeight))
  }, [handleTransformChange])

  return (
    <div
      data-testid="combined-demo"
      style={{ width: '100%', height: '100%', background: '#000', position: 'relative', overflow: 'hidden' }}
      onMouseMove={handleMouseMove}
    >
      <KeystoneOverlay
        visible={showKeystone}
        transform={transform}
        onTransformChange={handleTransformChange}
        onClose={() => setShowKeystone(false)}
      >
        {/* Layer A — Particle Flow (마우스 기반, 투명 배경) */}
        <div style={LAYER}>
          <Suspense fallback={null}>
            <ParticleFlow mousePos={mousePos} />
          </Suspense>
        </div>

        {/* Layer B — Neon Tunnel (마우스 기반) */}
        <div style={LAYER}>
          <Suspense fallback={null}>
            <NeonTunnel mousePos={mousePos} />
          </Suspense>
        </div>

        {/* Layer C — Audio Reactive (오디오/마우스 기반) */}
        <div style={LAYER}>
          <Suspense fallback={null}>
            <AudioReactiveVisual mousePos={mousePos} />
          </Suspense>
        </div>

        {/* Layer D — Hand Reactive (웹캠, 선택적 활성화) */}
        {showHandLayer && (
          <div style={LAYER_INTERACTIVE}>
            <Suspense fallback={null}>
              <HandReactive />
            </Suspense>
          </div>
        )}

        {/* Layer E — Pose Reactive (웹캠 + AI, 선택적 활성화) */}
        {showPoseLayer && (
          <div style={LAYER_INTERACTIVE}>
            <Suspense fallback={null}>
              <PoseReactive />
            </Suspense>
          </div>
        )}
      </KeystoneOverlay>

      {/* 상단 네비게이션 */}
      <nav
        data-testid="combined-nav"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          zIndex: 150,
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
        }}
      >
        <button
          data-testid="back-btn"
          onClick={() => { window.location.hash = '' }}
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: '#aaa',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '4px',
            padding: '0.4rem 0.8rem',
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          ← 데모 선택
        </button>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* 웹캠 레이어 토글 */}
          <button
            data-testid="toggle-hand-layer"
            onClick={() => setShowHandLayer(v => !v)}
            style={{
              background: showHandLayer ? 'rgba(0,255,150,0.12)' : 'rgba(255,255,255,0.05)',
              color: showHandLayer ? '#0f9' : '#666',
              border: `1px solid ${showHandLayer ? 'rgba(0,255,150,0.35)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: '4px',
              padding: '0.4rem 0.8rem',
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            {showHandLayer ? '✋ 손 켜짐' : '✋ 손 추가'}
          </button>

          <button
            data-testid="toggle-pose-layer"
            onClick={() => setShowPoseLayer(v => !v)}
            style={{
              background: showPoseLayer ? 'rgba(180,100,255,0.12)' : 'rgba(255,255,255,0.05)',
              color: showPoseLayer ? '#c8f' : '#666',
              border: `1px solid ${showPoseLayer ? 'rgba(180,100,255,0.35)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: '4px',
              padding: '0.4rem 0.8rem',
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            {showPoseLayer ? '🕺 몸 켜짐' : '🕺 몸 추가'}
          </button>

          <button
            data-testid="combined-keystone-btn"
            onClick={() => setShowKeystone(v => !v)}
            style={{
              background: showKeystone ? 'rgba(255,200,0,0.12)' : 'rgba(255,255,255,0.05)',
              color: showKeystone ? '#ffc800' : '#666',
              border: `1px solid ${showKeystone ? 'rgba(255,200,0,0.35)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: '4px',
              padding: '0.4rem 0.8rem',
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            화면 맞추기
          </button>

          {showKeystone && (
            <button
              data-testid="combined-keystone-reset-btn"
              onClick={handleKeystoneReset}
              style={{
                background: 'rgba(255,200,0,0.08)',
                color: '#ffc800',
                border: '1px solid rgba(255,200,0,0.25)',
                borderRadius: '4px',
                padding: '0.4rem 0.8rem',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              초기화
            </button>
          )}
        </div>
      </nav>

      {/* 좌측 하단 레이어 상태 표시 */}
      <div
        style={{
          position: 'absolute',
          bottom: '1rem',
          left: '1rem',
          zIndex: 150,
          display: 'flex',
          gap: '0.35rem',
          flexWrap: 'wrap',
          maxWidth: '320px',
        }}
      >
        {(['입자 흐름', '빛의 통로', '소리 그림'] as const).map(name => (
          <span
            key={name}
            style={{
              fontSize: '0.65rem',
              padding: '0.2rem 0.45rem',
              borderRadius: '3px',
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.45)',
              fontFamily: 'monospace',
            }}
          >
            {name}
          </span>
        ))}
        {showHandLayer && (
          <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.45rem', borderRadius: '3px', background: 'rgba(0,255,150,0.1)', color: '#0f9', fontFamily: 'monospace' }}>
            손 추적
          </span>
        )}
        {showPoseLayer && (
          <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.45rem', borderRadius: '3px', background: 'rgba(180,100,255,0.1)', color: '#c8f', fontFamily: 'monospace' }}>
            포즈 AI
          </span>
        )}
      </div>
    </div>
  )
}
