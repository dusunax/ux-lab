import { useState, useCallback, lazy, Suspense, useEffect, useRef } from 'react'
import { DEMOS, type DemoType, type MousePosition } from './types'
import { useFullscreen } from './hooks/useFullscreen'

const ParticleFlow = lazy(() =>
  import('./demos/ParticleFlow/ParticleFlow').then(m => ({ default: m.ParticleFlow }))
)
const NeonTunnel = lazy(() =>
  import('./demos/NeonTunnel/NeonTunnel').then(m => ({ default: m.NeonTunnel }))
)
const AudioReactiveVisual = lazy(() =>
  import('./demos/AudioReactiveVisual/AudioReactiveVisual').then(m => ({
    default: m.AudioReactiveVisual,
  }))
)

function DemoFallback() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#0ff',
        fontSize: '1.2rem',
        letterSpacing: '0.2em',
      }}
    >
      Loading...
    </div>
  )
}

function App() {
  const [activeDemo, setActiveDemo] = useState<DemoType>('particle-flow')
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0, nx: 0.5, ny: 0.5 })
  const [showMenu, setShowMenu] = useState(true)
  const menuTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen()

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const nx = e.clientX / window.innerWidth
    const ny = e.clientY / window.innerHeight
    setMousePos({ x: e.clientX, y: e.clientY, nx, ny })

    // Auto-hide menu after 3s of no mouse movement over the menu
    setShowMenu(true)
    clearTimeout(menuTimeoutRef.current)
    menuTimeoutRef.current = setTimeout(() => setShowMenu(false), 3000)
  }, [])

  // Show menu on initial load, then hide
  useEffect(() => {
    menuTimeoutRef.current = setTimeout(() => setShowMenu(false), 4000)
    return () => clearTimeout(menuTimeoutRef.current)
  }, [])

  return (
    <div
      data-testid="app-container"
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
      onMouseMove={handleMouseMove}
    >
      {/* Demo canvas layer */}
      <Suspense fallback={<DemoFallback />}>
        {activeDemo === 'particle-flow' && <ParticleFlow mousePos={mousePos} />}
        {activeDemo === 'neon-tunnel' && <NeonTunnel mousePos={mousePos} />}
        {activeDemo === 'audio-reactive' && <AudioReactiveVisual mousePos={mousePos} />}
      </Suspense>

      {/* Navigation overlay */}
      <nav
        data-testid="demo-nav"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
          transition: 'opacity 0.5s',
          opacity: showMenu ? 1 : 0,
          pointerEvents: showMenu ? 'auto' : 'none',
        }}
      >
        {/* Demo selector */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {DEMOS.map(demo => (
            <button
              key={demo.id}
              data-testid={`demo-btn-${demo.id}`}
              onClick={() => setActiveDemo(demo.id)}
              style={{
                background:
                  activeDemo === demo.id
                    ? 'rgba(0,255,255,0.25)'
                    : 'rgba(255,255,255,0.05)',
                color: activeDemo === demo.id ? '#0ff' : '#aaa',
                border: `1px solid ${activeDemo === demo.id ? '#0ff' : 'rgba(255,255,255,0.2)'}`,
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                fontSize: '0.85rem',
                transition: 'all 0.2s',
              }}
            >
              {demo.label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <button
          data-testid="fullscreen-btn"
          onClick={toggleFullscreen}
          style={{
            background: 'rgba(255,255,255,0.05)',
            color: '#aaa',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            fontSize: '0.85rem',
          }}
        >
          {isFullscreen ? '⛶ Exit' : '⛶ Fullscreen'}
        </button>
      </nav>
    </div>
  )
}

export default App
