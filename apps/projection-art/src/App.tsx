import { useState, useCallback, lazy, Suspense, useEffect, useRef } from 'react'
import { DEMOS, type DemoType, type MousePosition } from './types'
import { useFullscreen } from './hooks/useFullscreen'
import { useFrameRate } from './hooks/useFrameRate'
import { usePreset } from './hooks/usePreset'
import { FpsOverlay } from './components/FpsOverlay'
import { KeystoneOverlay, loadCorners, DEFAULT_CORNERS } from './components/KeystoneOverlay'
import type { Corners } from './components/KeystoneOverlay'

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
const PoseReactive = lazy(() =>
  import('./demos/PoseReactive/PoseReactive').then(m => ({ default: m.PoseReactive }))
)

function DemoFallback() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ff', fontSize: '1.2rem', letterSpacing: '0.2em' }}>
      Loading...
    </div>
  )
}

const BTN = (active: boolean, activeColor: string): React.CSSProperties => ({
  background: active ? `rgba(${activeColor},0.1)` : 'rgba(255,255,255,0.05)',
  color: active ? `rgb(${activeColor})` : '#777',
  border: `1px solid ${active ? `rgba(${activeColor},0.4)` : 'rgba(255,255,255,0.15)'}`,
  padding: '0.45rem 0.9rem',
  borderRadius: '4px',
  fontSize: '0.82rem',
  cursor: 'pointer',
})

function App() {
  const [activeDemo, setActiveDemo] = useState<DemoType>('particle-flow')
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0, nx: 0.5, ny: 0.5 })
  const [showMenu, setShowMenu] = useState(true)
  const [showFps, setShowFps] = useState(false)
  const [showKeystone, setShowKeystone] = useState(false)
  const [corners, setCorners] = useState<Corners>(loadCorners)
  const menuTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const rafLoopRef = useRef<number>(0)
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen()
  const { state: fpsState, tick: fpsTick, reset: fpsReset } = useFrameRate(showFps)
  const { preset, saveSnapshot, restore, clear: clearPreset } = usePreset()

  // Persist corners to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('projection-art-keystone', JSON.stringify(corners))
  }, [corners])

  useEffect(() => {
    if (!showFps) { cancelAnimationFrame(rafLoopRef.current); fpsReset(); return }
    const loop = (now: number) => { fpsTick(now); rafLoopRef.current = requestAnimationFrame(loop) }
    rafLoopRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafLoopRef.current)
  }, [showFps, fpsTick, fpsReset])

  useEffect(() => { fpsReset() }, [activeDemo, fpsReset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const nx = e.clientX / window.innerWidth
    const ny = e.clientY / window.innerHeight
    setMousePos({ x: e.clientX, y: e.clientY, nx, ny })
    setShowMenu(true)
    clearTimeout(menuTimeoutRef.current)
    menuTimeoutRef.current = setTimeout(() => setShowMenu(false), 3000)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') setShowFps(v => !v)
      if (e.key === 'k' || e.key === 'K') setShowKeystone(v => !v)
      if (e.key === '1') setActiveDemo('particle-flow')
      if (e.key === '2') setActiveDemo('neon-tunnel')
      if (e.key === '3') setActiveDemo('audio-reactive')
      if (e.key === '4') setActiveDemo('hand-reactive')
      if (e.key === '5') setActiveDemo('pose-reactive')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    menuTimeoutRef.current = setTimeout(() => setShowMenu(false), 4000)
    return () => clearTimeout(menuTimeoutRef.current)
  }, [])

  const handleRestorePreset = useCallback(() => {
    const p = restore()
    if (!p) return
    setActiveDemo(p.demo)
    setCorners(p.corners)
  }, [restore])

  return (
    <div
      data-testid="app-container"
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
      onMouseMove={handleMouseMove}
    >
      <KeystoneOverlay visible={showKeystone} corners={corners} onCornersChange={setCorners}>
        <Suspense fallback={<DemoFallback />}>
          {activeDemo === 'particle-flow' && <ParticleFlow mousePos={mousePos} />}
          {activeDemo === 'neon-tunnel' && <NeonTunnel mousePos={mousePos} />}
          {activeDemo === 'audio-reactive' && <AudioReactiveVisual mousePos={mousePos} />}
          {activeDemo === 'hand-reactive' && <HandReactive />}
          {activeDemo === 'pose-reactive' && <PoseReactive />}
        </Suspense>
      </KeystoneOverlay>

      <nav
        data-testid="demo-nav"
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '1.5rem 2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)',
          transition: 'opacity 0.5s',
          opacity: showMenu ? 1 : 0,
          pointerEvents: showMenu ? 'auto' : 'none',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {DEMOS.map(demo => (
            <button
              key={demo.id}
              data-testid={`demo-btn-${demo.id}`}
              onClick={() => setActiveDemo(demo.id)}
              title={demo.description}
              style={{
                background: activeDemo === demo.id ? 'rgba(0,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                color: activeDemo === demo.id ? '#0ff' : '#999',
                border: `1px solid ${activeDemo === demo.id ? 'rgba(0,255,255,0.6)' : 'rgba(255,255,255,0.15)'}`,
                padding: '0.45rem 0.9rem', borderRadius: '4px', fontSize: '0.82rem',
                transition: 'all 0.2s', backdropFilter: 'blur(4px)', cursor: 'pointer',
              }}
            >
              {demo.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Preset controls */}
          <button
            data-testid="preset-save-btn"
            onClick={() => saveSnapshot(activeDemo)}
            style={BTN(false, '180,180,255')}
            title="현재 Demo + 키스톤 설정을 프리셋으로 저장"
          >
            💾 저장
          </button>
          {preset && (
            <button
              data-testid="preset-restore-btn"
              onClick={handleRestorePreset}
              style={BTN(true, '100,220,255')}
              title={`프리셋 불러오기: ${preset.demo}`}
            >
              ↩ 프리셋
            </button>
          )}
          {preset && (
            <button
              data-testid="preset-clear-btn"
              onClick={clearPreset}
              style={{ ...BTN(false, '255,100,100'), fontSize: '0.72rem', padding: '0.45rem 0.6rem' }}
              title="프리셋 삭제"
            >
              ✕
            </button>
          )}

          <button data-testid="fps-toggle-btn" onClick={() => setShowFps(v => !v)} style={BTN(showFps, '0,255,0')}>
            FPS
          </button>
          <button
            data-testid="keystone-btn"
            onClick={() => setShowKeystone(v => !v)}
            style={BTN(showKeystone, '255,200,0')}
          >
            Keystone
          </button>
          <button
            data-testid="fullscreen-btn"
            onClick={toggleFullscreen}
            style={{ ...BTN(false, '180,180,180'), cursor: 'pointer' }}
          >
            {isFullscreen ? '⛶ Exit' : '⛶ Full'}
          </button>
        </div>
      </nav>

      <div
        style={{
          position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          color: `rgba(255,255,255,${showMenu ? 0.3 : 0.08})`,
          fontSize: '0.72rem', fontFamily: 'monospace', letterSpacing: '0.08em',
          pointerEvents: 'none', transition: 'color 0.5s',
        }}
      >
        1–5 — 데모 전환 &nbsp;·&nbsp; F — FPS &nbsp;·&nbsp; K — Keystone &nbsp;·&nbsp; 마우스 이동으로 메뉴 표시
      </div>

      <FpsOverlay state={fpsState} visible={showFps} />
    </div>
  )
}

export default App
