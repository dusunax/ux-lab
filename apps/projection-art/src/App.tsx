import { useState, useCallback, lazy, Suspense, useEffect, useRef } from 'react'
import { DEMOS, type DemoType, type MousePosition } from './types'
import { useFullscreen } from './hooks/useFullscreen'
import { useFrameRate } from './hooks/useFrameRate'
import { FpsOverlay } from './components/FpsOverlay'
import { KeystoneOverlay } from './components/KeystoneOverlay'

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
const HandReactive = lazy(() =>
  import('./demos/HandReactive/HandReactive').then(m => ({ default: m.HandReactive }))
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
  const [showFps, setShowFps] = useState(false)
  const [showKeystone, setShowKeystone] = useState(false)
  const menuTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const rafLoopRef = useRef<number>(0)
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen()
  const { state: fpsState, tick: fpsTick, reset: fpsReset } = useFrameRate(showFps)

  // FPS 측정 루프 (showFps 활성화 시)
  useEffect(() => {
    if (!showFps) {
      cancelAnimationFrame(rafLoopRef.current)
      fpsReset()
      return
    }
    const loop = (now: number) => {
      fpsTick(now)
      rafLoopRef.current = requestAnimationFrame(loop)
    }
    rafLoopRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafLoopRef.current)
  }, [showFps, fpsTick, fpsReset])

  // 데모 전환 시 FPS 초기화
  useEffect(() => {
    fpsReset()
  }, [activeDemo, fpsReset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const nx = e.clientX / window.innerWidth
    const ny = e.clientY / window.innerHeight
    setMousePos({ x: e.clientX, y: e.clientY, nx, ny })

    setShowMenu(true)
    clearTimeout(menuTimeoutRef.current)
    menuTimeoutRef.current = setTimeout(() => setShowMenu(false), 3000)
  }, [])

  // 키보드 단축키
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') setShowFps(v => !v)
      if (e.key === 'k' || e.key === 'K') setShowKeystone(v => !v)
      if (e.key === '1') setActiveDemo('particle-flow')
      if (e.key === '2') setActiveDemo('neon-tunnel')
      if (e.key === '3') setActiveDemo('audio-reactive')
      if (e.key === '4') setActiveDemo('hand-reactive')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

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
      <KeystoneOverlay visible={showKeystone}>
      {/* 데모 캔버스 레이어 */}
      <Suspense fallback={<DemoFallback />}>
        {activeDemo === 'particle-flow' && <ParticleFlow mousePos={mousePos} />}
        {activeDemo === 'neon-tunnel' && <NeonTunnel mousePos={mousePos} />}
        {activeDemo === 'audio-reactive' && <AudioReactiveVisual mousePos={mousePos} />}
        {activeDemo === 'hand-reactive' && <HandReactive mousePos={mousePos} />}
      </Suspense>
      </KeystoneOverlay>

      {/* 네비게이션 오버레이 */}
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
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)',
          transition: 'opacity 0.5s',
          opacity: showMenu ? 1 : 0,
          pointerEvents: showMenu ? 'auto' : 'none',
        }}
      >
        {/* 데모 선택 */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {DEMOS.map(demo => (
            <button
              key={demo.id}
              data-testid={`demo-btn-${demo.id}`}
              onClick={() => setActiveDemo(demo.id)}
              title={demo.description}
              style={{
                background:
                  activeDemo === demo.id
                    ? 'rgba(0,255,255,0.2)'
                    : 'rgba(255,255,255,0.05)',
                color: activeDemo === demo.id ? '#0ff' : '#999',
                border: `1px solid ${activeDemo === demo.id ? 'rgba(0,255,255,0.6)' : 'rgba(255,255,255,0.15)'}`,
                padding: '0.45rem 0.9rem',
                borderRadius: '4px',
                fontSize: '0.82rem',
                transition: 'all 0.2s',
                backdropFilter: 'blur(4px)',
              }}
            >
              {demo.label}
            </button>
          ))}
        </div>

        {/* 우측 컨트롤 */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            data-testid="fps-toggle-btn"
            onClick={() => setShowFps(v => !v)}
            style={{
              background: showFps ? 'rgba(0,255,0,0.1)' : 'rgba(255,255,255,0.05)',
              color: showFps ? '#0f0' : '#777',
              border: `1px solid ${showFps ? 'rgba(0,255,0,0.4)' : 'rgba(255,255,255,0.15)'}`,
              padding: '0.45rem 0.9rem',
              borderRadius: '4px',
              fontSize: '0.82rem',
            }}
          >
            FPS
          </button>
          <button
            data-testid="keystone-btn"
            onClick={() => setShowKeystone(v => !v)}
            style={{
              background: showKeystone ? 'rgba(255,200,0,0.1)' : 'rgba(255,255,255,0.05)',
              color: showKeystone ? '#fc0' : '#777',
              border: `1px solid ${showKeystone ? 'rgba(255,200,0,0.4)' : 'rgba(255,255,255,0.15)'}`,
              padding: '0.45rem 0.9rem',
              borderRadius: '4px',
              fontSize: '0.82rem',
            }}
          >
            Keystone
          </button>
          <button
            data-testid="fullscreen-btn"
            onClick={toggleFullscreen}
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#999',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '0.45rem 0.9rem',
              borderRadius: '4px',
              fontSize: '0.82rem',
            }}
          >
            {isFullscreen ? '⛶ Exit' : '⛶ Full'}
          </button>
        </div>
      </nav>

      {/* 단축키 힌트 */}
      <div
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          color: `rgba(255,255,255,${showMenu ? 0.3 : 0.08})`,
          fontSize: '0.72rem',
          fontFamily: 'monospace',
          letterSpacing: '0.08em',
          pointerEvents: 'none',
          transition: 'color 0.5s',
        }}
      >
        1–4 — 데모 전환 &nbsp;·&nbsp; F — FPS &nbsp;·&nbsp; K — Keystone &nbsp;·&nbsp; 마우스 이동으로 메뉴 표시
      </div>

      {/* FPS 오버레이 */}
      <FpsOverlay state={fpsState} visible={showFps} />
    </div>
  )
}

export default App
