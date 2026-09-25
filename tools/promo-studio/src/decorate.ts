import { random } from 'remotion'
import { SAFE_BOTTOM_Y, SAFE_TOP } from './safezone'

export interface Deco {
  name: string
  x: number
  y: number
  size: number
  delay: number
  rotate: number
}

export interface Zone {
  x0: number
  y0: number
  x1: number
  y1: number
}

const ALL_ICONS = [
  'face-timid.png',
  'face-playful.png',
  'face-aloof.png',
  'face-glutton.png',
  'face-explorer.png',
  'item-star.png',
  'item-heart.png',
  'item-fish.png',
  'item-drumstick.png',
  'item-sparkle.png',
  'item-bulb.png',
  'fx-sparkle.png',
  'heart-full.png',
  'icon-hunger.png',
  'icon-energy.png',
  'icon-affection.png',
]

const overlaps = (x: number, y: number, size: number, zones: Zone[]) =>
  zones.some((z) => x < z.x1 && x + size > z.x0 && y < z.y1 && y + size > z.y0)

/** 이미 배치한 아이콘의 사각 범위(여백 포함)를 새 아이콘과 겹치지 않게 막을 영역으로 되돌린다 */
const toZone = (d: Pick<Deco, 'x' | 'y' | 'size'>, gap = 14): Zone => ({
  x0: d.x - gap,
  y0: d.y - gap,
  x1: d.x + d.size + gap,
  y1: d.y + d.size + gap,
})

/**
 * seed로 결과가 고정되는(렌더할 때마다 같은 그림이 나오는) 무작위 장식 스프라이트 배열을 만든다.
 * 크기(46~136px)와 위치, 회전, 등장 지연이 전부 랜덤이다. exclude로 준 영역(스크린샷·자막 박스)은
 * 물론, 이미 이 함수가 배치한 다른 아이콘과도 겹치지 않도록 최대 30번 다시 뽑는다.
 * y좌표는 기본적으로 안전 영역(SAFE_TOP~SAFE_BOTTOM_Y) 안에서만 뽑는다 — 화면 비율이 다른
 * 기기에서 잘리거나 플랫폼 UI에 가려질 수 있는 맨 위·아래 가장자리는 피한다.
 */
export function randomDecorations(seed: string, count: number, exclude: Zone[], yRange: [number, number] = [SAFE_TOP, SAFE_BOTTOM_Y]): Deco[] {
  const decos: Deco[] = []
  const [yMin, yMax] = yRange
  for (let i = 0; i < count; i++) {
    const placedZones = [...exclude, ...decos.map((d) => toZone(d))]
    let x = 0
    let y = 0
    let size = 90
    let attempt = 0
    for (; attempt < 30; attempt++) {
      const r = (k: string) => random(`${seed}-${i}-${attempt}-${k}`)
      size = 46 + r('size') * 90
      x = r('x') * (1080 - size)
      y = yMin + r('y') * Math.max(0, yMax - yMin - size)
      if (!overlaps(x, y, size, placedZones)) break
    }
    decos.push({
      name: ALL_ICONS[Math.floor(random(`${seed}-${i}-icon`) * ALL_ICONS.length)],
      x,
      y,
      size,
      delay: Math.floor(random(`${seed}-${i}-delay`) * 22),
      rotate: (random(`${seed}-${i}-rot`) - 0.5) * 50,
    })
  }
  return decos
}
