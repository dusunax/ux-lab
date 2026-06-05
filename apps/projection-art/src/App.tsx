import { useState, useCallback, lazy, Suspense, useEffect, useRef } from 'react'
import { DEMOS, DEMO_NATURAL_LABELS, type DemoType, type MousePosition } from './types'
import { useFullscreen } from './hooks/useFullscreen'
import { useFrameRate } from './hooks/useFrameRate'
import { usePreset } from './hooks/usePreset'
import { useTheme, THEMES, type ThemeId } from './hooks/useTheme'
import { FpsOverlay } from './components/FpsOverlay'
import { KeystoneOverlay, loadTransform, screenToProjectionPoint, KEYSTONE_STORAGE_KEY, defaultTransform } from './components/KeystoneOverlay'
import type { ProjectionTransform } from './components/KeystoneOverlay'

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

const ONBOARDING_KEY = 'projection-art-onboarded'

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

const DIMMED_WHILE_KEYSTONE: React.CSSProperties = {
  opacity: 0.28,
  filter: 'grayscale(0.7)',
}

function OnboardingOverlay({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      data-testid="onboarding-overlay"
      onClick={onDismiss}
      role="dialog"
      aria-modal="true"
      aria-label="시작 안내"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(10px)',
        cursor: 'pointer',
        gap: '1.5rem',
      }}
    >
      <div style={{ fontSize: '3rem' }}>✨</div>
      <div style={{ textAlign: 'center', color: '#fff', maxWidth: '340px' }}>
        <p style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.6rem', lineHeight: 1.4 }}>
          데모를 선택하고, 움직여 보세요!
        </p>
        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
          상단에서 원하는 효과를 고른 뒤<br />
          마우스나 몸으로 인터랙션해 보세요
        </p>
      </div>
      <button
        data-testid="onboarding-start-btn"
        onClick={onDismiss}
        style={{
          background: 'rgba(0,151,230,0.2)',
          color: '#00d2ff',
          border: '1px solid rgba(0,210,255,0.5)',
          padding: '0.7rem 2rem',
          borderRadius: '6px',
          fontSize: '1rem',
          cursor: 'pointer',
          letterSpacing: '0.05em',
        }}
      >
        시작하기
      </button>
      <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>
        화면 아무 곳이나 눌러도 시작돼요
      </p>
    </div>
  )
}

