import { Suspense, lazy, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Canvas } from '@react-three/fiber'
import { useMotionTracker } from '../../hooks/useMotionTracker'
import { WebcamPermission } from '../../components/WebcamPermission'

const HandScene = lazy(() =>
  import('./HandScene').then(m => ({ default: m.HandScene }))
)

export function HandReactive() {
  const [numHands, setNumHands] = useState<1 | 2>(2)
  const { state, requestCamera } = useMotionTracker({ numHands })

  const cameraActiveRef = useRef(false)
  useEffect(() => {
    cameraActiveRef.current = state.status === 'active'
  }, [state.status])

  // Restart detection with new numHands when user toggles while active
  useEffect(() => {
    if (cameraActiveRef.current) requestCamera()
  }, [numHands, requestCamera])

  const hands = state.status === 'active' ? state.hands : []
  const showOverlay = state.status !== 'active'

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <HandScene hands={hands} />
        </Suspense>
      </Canvas>

      {showOverlay && createPortal(
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '360px',
            height: '260px',
            borderRadius: '12px',
            overflow: 'hidden',
            zIndex: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
          }}
        >
          <WebcamPermission
            status={state.status}
            onAllow={requestCamera}
          />
        </div>,
        document.body
      )}

      {state.status === 'active' && createPortal(
        <div
          data-testid="tracker-status"
          style={{
            position: 'fixed',
            bottom: '1rem',
            right: '1rem',
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.5rem',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'rgba(0,255,100,0.7)', fontFamily: 'monospace' }}>
            {`✋ Hand tracking · ${state.hands.length}/${numHands}손 감지`}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {([2, 1] as const).map(n => (
              <button
                key={n}
                data-testid={`hand-mode-${n}`}
                onClick={() => setNumHands(n)}
                style={{
                  background: numHands === n ? 'rgba(0,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                  color: numHands === n ? '#0ff' : '#555',
                  border: `1px solid ${numHands === n ? 'rgba(0,255,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  padding: '0.42rem 0.95rem',
                  borderRadius: '3px',
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  minWidth: '58px',
                }}
              >
                {n}손
              </button>
            ))}
          </div>
        </div>
        ,
        document.body
      )}
    </div>
  )
}
