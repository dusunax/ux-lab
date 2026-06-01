import { Suspense, lazy } from 'react'
import { Canvas } from '@react-three/fiber'
import { useMotionTracker } from '../../hooks/useMotionTracker'
import { WebcamPermission } from '../../components/WebcamPermission'
import { mouseToPoints } from '../../adapters/interactionAdapters'
import type { MousePosition } from '../../types'

const HandScene = lazy(() =>
  import('./HandScene').then(m => ({ default: m.HandScene }))
)

interface HandReactiveProps {
  mousePos: MousePosition
}

export function HandReactive({ mousePos }: HandReactiveProps) {
  const { state, requestCamera, useFallback } = useMotionTracker()

  const points =
    state.status === 'active' && state.points.length > 0
      ? state.points
      : mouseToPoints(mousePos)

  const showPermissionOverlay =
    state.status === 'idle' ||
    state.status === 'requesting' ||
    state.status === 'loading' ||
    state.status === 'error'

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <HandScene points={points} />
        </Suspense>
      </Canvas>

      {showPermissionOverlay && (
        <WebcamPermission
          status={state.status}
          onAllow={requestCamera}
          onSkip={useFallback}
        />
      )}

      {/* 상태 표시 */}
      {(state.status === 'active' || state.status === 'fallback') && (
        <div
          data-testid="tracker-status"
          style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            fontSize: '0.72rem',
            color: state.status === 'active' ? 'rgba(0,255,100,0.7)' : 'rgba(255,255,255,0.3)',
            fontFamily: 'monospace',
          }}
        >
          {state.status === 'active'
            ? `✋ Hand tracking · ${state.points.length} landmarks`
            : '🖱 Mouse fallback'}
        </div>
      )}
    </div>
  )
}
