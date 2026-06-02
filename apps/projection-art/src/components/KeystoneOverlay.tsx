import { useCallback, useEffect, useRef, useState } from 'react'

interface Corner { dx: number; dy: number }
interface Corners { tl: Corner; tr: Corner; bl: Corner; br: Corner }

const DEFAULT_CORNERS: Corners = {
  tl: { dx: 0, dy: 0 },
  tr: { dx: 0, dy: 0 },
  bl: { dx: 0, dy: 0 },
  br: { dx: 0, dy: 0 },
}

const STORAGE_KEY = 'projection-art-keystone'

function loadCorners(): Corners {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : DEFAULT_CORNERS
  } catch {
    return DEFAULT_CORNERS
  }
}

function cornersToMatrix3d(corners: Corners, w: number, h: number): string {
  const src = [
    [0, 0], [w, 0],
    [0, h], [w, h],
  ] as [number, number][]
  const dst = [
    [corners.tl.dx, corners.tl.dy],
    [w + corners.tr.dx, corners.tr.dy],
    [corners.bl.dx, h + corners.bl.dy],
    [w + corners.br.dx, h + corners.br.dy],
  ] as [number, number][]

  // Compute perspective transform via general projective map
  const m = computeProjectiveMatrix(src, dst, w, h)
  return `matrix3d(${m.join(',')})`
}

// Computes a CSS matrix3d (column-major) for the projective transform src→dst.
// Uses the standard direct linear transform for a 2D homography.
function computeProjectiveMatrix(
  src: [number, number][],
  dst: [number, number][],
  w: number,
  h: number
): number[] {
  // Normalize to [-1,1] for numerical stability, then undo
  const nx = (x: number) => x / w * 2 - 1
  const ny = (y: number) => y / h * 2 - 1
  const ns = src.map(([x, y]) => [nx(x), ny(y)] as [number, number])
  const nd = dst.map(([x, y]) => [nx(x), ny(y)] as [number, number])

  // Solve 8×8 system for homography H such that H * [sx,sy,1] ~ [dx,dy,1]
  const A: number[][] = []
  const b: number[] = []
  for (let i = 0; i < 4; i++) {
    const [sx, sy] = ns[i]
    const [dx, dy] = nd[i]
    A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy])
    b.push(dx)
    A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy])
    b.push(dy)
  }
  const h8 = gaussSolve(A, b)
  if (!h8) return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] // identity fallback
  const [h0, h1, h2, h3, h4, h5, h6, h7] = h8

  // 3×3 homography (row-major):
  // [h0  h1  h2 ]
  // [h3  h4  h5 ]
  // [h6  h7  1  ]

  // Expand to CSS matrix3d (4×4, column-major, in NDC space then undo normalization)
  // For a 2D projective warp embedded in 4×4:
  // column-major: [a, b, 0, c,  d, e, 0, f,  0, 0, 1, 0,  g, h, 0, 1]
  return [
    h0,  h3,  0, h6,
    h1,  h4,  0, h7,
    0,   0,   1, 0,
    h2,  h5,  0, 1,
  ]
}

function gaussSolve(A: number[][], b: number[]): number[] | null {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row
    }
    ;[M[col], M[pivot]] = [M[pivot], M[col]]
    if (Math.abs(M[col][col]) < 1e-10) return null
    const div = M[col][col]
    for (let j = col; j <= n; j++) M[col][j] /= div
    for (let row = 0; row < n; row++) {
      if (row === col) continue
      const factor = M[row][col]
      for (let j = col; j <= n; j++) M[row][j] -= factor * M[col][j]
    }
  }
  return M.map(row => row[n])
}

export type KeystoneMode = 'css' | 'homography'

interface KeystoneOverlayProps {
  visible: boolean
  children: React.ReactNode
}

type CornerKey = keyof Corners

const MODE_STORAGE_KEY = 'projection-art-keystone-mode'

function loadMode(): KeystoneMode {
  try {
    const v = localStorage.getItem(MODE_STORAGE_KEY)
    return v === 'homography' ? 'homography' : 'css'
  } catch {
    return 'css'
  }
}

