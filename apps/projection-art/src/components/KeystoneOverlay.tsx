import { useCallback, useEffect, useRef, useState } from 'react'

export interface Corner { dx: number; dy: number }
export interface Corners { tl: Corner; tr: Corner; bl: Corner; br: Corner }
type CornerKey = keyof Corners
type EdgeKey = 't' | 'r' | 'b' | 'l'

export interface ProjectionRect { x: number; y: number; w: number; h: number }
export interface ProjectionTransform { rect: ProjectionRect; warp: Corners }

export const DEFAULT_CORNERS: Corners = {
  tl: { dx: 0, dy: 0 }, tr: { dx: 0, dy: 0 },
  bl: { dx: 0, dy: 0 }, br: { dx: 0, dy: 0 },
}

export const KEYSTONE_STORAGE_KEY = 'projection-art-keystone-v2'

export function defaultTransform(sw: number, sh: number): ProjectionTransform {
  const mx = 16
  const my = 100
  return {
    rect: {
      x: mx,
      y: my,
      w: Math.max(1, sw - mx * 2),
      h: Math.max(1, sh - my * 2),
    },
    warp: DEFAULT_CORNERS,
  }
}

export function loadTransform(): ProjectionTransform {
  const sw = window.innerWidth, sh = window.innerHeight
  try {
    const raw = localStorage.getItem(KEYSTONE_STORAGE_KEY)
    if (!raw) return defaultTransform(sw, sh)
    const parsed = JSON.parse(raw)
    if ('rect' in parsed) return parsed as ProjectionTransform
    return { rect: { x: 0, y: 0, w: sw, h: sh }, warp: parsed as Corners }
  } catch {
    return defaultTransform(sw, sh)
  }
}

const WARP_SENS  = 1
const SCALE_SENS = 1
const MOVE_SENS  = 1
const MIN_RECT_SIZE = 120

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

function getLocalCorners(t: ProjectionTransform) {
  const { rect: r, warp: w } = t
  return {
    tl: [w.tl.dx,       w.tl.dy      ] as [number, number],
    tr: [r.w + w.tr.dx, w.tr.dy      ] as [number, number],
    bl: [w.bl.dx,       r.h + w.bl.dy] as [number, number],
    br: [r.w + w.br.dx, r.h + w.br.dy] as [number, number],
  }
}

function getScreenCorners(t: ProjectionTransform) {
  const { rect: r } = t
  const lc = getLocalCorners(t)
  return {
    tl: [r.x + lc.tl[0], r.y + lc.tl[1]] as [number, number],
    tr: [r.x + lc.tr[0], r.y + lc.tr[1]] as [number, number],
    bl: [r.x + lc.bl[0], r.y + lc.bl[1]] as [number, number],
    br: [r.x + lc.br[0], r.y + lc.br[1]] as [number, number],
  }
}

function transformToMatrix3d(t: ProjectionTransform): string {
  const { rect: r } = t
  const lc = getLocalCorners(t)
  const src: [number, number][] = [[0,0],[r.w,0],[0,r.h],[r.w,r.h]]
  const dst: [number, number][] = [lc.tl, lc.tr, lc.bl, lc.br]
  return `matrix3d(${computeMatrix3d(src, dst).join(',')})`
}

function computeMatrix3d(src: [number,number][], dst: [number,number][]): number[] {
  const A: number[][] = [], b: number[] = []
  for (let i = 0; i < 4; i++) {
    const [sx,sy] = src[i], [dx,dy] = dst[i]
    A.push([sx,sy,1,0,0,0,-dx*sx,-dx*sy]); b.push(dx)
    A.push([0,0,0,sx,sy,1,-dy*sx,-dy*sy]); b.push(dy)
  }
  const h8 = gaussSolve(A, b)
  if (!h8) return [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]
  const [h0,h1,h2,h3,h4,h5,h6,h7] = h8
  return [h0,h3,0,h6, h1,h4,0,h7, 0,0,1,0, h2,h5,0,1]
}

function computeProjection(src: [number,number][], dst: [number,number][]): number[] | null {
  const A: number[][] = [], b: number[] = []
  for (let i = 0; i < 4; i++) {
    const [sx, sy] = src[i], [dx, dy] = dst[i]
    A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy]); b.push(dx)
    A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy]); b.push(dy)
  }
  return gaussSolve(A, b)
}

function projectPoint(m: number[], x: number, y: number): [number, number] {
  const [a, b, c, d, e, f, g, h] = m
  const z = g * x + h * y + 1
  if (Math.abs(z) < 1e-10) return [x, y]
  return [(a * x + b * y + c) / z, (d * x + e * y + f) / z]
}

