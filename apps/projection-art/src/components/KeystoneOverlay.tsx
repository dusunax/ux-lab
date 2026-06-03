import { useCallback, useEffect, useRef, useState } from 'react'

export interface Corner { dx: number; dy: number }
export interface Corners { tl: Corner; tr: Corner; bl: Corner; br: Corner }
type CornerKey = keyof Corners

export const DEFAULT_CORNERS: Corners = {
  tl: { dx: 0, dy: 0 },
  tr: { dx: 0, dy: 0 },
  bl: { dx: 0, dy: 0 },
  br: { dx: 0, dy: 0 },
}

export const KEYSTONE_STORAGE_KEY = 'projection-art-keystone'

export function loadCorners(): Corners {
  try {
    const raw = localStorage.getItem(KEYSTONE_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Corners) : DEFAULT_CORNERS
  } catch {
    return DEFAULT_CORNERS
  }
}

function cornersToMatrix3d(c: Corners, w: number, h: number): string {
  const src: [number, number][] = [[0,0],[w,0],[0,h],[w,h]]
  const dst: [number, number][] = [
    [c.tl.dx,       c.tl.dy      ],
    [w+c.tr.dx,     c.tr.dy      ],
    [c.bl.dx,       h+c.bl.dy    ],
    [w+c.br.dx,     h+c.br.dy    ],
  ]
  const m = computeHomography(src, dst, w, h)
  return `matrix3d(${m.join(',')})`
}

function computeHomography(
  src: [number, number][],
  dst: [number, number][],
  w: number, h: number
): number[] {
  const nx = (x: number) => x / w * 2 - 1
  const ny = (y: number) => y / h * 2 - 1
  const ns = src.map(([x,y]) => [nx(x), ny(y)] as [number,number])
  const nd = dst.map(([x,y]) => [nx(x), ny(y)] as [number,number])
  const A: number[][] = []
  const b: number[] = []
  for (let i = 0; i < 4; i++) {
    const [sx,sy] = ns[i], [dx,dy] = nd[i]
    A.push([sx,sy,1,0,0,0,-dx*sx,-dx*sy]); b.push(dx)
    A.push([0,0,0,sx,sy,1,-dy*sx,-dy*sy]); b.push(dy)
  }
  const h8 = gaussSolve(A, b)
  if (!h8) return [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]
  const [h0,h1,h2,h3,h4,h5,h6,h7] = h8
  return [h0,h3,0,h6, h1,h4,0,h7, 0,0,1,0, h2,h5,0,1]
}

function gaussSolve(A: number[][], b: number[]): number[] | null {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let row = col+1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row
    }
    ;[M[col], M[pivot]] = [M[pivot], M[col]]
    if (Math.abs(M[col][col]) < 1e-10) return null
    const div = M[col][col]
    for (let j = col; j <= n; j++) M[col][j] /= div
    for (let row = 0; row < n; row++) {
      if (row === col) continue
      const f = M[row][col]
      for (let j = col; j <= n; j++) M[row][j] -= f * M[col][j]
    }
  }
  return M.map(row => row[n])
}

interface KeystoneOverlayProps {
  visible: boolean
  corners: Corners
  onCornersChange: (corners: Corners) => void
  children: React.ReactNode
}

const HANDLE_POS: Record<CornerKey, React.CSSProperties> = {
  tl: { top: '1.5rem',    left: '1.5rem'  },
  tr: { top: '1.5rem',    right: '1.5rem' },
  bl: { bottom: '1.5rem', left: '1.5rem'  },
  br: { bottom: '1.5rem', right: '1.5rem' },
}

export function KeystoneOverlay({ visible, corners, onCornersChange, children }: KeystoneOverlayProps) {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  const draggingRef = useRef<{
    key: CornerKey; startX: number; startY: number; origDx: number; origDy: number
  } | null>(null)

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const onMouseDown = useCallback((key: CornerKey) => (e: React.MouseEvent) => {
    e.preventDefault()
    draggingRef.current = { key, startX: e.clientX, startY: e.clientY, origDx: corners[key].dx, origDy: corners[key].dy }
  }, [corners])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = draggingRef.current
      if (!d) return
      onCornersChange({
        ...corners,
        [d.key]: {
          dx: d.origDx + (e.clientX - d.startX) * 0.02,
          dy: d.origDy + (e.clientY - d.startY) * 0.02,
        },
      })
    }
    const onUp = () => { draggingRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [corners, onCornersChange])

  const cssMatrix = cornersToMatrix3d(corners, size.w, size.h)

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        data-testid="keystone-canvas"
        style={{
          width: '100%', height: '100%',
          transformOrigin: '50% 50%',
          transform: cssMatrix,
          transition: 'transform 0.12s ease-out',
        }}
      >
        {children}

        {visible && (
          <>
            <svg
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {[10,20,30,40,50,60,70,80,90].map(v => (
                <g key={v}>
                  <line x1={v} y1="0" x2={v} y2="100" stroke="rgba(0,255,255,0.2)" strokeWidth="0.15" />
                  <line x1="0" y1={v} x2="100" y2={v} stroke="rgba(0,255,255,0.2)" strokeWidth="0.15" />
                </g>
              ))}
              <rect x="0.3" y="0.3" width="99.4" height="99.4" fill="none" stroke="rgba(0,255,255,0.65)" strokeWidth="0.5" />
            </svg>

            {(Object.keys(HANDLE_POS) as CornerKey[]).map(key => (
              <div
                key={key}
                data-testid={`keystone-handle-${key}`}
                onMouseDown={onMouseDown(key)}
                style={{
                  position: 'absolute',
                  ...HANDLE_POS[key],
                  width: 18, height: 18,
                  background: 'rgba(0,255,255,0.85)',
                  border: '2px solid #fff',
                  borderRadius: '50%',
                  cursor: 'grab',
                  pointerEvents: 'auto',
                  zIndex: 20,
                }}
              />
            ))}
          </>
        )}
      </div>

      {visible && (
        <div
          data-testid="keystone-handles"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50 }}
        >
          <div style={{
            position: 'absolute', top: '5.5rem', left: '50%',
            transform: 'translateX(-50%)', pointerEvents: 'auto',
          }}>
            <button
              data-testid="keystone-reset"
              onClick={() => onCornersChange(DEFAULT_CORNERS)}
              style={{
                background: 'rgba(255,100,100,0.1)',
                color: 'rgba(255,150,150,0.8)',
                border: '1px solid rgba(255,100,100,0.3)',
                padding: '0.25rem 0.7rem',
                borderRadius: '3px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                fontFamily: 'monospace',
              }}
            >
              초기화
            </button>
          </div>
          <div style={{
            position: 'absolute', bottom: '2rem', left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.75rem',
            pointerEvents: 'none',
          }}>
            코너를 드래그해서 키스톤 보정 · K — 닫기
          </div>
        </div>
      )}
    </div>
  )
}