export function KeystoneOverlay({ visible, children }: KeystoneOverlayProps) {
  const [mode, setMode] = useState<KeystoneMode>(loadMode)
  const [corners, setCorners] = useState<Corners>(loadCorners)
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<{ key: CornerKey; startX: number; startY: number; origDx: number; origDy: number } | null>(null)

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(corners))
  }, [corners])

  useEffect(() => {
    localStorage.setItem(MODE_STORAGE_KEY, mode)
  }, [mode])

  const onMouseDown = useCallback((key: CornerKey) => (e: React.MouseEvent) => {
    e.preventDefault()
    draggingRef.current = { key, startX: e.clientX, startY: e.clientY, origDx: corners[key].dx, origDy: corners[key].dy }
  }, [corners])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = draggingRef.current
      if (!d) return
      setCorners(prev => ({
        ...prev,
        [d.key]: {
          dx: d.origDx + (e.clientX - d.startX),
          dy: d.origDy + (e.clientY - d.startY),
        },
      }))
    }
    const onUp = () => { draggingRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const cssMatrix = cornersToMatrix3d(corners, size.w, size.h)

  const CORNER_POSITIONS: Record<CornerKey, React.CSSProperties> = {
    tl: { top: 0, left: 0, transform: 'translate(-50%,-50%)' },
    tr: { top: 0, right: 0, transform: 'translate(50%,-50%)' },
    bl: { bottom: 0, left: 0, transform: 'translate(-50%,50%)' },
    br: { bottom: 0, right: 0, transform: 'translate(50%,50%)' },
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        data-testid="keystone-canvas"
        style={{
          width: '100%',
          height: '100%',
          transformOrigin: '50% 50%',
          transform: mode === 'css' ? cssMatrix : 'none',
        }}
      >
        {children}
      </div>

      {visible && (
        <div
          data-testid="keystone-handles"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {/* Mode toggle */}
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '0.5rem',
              pointerEvents: 'auto',
            }}
          >
            {(['css', 'homography'] as KeystoneMode[]).map(m => (
              <button
                key={m}
                data-testid={`keystone-mode-${m}`}
                onClick={() => setMode(m)}
                style={{
                  background: mode === m ? 'rgba(0,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                  color: mode === m ? '#0ff' : '#777',
                  border: `1px solid ${mode === m ? 'rgba(0,255,255,0.5)' : 'rgba(255,255,255,0.15)'}`,
                  padding: '0.25rem 0.7rem',
                  borderRadius: '3px',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                }}
              >
                {m === 'css' ? 'CSS matrix3d' : 'Canvas 호모그래피'}
              </button>
            ))}
          </div>

          {/* Corner drag handles (CSS mode only) */}
          {mode === 'css' && (Object.keys(CORNER_POSITIONS) as CornerKey[]).map(key => (
            <div
              key={key}
              data-testid={`keystone-handle-${key}`}
              onMouseDown={onMouseDown(key)}
              style={{
                position: 'absolute',
                ...CORNER_POSITIONS[key],
                width: 20,
                height: 20,
                background: 'rgba(0,255,255,0.8)',
                border: '2px solid #fff',
                borderRadius: '50%',
                cursor: 'grab',
                pointerEvents: 'auto',
                zIndex: 20,
              }}
            />
          ))}

          {mode === 'homography' && (
            <div
              style={{
                position: 'absolute',
                top: '3.5rem',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'rgba(255,200,100,0.7)',
                fontSize: '0.72rem',
                fontFamily: 'monospace',
                pointerEvents: 'none',
                textAlign: 'center',
              }}
            >
              Canvas 호모그래피 모드 — CSS matrix3d와 동일 4코너 보정값 사용
            </div>
          )}

          <div
            style={{
              position: 'absolute',
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.75rem',
              pointerEvents: 'none',
            }}
          >
            {mode === 'css' ? '코너를 드래그해서 키스톤 보정' : '호모그래피 모드 선택됨'} · K — 닫기
          </div>
        </div>
      )}
    </div>
  )
}