export function screenToProjectionPoint(t: ProjectionTransform, x: number, y: number): { x: number; y: number; nx: number; ny: number } {
  const { rect: r } = t
  const sc = getScreenCorners(t)
  const matrix = computeProjection(
    [sc.tl, sc.tr, sc.bl, sc.br],
    [[0,0], [r.w,0], [0,r.h], [r.w,r.h]]
  )
  const [px, py] = matrix ? projectPoint(matrix, x, y) : [x - r.x, y - r.y]
  const lx = clamp(px, 0, r.w)
  const ly = clamp(py, 0, r.h)
  return { x: lx, y: ly, nx: lx / r.w, ny: ly / r.h }
}

function gaussSolve(A: number[][], b: number[]): number[] | null {
  const n = b.length, M = A.map((row,i) => [...row,b[i]])
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let row = col+1; row < n; row++) if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row
    ;[M[col],M[pivot]] = [M[pivot],M[col]]
    if (Math.abs(M[col][col]) < 1e-10) return null
    const div = M[col][col]
    for (let j = col; j <= n; j++) M[col][j] /= div
    for (let row = 0; row < n; row++) {
      if (row === col) continue
      const f = M[row][col]
      for (let j = col; j <= n; j++) M[row][j] -= f*M[col][j]
    }
  }
  return M.map(row => row[n])
}

interface KeystoneOverlayProps {
  visible: boolean
  transform: ProjectionTransform
  onTransformChange: (t: ProjectionTransform) => void
  onClose?: () => void
  children: React.ReactNode
}

function Handle({ pos, size = 18, shape = 'circle', cursor = 'grab', color = 'rgba(0,255,255,0.85)', onMouseDown, 'data-testid': testId }: {
  pos: [number, number]
  size?: number
  shape?: 'circle' | 'square' | 'cross'
  cursor?: string
  color?: string
  onMouseDown: (e: React.MouseEvent) => void
  'data-testid'?: string
}) {
  return (
    <div
      data-testid={testId}
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        left: pos[0], top: pos[1],
        transform: 'translate(-50%, -50%)',
        width: size, height: size,
        background: color,
        border: '2px solid rgba(255,255,255,0.9)',
        borderRadius: shape === 'circle' ? '50%' : shape === 'square' ? '3px' : '50%',
        cursor,
        pointerEvents: 'auto',
        zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '10px', color: 'rgba(0,0,0,0.7)', fontWeight: 700,
      }}
    >
      {shape === 'cross' ? '✛' : null}
    </div>
  )
}

