import { Suspense, lazy, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Canvas } from '@react-three/fiber'
import { useMotionTracker } from '../../../hooks/useMotionTracker'
import type { InteractionPoint } from '../../../types'

const UnderwaterScene = lazy(() =>
  import('./UnderwaterScene').then(m => ({ default: m.UnderwaterScene }))
)

// ─── 상수 ────────────────────────────────────────────────────────────────────
const OVERLAY_WRAPPER_STYLE: React.CSSProperties = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '380px',
  minHeight: '0',
  borderRadius: '24px',
  overflow: 'hidden',
  zIndex: 200,
  background: 'linear-gradient(145deg, rgba(202,240,248,0.16), rgba(0,119,182,0.08) 42%, rgba(0,0,0,0.28))',
  border: '1px solid rgba(202,240,248,0.28)',
  boxShadow: '0 24px 80px rgba(0,0,0,0.68), inset 0 1px 0 rgba(255,255,255,0.18)',
  backdropFilter: 'blur(18px) saturate(140%)',
  WebkitBackdropFilter: 'blur(18px) saturate(140%)',
  padding: '26px 28px 22px',
  color: '#e6fbff',
}

const MODAL_BUTTON_STYLE: React.CSSProperties = {
  width: '100%',
  marginTop: '24px',
  padding: '0.82rem 1rem',
  borderRadius: '999px',
  border: '1px solid rgba(128,255,219,0.62)',
  background: 'linear-gradient(135deg, rgba(128,255,219,0.22), rgba(0,180,216,0.16))',
  color: '#dcfffb',
  fontSize: '0.92rem',
  fontWeight: 700,
  letterSpacing: '0.02em',
  cursor: 'pointer',
  boxShadow: '0 0 26px rgba(128,255,219,0.16), inset 0 1px 0 rgba(255,255,255,0.16)',
}

const ROOT_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  background: '#000',
}

const EDGE_SHADOW_STYLE: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 80,
  pointerEvents: 'none',
  background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 38%, rgba(0,0,0,0.62) 76%, rgba(0,0,0,0.92) 100%)',
}

function UnderwaterPermissionModal({
  status,
  onAllow,
}: {
  status: ReturnType<typeof useMotionTracker>['state']['status']
  onAllow: () => void
}) {
  const isLoading = status === 'requesting' || status === 'loading'
  const description: React.ReactNode = status === 'idle'
    ? '바다속으로 들어갈 준비가 되었습니다.'
    : status === 'error'
      ? <>카메라 접근이 차단되었습니다. <br />브라우저 권한을 확인한 뒤 다시 시도하세요.</>
      : status === 'requesting'
        ? '브라우저 카메라 권한을 기다리는 중입니다.'
        : <>손 움직임을 읽기 위해<br />MediaPipe 모델을 불러오는 중입니다.</>

  return (
    <div style={OVERLAY_WRAPPER_STYLE}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '1.18rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          안녕하세요
        </p>
        <p style={{ margin: '12px auto 0', maxWidth: '300px', color: status === 'error' ? '#ffb4b4' : 'rgba(230,251,255,0.72)', fontSize: '0.86rem', lineHeight: 1.65, wordBreak: 'keep-all' }}>
          {description}
        </p>
      </div>
      {status === 'idle' && (
        <button
          data-testid="webcam-allow-btn"
          onClick={onAllow}
          style={MODAL_BUTTON_STYLE}
        >
          카메라 허용하기
        </button>
      )}
      {status === 'error' && (
        <button
          data-testid="webcam-allow-btn"
          onClick={onAllow}
          style={{ ...MODAL_BUTTON_STYLE, borderColor: 'rgba(255,180,180,0.62)', background: 'linear-gradient(135deg, rgba(255,120,120,0.20), rgba(0,180,216,0.10))' }}
        >
          카메라 다시 연결
        </button>
      )}
      {isLoading && (
        <div
          style={{
            width: '34px',
            height: '34px',
            margin: '24px auto 0',
            border: '2px solid rgba(202,240,248,0.18)',
            borderTop: '2px solid #80ffdb',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── 에너지 계산 ─────────────────────────────────────────────────────────────
function computeHandEnergy(
  left: InteractionPoint[],
  right: InteractionPoint[],
  prev: [InteractionPoint[], InteractionPoint[]]
): number {
  const moved = (curr: InteractionPoint[], p: InteractionPoint[]): number => {
    if (!curr[0] || !p[0]) return 0
    const dx = curr[0].x - p[0].x
    const dy = curr[0].y - p[0].y
    return Math.sqrt(dx * dx + dy * dy)
  }
  return Math.min(1, (moved(left, prev[0]) + moved(right, prev[1])) * 60)
}

// ─── 컴포넌트 ────────────────────────────────────────────────────────────────
export function UnderwaterPoseReactive() {
  const { state, requestCamera } = useMotionTracker({ model: 'hands', numHands: 2 })

  const leftHand: InteractionPoint[]  = state.hands[0] ?? []
  const rightHand: InteractionPoint[] = state.hands[1] ?? []
  const prevHandsRef = useRef<[InteractionPoint[], InteractionPoint[]]>([[], []])

  const energy = computeHandEnergy(leftHand, rightHand, prevHandsRef.current)
  prevHandsRef.current = [leftHand, rightHand]

  const showOverlay = state.status !== 'active'

  return (
    <div style={ROOT_STYLE}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#000' }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <UnderwaterScene
            leftHand={leftHand}
            rightHand={rightHand}
            energy={energy}
            isCameraActive={state.status === 'active'}
          />
        </Suspense>
      </Canvas>

      <div style={EDGE_SHADOW_STYLE} />

      {/* 카메라 권한 오버레이 */}
      {showOverlay && createPortal(
        <UnderwaterPermissionModal status={state.status} onAllow={requestCamera} />,
        document.body
      )}

    </div>
  )
}
