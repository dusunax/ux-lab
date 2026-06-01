import { Suspense, lazy, useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { useMotionTracker } from '../../hooks/useMotionTracker'
import { WebcamPermission } from '../../components/WebcamPermission'

const HandScene = lazy(() =>
  import('./HandScene').then(m => ({ default: m.HandScene }))
)

export function HandReactive() {
  const [numHands, setNumHands] = useState<1 | 2>(1)
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
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <HandScene hands={hands} />
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
          data-testid="tracker-status"
          style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
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
            {([1, 2] as const).map(n => (
              <button
                key={n}
                data-testid={`hand-mode-${n}`}
                onClick={() => setNumHands(n)}
                style={{
                  background: numHands === n ? 'rgba(0,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                  color: numHands === n ? '#0ff' : '#555',
                  border: `1px solid ${numHands === n ? 'rgba(0,255,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '3px',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                }}
              >
                {n}손
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
