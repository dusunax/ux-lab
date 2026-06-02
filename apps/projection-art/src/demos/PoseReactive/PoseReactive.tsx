import { Suspense, lazy, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { useMotionTracker } from '../../hooks/useMotionTracker'
import { useAiVisualParams } from '../../hooks/useAiVisualParams'
import { WebcamPermission } from '../../components/WebcamPermission'
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

  const showOverlay = state.status !== 'active'

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <PoseScene pose={pose} visualParams={visualParams} />
        </Suspense>
      </Canvas>

      {showOverlay && (
        <WebcamPermission
          status={state.status}
          onAllow={requestCamera}
        />
      )}

      {state.status === 'active' && (
        <div
          data-testid="pose-status"
          style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
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
            {isLoading ? '✦ AI 파라미터 생성 중…' : `✦ ${visualParams.primaryColor} · ${visualParams.accentColor}`}
          </div>
        </div>
      )}
    </div>
  )
}
