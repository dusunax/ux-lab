import { Suspense, lazy, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Canvas } from '@react-three/fiber'
import { useMotionTracker } from '../../../hooks/useMotionTracker'
import { WebcamPermission } from '../../../components/WebcamPermission'
import { classifyPose, computeMotionEnergy } from '../../../utils/classifyPose'
import type { InteractionPoint } from '../../../types'

const UnderwaterScene = lazy(() =>
  import('./UnderwaterScene').then(m => ({ default: m.UnderwaterScene }))
)

const BACK_BUTTON_STYLE: React.CSSProperties = {
  position: 'fixed',
  top: '1rem',
  left: '1rem',
  zIndex: 200,
  background: 'rgba(0, 119, 182, 0.25)',
  border: '1px solid rgba(144, 224, 239, 0.4)',
  color: '#90e0ef',
  padding: '0.45rem 1rem',
  borderRadius: '4px',
  fontSize: '0.82rem',
  cursor: 'pointer',
  fontFamily: 'monospace',
  backdropFilter: 'blur(4px)',
}

const OVERLAY_WRAPPER_STYLE: React.CSSProperties = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '360px',
  height: '280px',
  borderRadius: '12px',
  overflow: 'hidden',
  zIndex: 200,
  boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
}

const ROOT_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  background: '#03045e',
}

export function UnderwaterPoseReactive() {
  const { state, requestCamera } = useMotionTracker({ model: 'pose' })

  const pose: InteractionPoint[] = state.hands[0] ?? []
  const prevPoseRef = useRef<InteractionPoint[]>([])

  const poseLabel = classifyPose(pose)
  const energy = computeMotionEnergy(pose, prevPoseRef.current)
  prevPoseRef.current = pose

  const showOverlay = state.status !== 'active'

  const handleBack = () => {
    window.location.hash = ''
  }

  return (
    <div style={ROOT_STYLE}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <UnderwaterScene pose={pose} energy={energy} />
        </Suspense>
      </Canvas>

      {/* 돌아가기 버튼 */}
      {createPortal(
        <button
          onClick={handleBack}
          style={BACK_BUTTON_STYLE}
          aria-label="홈으로 돌아가기"
        >
          ← 돌아가기
        </button>,
        document.body
      )}

      {/* 카메라 권한 오버레이 */}
      {showOverlay && createPortal(
        <div style={OVERLAY_WRAPPER_STYLE}>
          <WebcamPermission
            status={state.status}
            onAllow={requestCamera}
            title="Demo E — Underwater"
            description="웹캠으로 전신을 움직여 수중 세계와 교감하세요."
            icon="🌊"
          />
        </div>,
        document.body
      )}

      {/* 상태 HUD */}
      {state.status === 'active' && createPortal(
        <div
          data-testid="underwater-pose-status"
          style={{
            position: 'fixed',
            bottom: '1rem',
            right: '1rem',
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.35rem',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'rgba(144,224,239,0.7)', fontFamily: 'monospace' }}>
            {`🌊 Underwater · ${pose.length > 0 ? '감지됨' : '대기 중'}`}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(180,200,255,0.7)', fontFamily: 'monospace' }}>
            {`pose: ${poseLabel} · energy: ${energy.toFixed(2)}`}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