export function KeystoneOverlay({ visible, transform, onTransformChange, onClose, children }: KeystoneOverlayProps) {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  const draggingRef = useRef<{
    startX: number; startY: number
    apply: (mdx: number, mdy: number) => ProjectionTransform
  } | null>(null)

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const onCornerDown = useCallback((key: CornerKey) => (e: React.MouseEvent) => {
    e.preventDefault()
    const orig = { ...transform.warp[key] }
    draggingRef.current = {
      startX: e.clientX, startY: e.clientY,
      apply: (mdx, mdy) => ({
        ...transform,
        warp: { ...transform.warp, [key]: { dx: orig.dx + mdx * WARP_SENS, dy: orig.dy + mdy * WARP_SENS } },
      }),
    }
  }, [transform])

  const onEdgeDown = useCallback((edge: EdgeKey) => (e: React.MouseEvent) => {
    e.preventDefault()
    const r = { ...transform.rect }
    draggingRef.current = {
      startX: e.clientX, startY: e.clientY,
      apply: (mdx, mdy) => {
        const vd = mdy * SCALE_SENS, hd = mdx * SCALE_SENS
        if (edge === 't') {
          const h = Math.max(MIN_RECT_SIZE, r.h - vd)
          return { ...transform, rect: { ...r, y: r.y + (r.h - h), h } }
        }
        if (edge === 'b') return { ...transform, rect: { ...r, h: Math.max(MIN_RECT_SIZE, r.h + vd) } }
        if (edge === 'l') {
          const w = Math.max(MIN_RECT_SIZE, r.w - hd)
          return { ...transform, rect: { ...r, x: r.x + (r.w - w), w } }
        }
        return { ...transform, rect: { ...r, w: Math.max(MIN_RECT_SIZE, r.w + hd) } }
      },
    }
  }, [transform])

  const onCenterDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const r = { ...transform.rect }
    draggingRef.current = {
      startX: e.clientX, startY: e.clientY,
      apply: (mdx, mdy) => ({
        ...transform,
        rect: { ...r, x: r.x + mdx * MOVE_SENS, y: r.y + mdy * MOVE_SENS },
      }),
    }
  }, [transform])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = draggingRef.current
      if (!d) return
      onTransformChange(d.apply(e.clientX - d.startX, e.clientY - d.startY))
    }
    const onUp = () => { draggingRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [onTransformChange])

  const cssMatrix = transformToMatrix3d(transform)
  const sc = getScreenCorners(transform)
  const { rect: r } = transform
  const center: [number, number] = [
    (sc.tl[0] + sc.tr[0] + sc.bl[0] + sc.br[0]) / 4,
    (sc.tl[1] + sc.tr[1] + sc.bl[1] + sc.br[1]) / 4,
  ]
  const edgeMids: Record<EdgeKey, [number, number]> = {
    t: [(sc.tl[0] + sc.tr[0]) / 2, (sc.tl[1] + sc.tr[1]) / 2],
    b: [(sc.bl[0] + sc.br[0]) / 2, (sc.bl[1] + sc.br[1]) / 2],
    l: [(sc.tl[0] + sc.bl[0]) / 2, (sc.tl[1] + sc.bl[1]) / 2],
    r: [(sc.tr[0] + sc.br[0]) / 2, (sc.tr[1] + sc.br[1]) / 2],
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: visible ? 10 : 'auto', background: 'transparent' }}>
      <div
        data-testid="keystone-canvas"
        style={{
          position: 'absolute',
          left: r.x,
          top: r.y,
          width: r.w,
          height: r.h,
          transformOrigin: '0 0',
          transform: cssMatrix,
          background: 'transparent',
        }}
      >
        {children}
        {visible && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            viewBox="0 0 100 100" preserveAspectRatio="none">
            {[10,20,30,40,50,60,70,80,90].map(v => (
              <g key={v}>
                <line x1={v} y1="0" x2={v} y2="100" stroke="rgba(0,255,255,0.2)" strokeWidth="0.15" />
                <line x1="0" y1={v} x2="100" y2={v} stroke="rgba(0,255,255,0.2)" strokeWidth="0.15" />
              </g>
            ))}
            <rect x="0.3" y="0.3" width="99.4" height="99.4" fill="none" stroke="rgba(0,255,255,0.6)" strokeWidth="0.5" />
          </svg>
        )}
      </div>

      {visible && (
        <div data-testid="keystone-handles"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50 }}>

          {/* Outline SVG */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h}
              fill="none" stroke="rgba(0,255,255,0.15)" strokeWidth="1" strokeDasharray="4,4" />
            <polygon
              points={[sc.tl, sc.tr, sc.br, sc.bl].map(p => `${p[0]},${p[1]}`).join(' ')}
              fill="none" stroke="rgba(0,255,255,0.55)" strokeWidth="1.5" strokeDasharray="6,4" />
          </svg>

          {/* Center move handle */}
          <Handle pos={center} size={22} shape="cross" cursor="move"
            color="rgba(0,200,255,0.5)" onMouseDown={onCenterDown} />

          {/* Corner handles (warp) */}
          {(Object.keys(sc) as CornerKey[]).map(key => (
            <Handle key={key} pos={sc[key]} size={18} shape="circle" cursor="grab"
              color="rgba(0,255,255,0.85)"
              onMouseDown={onCornerDown(key)}
              data-testid={`keystone-handle-${key}`} />
          ))}

          {/* Edge handles (scale) */}
          {(Object.keys(edgeMids) as EdgeKey[]).map(key => (
            <Handle key={key} pos={edgeMids[key]} size={14} shape="square"
              cursor={key === 't' || key === 'b' ? 'ns-resize' : 'ew-resize'}
              color="rgba(0,180,255,0.65)"
              onMouseDown={onEdgeDown(key)}
              data-testid={`keystone-handle-${key}`} />
          ))}

          {/* Controls */}
          <div style={{ position: 'absolute', top: 'calc(5.5rem - 20px)', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'auto', display: 'flex', gap: '0.4rem' }}>
            <button data-testid="keystone-reset"
              onClick={() => onTransformChange(defaultTransform(size.w, size.h))}
              style={{ background: 'rgba(255,100,100,0.1)', color: 'rgba(255,150,150,0.8)', border: '1px solid rgba(255,100,100,0.3)', padding: '0.25rem 0.7rem', borderRadius: '3px', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'monospace' }}>
              초기화
            </button>
            {onClose && (
              <button data-testid="keystone-apply" onClick={onClose}
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(200,200,200,0.8)', border: '1px solid rgba(255,255,255,0.18)', padding: '0.25rem 0.7rem', borderRadius: '3px', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'monospace' }}>
                적용
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
