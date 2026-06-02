import { Suspense, lazy, useRef, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Canvas } from '@react-three/fiber'
import { useMotionTracker } from '../../hooks/useMotionTracker'
import { useAiVisualParams } from '../../hooks/useAiVisualParams'
import { WebcamPermission } from '../../components/WebcamPermission'
import { PoseCustomizerPanel } from './PoseCustomizerPanel'
import type { FaceExpression } from './PoseCustomizerPanel'
import { classifyPose, computeMotionEnergy } from '../../utils/classifyPose'
import type { InteractionPoint } from '../../types'

const PoseScene = lazy(() =>
  import('./PoseScene').then(m => ({ default: m.PoseScene }))
)

export function PoseReactive() {
  const { state, requestCamera } = useMotionTracker({ model: 'pose' })

  const pose: InteractionPoint[] = state.hands[0] ?? []
  const prevPoseRef = useRef<InteractionPoint[]>([])

  const poseLabel = classifyPose(pose)
  const energy = computeMotionEnergy(pose, prevPoseRef.current)
  prevPoseRef.current = pose

  const { params: visualParams, isLoading } = useAiVisualParams(poseLabel, energy)

  const [primaryColor, setPrimaryColor] = useState('')
  const [accentColor, setAccentColor] = useState('')
  const [faceExpression, setFaceExpression] = useState<FaceExpression>('none')
  const [showPanel, setShowPanel] = useState(false)

  const mergedParams = useMemo(() => ({
    ...visualParams,
    ...(primaryColor && { primaryColor }),
    ...(accentColor && { accentColor }),
  }), [visualParams, primaryColor, accentColor])

  const handleReset = () => {
    setPrimaryColor('')
    setAccentColor('')
    setFaceExpression('none')
  }

  const showOverlay = state.status !== 'active'
  const nose = pose[0]

  const faceEmojiSize = useMemo(() => {
    const ls = pose[11], rs = pose[12]
    if (!ls || !rs) return '7vw'
    const dist = Math.abs(ls.x - rs.x)
    return `${Math.max(4, Math.min(14, dist * 45))}vw`
  }, [pose])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <PoseScene pose={pose} visualParams={mergedParams} />
        </Suspense>
      </Canvas>

      {showOverlay && createPortal(
        <div style={{
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
        }}>
          <WebcamPermission
            status={state.status}
            onAllow={requestCamera}
            title="Demo E — Pose Reactive"
            description="웹캠으로 전신 포즈를 추적하여 AI 생성형 비주얼을 제어합니다."
            icon="🕺"
          />
        </div>,
        document.body
      )}

      {state.status === 'active' && faceExpression !== 'none' && nose && (
        <div
          style={{
            position: 'absolute',
            left: `${nose.x * 100}%`,
            top: `${nose.y * 100}%`,
            transform: 'translate(-50%, -40%)',
            fontSize: faceEmojiSize,
            pointerEvents: 'none',
            userSelect: 'none',
            filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))',
            lineHeight: 1,
          }}
        >
          {faceExpression}
        </div>
      )}

      {state.status === 'active' && createPortal(
        <div
          style={{
            position: 'fixed',
            top: '5.5rem',
            right: '1rem',
            zIndex: 200,
          }}
        >
          <button
            onClick={() => setShowPanel(p => !p)}
            style={{
              background: showPanel ? 'rgba(0,255,200,0.18)' : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: showPanel ? '#0fc' : '#ccc',
              padding: '0.4rem 0.75rem',
              borderRadius: '4px',
              fontSize: '0.78rem',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            🎨 커스터마이즈
          </button>

          {showPanel && (
            <PoseCustomizerPanel
              visualParams={visualParams}
              primaryColor={primaryColor}
              accentColor={accentColor}
              faceExpression={faceExpression}
              onPrimaryColorChange={setPrimaryColor}
              onAccentColorChange={setAccentColor}
              onFaceExpressionChange={setFaceExpression}
              onReset={handleReset}
            />
          )}
        </div>,
        document.body
      )}

      {state.status === 'active' && createPortal(
        <div
          data-testid="pose-status"
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
          <div style={{ fontSize: '0.72rem', color: 'rgba(0,255,100,0.7)', fontFamily: 'monospace' }}>
            {`🕺 Pose tracking · ${pose.length > 0 ? '감지됨' : '대기 중'}`}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(180,180,255,0.7)', fontFamily: 'monospace' }}>
            {`pose: ${poseLabel} · energy: ${energy.toFixed(2)}`}
          </div>
          <div
            style={{
              fontSize: '0.65rem',
              fontFamily: 'monospace',
              color: isLoading ? 'rgba(255,200,0,0.8)' : 'rgba(100,200,255,0.6)',
            }}
          >
            {isLoading ? '✦ AI 파라미터 생성 중…' : `✦ ${mergedParams.primaryColor} · ${mergedParams.accentColor}`}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