function App() {
  const [activeDemo, setActiveDemo] = useState<DemoType>('particle-flow')
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0, nx: 0.5, ny: 0.5 })
  const [showMenu, setShowMenu] = useState(true)
  const [showFps, setShowFps] = useState(false)
  const [showKeystone, setShowKeystone] = useState(false)
  const [showPresetPanel, setShowPresetPanel] = useState(false)
  const [showDemoPanel, setShowDemoPanel] = useState(false)
  const [transform, setTransform] = useState<ProjectionTransform>(loadTransform)
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem(ONBOARDING_KEY)
  )
  const menuTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const rafLoopRef = useRef<number>(0)
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen()
  const { state: fpsState, tick: fpsTick, reset: fpsReset } = useFrameRate(showFps)
  const { preset, save: savePreset, restore, clear: clearPreset } = usePreset()
  const { theme, setTheme } = useTheme()

  const presetDemoLabel = preset ? DEMOS.find(demo => demo.id === preset.demo)?.label ?? preset.demo : null
  const canSavePreset = !preset
    || preset.demo !== activeDemo
    || preset.showFps !== showFps
    || JSON.stringify(preset.transform) !== JSON.stringify(transform)

  const activeDemoInfo = DEMOS.find(d => d.id === activeDemo)

  const handleTransformChange = useCallback((t: ProjectionTransform) => {
    setTransform(t)
    localStorage.setItem(KEYSTONE_STORAGE_KEY, JSON.stringify(t))
  }, [])

  useEffect(() => {
    if (!showFps) { cancelAnimationFrame(rafLoopRef.current); fpsReset(); return }
    const loop = (now: number) => { fpsTick(now); rafLoopRef.current = requestAnimationFrame(loop) }
    rafLoopRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafLoopRef.current)
  }, [showFps, fpsTick, fpsReset])

  useEffect(() => { fpsReset() }, [activeDemo, fpsReset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const point = screenToProjectionPoint(transform, e.clientX, e.clientY)
    setMousePos(point)
    setShowMenu(true)
    clearTimeout(menuTimeoutRef.current)
    menuTimeoutRef.current = setTimeout(() => setShowMenu(false), 3000)
  }, [transform])

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
    if (p.transform) setTransform(p.transform)
    if (typeof p.showFps === 'boolean') setShowFps(p.showFps)
  }, [restore])

  const handleDismissOnboarding = useCallback(() => {
    setShowOnboarding(false)
    localStorage.setItem(ONBOARDING_KEY, '1')
  }, [])

  const handleKeystoneReset = useCallback(() => {
    const defaultT = defaultTransform(window.innerWidth, window.innerHeight)
    handleTransformChange(defaultT)
  }, [handleTransformChange])

  const handleSelectDemo = useCallback((id: DemoType) => {
    setActiveDemo(id)
    setShowDemoPanel(false)
  }, [])

  // 테마 primary 색상을 RGB 채널로 변환 (BTN 함수 호환)
  const themeRgb = theme.primary
    .replace('#', '')
    .match(/.{2}/g)
    ?.map(h => parseInt(h, 16))
    .join(',') ?? '0,151,230'

  return (
    <div
      data-testid="app-container"
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
      onMouseMove={handleMouseMove}
    >
      {showOnboarding && (
        <OnboardingOverlay onDismiss={handleDismissOnboarding} />
      )}

      <KeystoneOverlay visible={showKeystone} transform={transform} onTransformChange={handleTransformChange} onClose={() => setShowKeystone(false)}>
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
          zIndex: 120,
          padding: '1.5rem 2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)',
          transition: 'opacity 0.5s',
          opacity: showMenu ? 1 : 0,
          pointerEvents: showMenu ? 'auto' : 'none',
        }}
      >
        {/* Demo 선택 — 카드 팝업 드롭다운 */}
        <div style={{ position: 'relative' }}>
          <button
            data-testid="demo-select-btn"
            onClick={() => setShowDemoPanel(v => !v)}
            aria-haspopup="listbox"
            aria-expanded={showDemoPanel}
            style={{
              minWidth: '180px',
              background: 'rgba(0,0,0,0.58)',
              color: `rgb(${themeRgb})`,
              border: `1px solid rgba(${themeRgb},0.45)`,
              borderRadius: '4px',
              padding: '0.48rem 2rem 0.48rem 0.75rem',
              fontSize: '0.82rem',
              fontFamily: 'monospace',
              backdropFilter: 'blur(4px)',
              cursor: 'pointer',
              textAlign: 'left',
              ...(showKeystone ? DIMMED_WHILE_KEYSTONE : null),
            }}
          >
            {activeDemoInfo?.label ?? '데모 선택'} ▾
          </button>

          {/* 레거시 select — 테스트 호환성 유지 (시각적으로 숨김) */}
          <select
            data-testid="demo-select"
            value={activeDemo}
            onChange={e => setActiveDemo(e.target.value as DemoType)}
            aria-hidden="true"
            tabIndex={-1}
            style={{
              position: 'absolute',
              opacity: 0,
              pointerEvents: 'none',
              width: 0,
              height: 0,
              overflow: 'hidden',
            }}
          >
            {DEMOS.map(demo => (
              <option key={demo.id} value={demo.id}>
                {demo.label}
              </option>
            ))}
          </select>

          {showDemoPanel && (
            <div
              data-testid="demo-card-panel"
              role="listbox"
              aria-label="데모 선택"
              style={{
                position: 'absolute',
                top: 'calc(100% + 0.5rem)',
                left: 0,
                minWidth: '260px',
                padding: '0.4rem',
                border: `1px solid rgba(${themeRgb},0.28)`,
                borderRadius: '6px',
                background: 'rgba(0,0,0,0.88)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                zIndex: 130,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              {DEMOS.map(demo => (
                <button
                  key={demo.id}
                  data-testid={`demo-card-${demo.id}`}
                  role="option"
                  aria-selected={activeDemo === demo.id}
                  onClick={() => handleSelectDemo(demo.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '0.15rem',
                    padding: '0.55rem 0.8rem',
                    borderRadius: '4px',
                    background: activeDemo === demo.id ? `rgba(${themeRgb},0.15)` : 'transparent',
                    border: `1px solid ${activeDemo === demo.id ? `rgba(${themeRgb},0.4)` : 'transparent'}`,
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <span style={{ color: activeDemo === demo.id ? `rgb(${themeRgb})` : '#ddd', fontSize: '0.88rem', fontWeight: 500 }}>
                    {DEMO_NATURAL_LABELS[demo.id]}
                  </span>
                  <small style={{ color: 'rgba(255,255,255,0.48)', fontSize: '0.72rem', lineHeight: 1.4 }}>
                    {demo.description}
                  </small>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* 설정 저장 패널 */}
          <div style={{ position: 'relative' }}>
            <button
              data-testid="preset-panel-toggle"
              onClick={() => setShowPresetPanel(v => !v)}
              style={BTN(showPresetPanel, '120,220,255')}
              title="시연 프리셋 저장/불러오기 설정 열기"
            >
              설정 저장
            </button>
            {showPresetPanel && (
              <div
                data-testid="preset-controls"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 0.5rem)',
                  right: 0,
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '0.4rem',
                  minWidth: '220px',
                  padding: '0.55rem',
                  border: '1px solid rgba(120,180,255,0.24)',
                  borderRadius: '4px',
                  background: 'rgba(0,0,0,0.82)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
                  zIndex: 130,
                }}
              >
                <span
                  data-testid="preset-status"
                  title={presetDemoLabel ? `저장된 프리셋: ${presetDemoLabel}` : '저장된 시연 프리셋 없음'}
                  style={{
                    color: preset ? 'rgba(120,220,255,0.9)' : 'rgba(255,255,255,0.38)',
                    fontSize: '0.7rem',
                    fontFamily: 'monospace',
                    lineHeight: 1.4,
                  }}
                >
                  {presetDemoLabel ? `저장됨: ${presetDemoLabel}` : '저장된 프리셋 없음'}
                </span>

                {/* 테마 선택 */}
                <div
                  data-testid="theme-selector"
                  style={{ display: 'flex', gap: '0.3rem', paddingBottom: '0.3rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      data-testid={`theme-btn-${t.id}`}
                      onClick={() => setTheme(t.id as ThemeId)}
                      title={t.name}
                      style={{
                        flex: 1,
                        padding: '0.3rem 0',
                        borderRadius: '3px',
                        fontSize: '0.68rem',
                        cursor: 'pointer',
                        background: theme.id === t.id ? t.primary : 'rgba(255,255,255,0.06)',
                        color: theme.id === t.id ? '#000' : 'rgba(255,255,255,0.6)',
                        border: theme.id === t.id ? `1px solid ${t.primary}` : '1px solid rgba(255,255,255,0.12)',
                        fontWeight: theme.id === t.id ? 600 : 400,
                      }}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>

                <button
                  data-testid="preset-save-btn"
                  onClick={() => savePreset(activeDemo, transform, showFps)}
                  disabled={!canSavePreset}
                  style={{ ...BTN(canSavePreset, '180,180,255'), opacity: canSavePreset ? 1 : 0.38, cursor: canSavePreset ? 'pointer' : 'not-allowed' }}
                  title={canSavePreset ? '현재 데모, 키스톤 위치, FPS 표시 상태를 시연 프리셋으로 저장' : '현재 설정이 이미 저장되어 있습니다'}
                >
                  이 설정 저장하기
                </button>
                <button
                  data-testid="preset-restore-btn"
                  onClick={handleRestorePreset}
                  disabled={!preset}
                  style={{ ...BTN(Boolean(preset), '100,220,255'), opacity: preset ? 1 : 0.42, cursor: preset ? 'pointer' : 'not-allowed' }}
                  title={presetDemoLabel ? `저장된 시연 프리셋 불러오기: ${presetDemoLabel}` : '불러올 프리셋이 없습니다'}
                >
                  저장된 설정 불러오기
                </button>
                <button
                  data-testid="preset-clear-btn"
                  onClick={clearPreset}
                  disabled={!preset}
                  style={{
                    ...BTN(Boolean(preset), '255,150,150'),
                    color: preset ? 'rgb(255,170,170)' : '#777',
                    opacity: preset ? 1 : 0.35,
                    cursor: preset ? 'pointer' : 'not-allowed',
                  }}
                  title={preset ? '저장된 시연 프리셋 삭제' : '삭제할 프리셋이 없습니다'}
                >
                  설정 초기화
                </button>
              </div>
            )}
          </div>

          <button
            data-testid="fps-toggle-btn"
            onClick={() => setShowFps(v => !v)}
            style={{ ...BTN(showFps, '0,255,0'), ...(showKeystone ? DIMMED_WHILE_KEYSTONE : null) }}
          >
            성능 표시
          </button>
          <button
            data-testid="keystone-btn"
            onClick={() => setShowKeystone(v => !v)}
            style={BTN(showKeystone, '255,200,0')}
          >
            화면 맞추기
          </button>
          {showKeystone && (
            <button
              data-testid="keystone-reset-btn"
              onClick={handleKeystoneReset}
              style={BTN(false, '255,200,0')}
            >
              화면에 맞추기
            </button>
          )}
          <button
            data-testid="fullscreen-btn"
            onClick={toggleFullscreen}
            style={{ ...BTN(false, '180,180,180'), cursor: 'pointer', ...(showKeystone ? DIMMED_WHILE_KEYSTONE : null) }}
          >
            {isFullscreen ? '⛶ Exit' : '⛶ Full'}
          </button>
        </div>
      </nav>

      <div
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          left: '1.5rem',
          maxWidth: '420px',
          padding: '0.65rem 0.8rem',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '4px',
          background: 'rgba(0,0,0,0.48)',
          backdropFilter: 'blur(6px)',
          color: `rgba(255,255,255,${showMenu || showKeystone ? 0.42 : 0.1})`,
          fontSize: '0.72rem',
          fontFamily: 'monospace',
          lineHeight: 1.6,
          pointerEvents: 'none',
          transition: 'color 0.5s, opacity 0.5s',
        }}
      >
        <div>데모를 선택하고 움직여 보세요 · F — 성능 표시 · K — 화면 맞추기</div>
        {showKeystone && (
          <div>✛ 이동 · 코너 warp · 엣지 scale · 초기화/적용</div>
        )}
      </div>

      <FpsOverlay state={fpsState} visible={showFps} />

      {/* 조합 데모 진입 링크 */}
      <button
        data-testid="go-combined-btn"
        onClick={() => { window.location.hash = 'combined' }}
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          right: '1.5rem',
          background: `rgba(${themeRgb},0.12)`,
          color: `rgb(${themeRgb})`,
          border: `1px solid rgba(${themeRgb},0.35)`,
          borderRadius: '4px',
          padding: '0.45rem 0.9rem',
          fontSize: '0.78rem',
          cursor: 'pointer',
          opacity: showMenu ? 0.85 : 0,
          transition: 'opacity 0.5s',
          pointerEvents: showMenu ? 'auto' : 'none',
        }}
      >
        ✦ 전체 조합 보기
      </button>
    </div>
  )
}

export default App
