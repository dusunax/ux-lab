import type { FrameRateState } from '../hooks/useFrameRate'

interface FpsOverlayProps {
  state: FrameRateState
  visible?: boolean
}

const TARGET_FPS = 60
const WARN_THRESHOLD = 50

function fpsColor(fps: number): string {
  if (fps >= TARGET_FPS) return '#0f0'
  if (fps >= WARN_THRESHOLD) return '#ff0'
  return '#f44'
}

export function FpsOverlay({ state, visible = true }: FpsOverlayProps) {
  if (!visible) return null

  const color = fpsColor(state.avgFps)

  return (
    <div
      data-testid="fps-overlay"
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        background: 'rgba(0,0,0,0.65)',
        border: `1px solid ${color}`,
        color,
        fontFamily: 'monospace',
        fontSize: '0.75rem',
        padding: '0.4rem 0.75rem',
        borderRadius: '4px',
        lineHeight: 1.6,
        userSelect: 'none',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <div>FPS {String(state.fps).padStart(3, ' ')}</div>
      <div style={{ color: '#aaa' }}>
        avg {state.avgFps}  min {state.minFps === Infinity ? '--' : state.minFps}
      </div>
      <div style={{ color: '#666' }}>{state.frameTime}ms</div>
    </div>
  )
}
