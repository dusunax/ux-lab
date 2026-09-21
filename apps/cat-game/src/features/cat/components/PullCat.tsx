import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { spriteUrl } from './CatAvatar'

/** 드래그 거리 대비 실제 이동 비율 (고무줄처럼 저항감을 준다) */
const RESISTANCE = 0.35
const MAX_OFFSET = 16
const TILT_PER_PX = 0.12

/** 놓았을 때 튀어나오는 소품 (public/sprites) */
const POP_ITEMS = [
  'item-fish', 'item-drumstick', 'item-can', 'item-magnifier', 'item-leaf', 'item-heart', 'item-star',
  'item-sparkle', 'item-note', 'item-drop', 'item-bulb', 'item-scribble', 'fx-puff',
] as const
const POP_SIZE = 19
const POP_RISE = [46, 66] as const
const POP_SPREAD = 44

const clamp = (n: number) => Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, n))
const between = (min: number, max: number) => min + Math.random() * (max - min)

interface Offset {
  x: number
  y: number
}

interface Pop {
  id: number
  sprite: (typeof POP_ITEMS)[number]
  dx: number
  dy: number
}

/**
 * 마우스를 올리면 grab 커서, 잡아당기면 살짝 딸려 오고 놓으면 통통 튕기며 돌아간다.
 * 놓을 때마다 소품 하나가 랜덤으로 튀어나온다.
 */
export function PullCat({ children }: { children: ReactNode }) {
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [pops, setPops] = useState<Pop[]>([])
  const origin = useRef<Offset>({ x: 0, y: 0 })
  const nextPopId = useRef(1)

  const start = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    origin.current = { x: e.clientX, y: e.clientY }
    setDragging(true)
  }

  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    setOffset({
      x: clamp((e.clientX - origin.current.x) * RESISTANCE),
      y: clamp((e.clientY - origin.current.y) * RESISTANCE),
    })
  }

  const end = () => {
    if (!dragging) return
    setDragging(false)
    setOffset({ x: 0, y: 0 })
    const pop: Pop = {
      id: nextPopId.current++,
      sprite: POP_ITEMS[Math.floor(Math.random() * POP_ITEMS.length)],
      dx: between(-POP_SPREAD, POP_SPREAD),
      dy: -between(...POP_RISE),
    }
    setPops((prev) => [...prev, pop])
  }

  const removePop = (id: number) => setPops((prev) => prev.filter((p) => p.id !== id))

  return (
    <div className="pull-wrap">
      <div
        className={`pull${dragging ? ' is-dragging' : ''}`}
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x * TILT_PER_PX}deg)` }}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      >
        {children}
      </div>
      {pops.map((p) => (
        <img
          key={p.id}
          className="pop"
          src={spriteUrl(p.sprite)}
          alt=""
          width={POP_SIZE}
          style={{ '--dx': `${p.dx}px`, '--dy': `${p.dy}px` } as CSSProperties}
          onAnimationEnd={() => removePop(p.id)}
        />
      ))}
    </div>
  )
}
